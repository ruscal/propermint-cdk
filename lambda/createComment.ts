import { DynamoDB, SQS } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { CommentStatus, FieldRequest, ReactionType } from './types';
import { getPost } from './utilities/channelsClient';
import {
    getChannelPostKey,
    getReactionPrimaryKey
} from './utilities/getPrimaryKey';
import { getCommentSortKey, getPostSortKey } from './utilities/getSortKey';

const docClient = new DynamoDB.DocumentClient();
const processReactionsQueue = process.env.PROCESS_REACTIONS_QUEUE!;

const sqs = new SQS({ apiVersion: '2012-11-05', region: 'us-east-1' });

export interface CreateCommentRequest {
    comment: {
        commentId: string;
        postId: string;
        postTimestamp: number;
        channelId: string;
        comment: string;
    };
}

export async function createComment({
    identity,
    arguments: { comment }
}: FieldRequest<CreateCommentRequest>) {
    const username = identity?.username;
    if (!username) {
        throw new Error('Cannot create comment, invalid user');
    }

    const post = await getPost(docClient, comment.postId);
    if (!post) {
        throw new Error('Cannot comment on post, invalid post');
    }

    const timestamp = Math.floor(new Date().getTime() / 1000);
    const item = {
        ...comment,
        timestamp,
        author: username,
        status: CommentStatus.Live,
        pk: getReactionPrimaryKey(comment.channelId, username),
        sk: getPostSortKey(comment.postId, comment.postTimestamp),
        channelPost: getChannelPostKey(comment.channelId, comment.postId),
        reactionTimestamp: getCommentSortKey(timestamp),
        reactionType: ReactionType.Comment,
        totalLikes: 0,
        topLikes: []
    };
    const params: DocumentClient.PutItemInput = {
        TableName: process.env.REACTIONS_TABLE!,
        Item: item
    };
    try {
        await docClient.put(params).promise();
        await sqs
            .sendMessage({
                QueueUrl: processReactionsQueue,
                MessageBody: JSON.stringify({
                    channelId: comment.channelId,
                    postId: comment.postId,
                    commentId: comment.commentId,
                    reactionType: ReactionType.Comment
                })
            })
            .promise();
        return item;
    } catch (err) {
        console.log('Error creating post: ', err);
        return null;
    }
}

export default createComment;

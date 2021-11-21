import { DynamoDB, SQS } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { CommentStatus, FieldRequest, ReactionType } from './types';
import { getLikeId } from './utilities/getLikeId';
import {
    getChannelPostKey,
    getReactionPrimaryKey
} from './utilities/getPrimaryKey';
import { getLikeSortKey, getPostSortKey } from './utilities/getSortKey';
import { getComment } from './utilities/reactionsClient';

const docClient = new DynamoDB.DocumentClient();
const processReactionsQueue = process.env.PROCESS_REACTIONS_QUEUE!;

const sqs = new SQS({ apiVersion: '2012-11-05', region: 'us-east-1' });

export interface LikeCommentRequest {
    commentId: string;
}

export async function likeComment({
    identity,
    arguments: { commentId }
}: FieldRequest<LikeCommentRequest>) {
    const username = identity?.username;
    if (!username) {
        throw new Error('Cannot like comment, invalid user');
    }

    const comment = await getComment(docClient, commentId);
    if (!comment) {
        throw new Error('Cannot like comment, invalid comment');
    }

    const timestamp = Math.floor(new Date().getTime() / 1000);
    const item = {
        channelId: comment.channelId,
        postId: comment.postId,
        likeId: getLikeId(comment.channelId, comment.postId, commentId, username),
        commentId,
        timestamp,
        author: username,
        status: CommentStatus.Live,
        pk: getReactionPrimaryKey(comment.channelId, username),
        sk: getPostSortKey(comment.postId, comment.postTimestamp),
        channelPost: getChannelPostKey(comment.channelId, comment.postId),
        reactionTimestamp: getLikeSortKey(timestamp),
        reactionType: ReactionType.Like
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
                    commentId,
                    reactionType: ReactionType.Like
                })
            })
            .promise();
        return item;
    } catch (err) {
        console.log('Error liking comment: ', err);
        return null;
    }
}

export default likeComment;

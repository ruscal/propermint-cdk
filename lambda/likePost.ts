import { DynamoDB, SQS } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { CommentStatus, FieldRequest, ReactionType } from './types';
import { getPost } from './utilities/channelsClient';
import { getLikeId } from './utilities/getLikeId';
import {
    getChannelPostKey,
    getReactionPrimaryKey
} from './utilities/getPrimaryKey';
import { getLikeSortKey, getPostSortKey } from './utilities/getSortKey';

const docClient = new DynamoDB.DocumentClient();
const processReactionsQueue = process.env.PROCESS_REACTIONS_QUEUE!;

const sqs = new SQS({ apiVersion: '2012-11-05', region: 'us-east-1' });

export interface LikePostRequest {
    postId: string;
}

export async function likePost({
    identity,
    arguments: { postId }
}: FieldRequest<LikePostRequest>) {
    const username = identity?.username;
    if (!username) {
        throw new Error('Cannot like post, invalid user');
    }

    const post = await getPost(docClient, postId);
    if (!post) {
        throw new Error('Cannot like post, invalid post');
    }

    const timestamp = Math.floor(new Date().getTime() / 1000);
    const item = {
        channelId: post.channelId,
        postId,
        likeId: getLikeId(post.channelId, postId, username),
        timestamp,
        author: username,
        status: CommentStatus.Live,
        pk: getReactionPrimaryKey(post.channelId, username),
        sk: getPostSortKey(postId, post.timestamp),
        channelPost: getChannelPostKey(post.channelId, postId),
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
                    channelId: post.channelId,
                    postId,
                    reactionType: ReactionType.Like
                })
            })
            .promise();
        return item;
    } catch (err) {
        console.log('Error liking post: ', err);
        return null;
    }
}

export default likePost;

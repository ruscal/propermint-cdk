import { DynamoDB, SQS } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { FieldRequest, PostStatus } from './types';
import { getChannelUserKey } from './utilities/getChannelUserKey';
import { getPrimaryKey } from './utilities/getPrimaryKey';
import { getSortKeyForPost } from './utilities/getSortKey';

const docClient = new DynamoDB.DocumentClient();
const processPostQueue = process.env.PROCESS_POST_QUEUE!;

const sqs = new SQS({ apiVersion: '2012-11-05', region: 'us-east-1' });

export interface CreatePostRequest {
    post: {
        postId: string;
        channelId: string;
        title: string;
        content: string;
        imagePath: string;
    };
}

export async function createPost({
    identity,
    arguments: { post }
}: FieldRequest<CreatePostRequest>) {
    const username = identity?.username;
    if (!username) {
        throw new Error('Cannot create post, invalid user');
    }
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const item = {
        ...post,
        timestamp,
        author: username,
        status: PostStatus.Processing,
        pk: getPrimaryKey(post.channelId),
        sk: getSortKeyForPost(post.postId, timestamp),
        channelUser: getChannelUserKey(post.channelId, username)
    };
    const params: DocumentClient.PutItemInput = {
        TableName: process.env.CHANNELS_TABLE!,
        Item: item
    };
    try {
        await docClient.put(params).promise();
        await sqs
            .sendMessage({
                QueueUrl: processPostQueue,
                MessageBody: JSON.stringify({ postId: post.postId })
            })
            .promise();
        return item;
    } catch (err) {
        console.log('Error creating post: ', err);
        return null;
    }
}

export default createPost;

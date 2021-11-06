import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { FieldRequest } from './types';
import { getChannelUserKey } from './utilities/getChannelUserKey';
import { getPrimaryKey } from './utilities/getPrimaryKey';
import { getSortKeyForPost } from './utilities/getSortKey';

const docClient = new DynamoDB.DocumentClient();

export interface CreatePostRequest {
    post: {
        postId: string;
        channelId: string;
        title: string;
        content: string;
    };
}

export async function createPost({
    identity: { username },
    arguments: { post }
}: FieldRequest<CreatePostRequest>) {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const item = {
        ...post,
        timestamp,
        author: username,
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
        return item;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createPost;

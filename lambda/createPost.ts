import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Post } from './types';
import { v4 as uuid } from 'uuid';

const docClient = new DynamoDB.DocumentClient();

async function createPost(post: Post, username: string) {
    if (!post.id) {
        post.id = uuid();
    }
    const postData = { ...post, owner: username };
    const params: DocumentClient.PutItemInput = {
        TableName: process.env.POST_TABLE!,
        Item: postData
    };
    try {
        await docClient.put(params).promise();
        return postData;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createPost;

import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { FieldRequest, Post } from './types';
import { getPost } from './utilities/getPost';
import { getPrimaryKey } from './utilities/getPrimaryKey';
import { getSortKeyForPost } from './utilities/getSortKey';

const docClient = new DynamoDB.DocumentClient();

export interface UpdatePostRequest {
    post: {
        postId: string;
        channelId: string;
        title: string;
        content: string;
    };
}

export async function updatePost({
    identity,
    arguments: { post }
}: FieldRequest<UpdatePostRequest>) {
    try {
        const username = identity?.username;
        if (!username) {
            throw new Error('Cannot update post, invalid user');
        }
        const oldPost = await getPost(docClient, post.postId);

        if (!oldPost) {
            console.log(
                `Failed to update post, post not found for postId: ${post.postId}`
            );
            return null;
        }

        let params: DocumentClient.UpdateItemInput = {
            TableName: process.env.CHANNELS_TABLE!,
            Key: {
                pk: getPrimaryKey(oldPost.channelId),
                sk: getSortKeyForPost(oldPost.postId, oldPost.timestamp)
            },
            UpdateExpression: '',
            ExpressionAttributeNames: {
                '#author': 'author'
            },
            ExpressionAttributeValues: {
                ':author': username
            },
            ReturnValues: 'UPDATED_NEW'
        };
        let prefix = 'set ';
        let attributes = Object.keys(post) as (keyof typeof post)[];
        for (let i = 0; i < attributes.length; i++) {
            let attribute = attributes[i];
            if (attribute !== 'postId') {
                params.UpdateExpression +=
                    prefix + '#' + attribute + ' = :' + attribute;
                params.ExpressionAttributeValues![':' + attribute] =
                    post[attribute];
                params.ExpressionAttributeNames!['#' + attribute] = attribute;
                prefix = ', ';
            }
        }

        await docClient.update(params).promise();
        return post;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default updatePost;

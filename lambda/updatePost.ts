import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Post } from './types';

const docClient = new DynamoDB.DocumentClient();

async function updatePost(post: Post, username: string) {
    let params: DocumentClient.UpdateItemInput = {
        TableName: process.env.POST_TABLE!,
        Key: {
            id: post.id
        },
        UpdateExpression: '',
        ConditionExpression: '#owner = :owner',
        ExpressionAttributeNames: {
            '#owner': 'owner'
        },
        ExpressionAttributeValues: {
            ':owner': username
        },
        ReturnValues: 'UPDATED_NEW'
    };
    let prefix = 'set ';
    let attributes = Object.keys(post) as (keyof typeof post)[];
    for (let i = 0; i < attributes.length; i++) {
        let attribute = attributes[i];
        if (attribute !== 'id') {
            params.UpdateExpression +=
                prefix + '#' + attribute + ' = :' + attribute;
            params.ExpressionAttributeValues![':' + attribute] =
                post[attribute];
            params.ExpressionAttributeNames!['#' + attribute] = attribute;
            prefix = ', ';
        }
    }
    try {
        await docClient.update(params).promise();
        return post;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default updatePost;

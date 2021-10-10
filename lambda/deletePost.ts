import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const docClient = new DynamoDB.DocumentClient();

async function deletePost(postId: string, username: string) {
    const params: DocumentClient.DeleteItemInput = {
        TableName: process.env.POST_TABLE!,
        Key: {
            id: postId
        },
        ConditionExpression: '#owner = :owner',
        ExpressionAttributeNames: {
            '#owner': 'owner'
        },
        ExpressionAttributeValues: {
            ':owner': username
        }
    };
    try {
        await docClient.delete(params).promise();
        return postId;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default deletePost;

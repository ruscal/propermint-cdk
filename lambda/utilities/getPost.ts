import { DynamoDB } from 'aws-sdk';
import { Post } from '../types';

export async function getPost(
    dynamoDbClient: DynamoDB.DocumentClient,
    postId: string
) {
    const queryPostResults = await dynamoDbClient
        .query({
            TableName: process.env.CHANNELS_TABLE!,
            IndexName: 'posts',
            KeyConditionExpression: `postId = :postId`,
            ExpressionAttributeValues: {
                ':postId': postId
            }
        })
        .promise();

    return queryPostResults.Items && (queryPostResults.Items[0] as Post);
}

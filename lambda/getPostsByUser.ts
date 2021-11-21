import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { FieldRequest } from './types';
import { getChannelUserKey } from './utilities/getPrimaryKey';

const docClient = new DynamoDB.DocumentClient();

export interface GetPostsByUserRequest {
    channelId: string;
}

export async function getPostsByUser({
    identity,
    arguments: { channelId }
}: FieldRequest<GetPostsByUserRequest>) {
    const username = identity?.username;
    if (!username) {
        throw new Error('Cannot get posts, invalid user');
    }
    const params: DocumentClient.QueryInput = {
        TableName: process.env.CHANNELS_TABLE!,
        IndexName: 'postsByUser',
        KeyConditionExpression: 'channelUser = :channelUser',
        ExpressionAttributeValues: {
            ':channelUser': getChannelUserKey(channelId, username)
        },
        ScanIndexForward: false
    };

    try {
        const data = await docClient.query(params).promise();
        return data.Items;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        throw err;
    }
}

export default getPostsByUser;

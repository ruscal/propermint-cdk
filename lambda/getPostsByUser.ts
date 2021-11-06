import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { FieldRequest } from './types';
import { getChannelUserKey } from './utilities/getChannelUserKey';

const docClient = new DynamoDB.DocumentClient();

export interface GetPostsByUserRequest {
    channelId: string;
}

export async function getPostsByUser({
    identity: { username },
    arguments: { channelId }
}: FieldRequest<GetPostsByUserRequest>) {
    const params: DocumentClient.QueryInput = {
        TableName: process.env.CHANNELS_TABLE!,
        IndexName: 'postsByUsername',
        KeyConditionExpression: 'channelUser = :channelUser',
        ExpressionAttributeValues: {
            ':channelUser': getChannelUserKey(channelId, username)
        }
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
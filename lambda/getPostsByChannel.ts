import { DynamoDB } from 'aws-sdk';
import { FieldRequest } from './types';
import { getPrimaryKey } from './utilities/getPrimaryKey';

const docClient = new DynamoDB.DocumentClient();

export interface GetPostsByChannelRequest {
    channelId: string;
}

export async function getPostsByChannel({
    arguments: { channelId }
}: FieldRequest<GetPostsByChannelRequest>) {
    try {
        const data = await docClient
            .query({
                TableName: process.env.CHANNELS_TABLE!,
                KeyConditionExpression: `pk = :pk`,
                FilterExpression: `attribute_exists(postId)`,
                ExpressionAttributeValues: {
                    ':pk': getPrimaryKey(channelId)
                }
            })
            .promise();
        return data.Items;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default getPostsByChannel;

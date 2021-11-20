import { DynamoDB } from 'aws-sdk';
import { FieldRequest, PostStatus } from './types';
import { getPrimaryKey } from './utilities/getPrimaryKey';

const docClient = new DynamoDB.DocumentClient();

export interface GetPostsByChannelRequest {
    channelId: string;
}

export async function getPostsByChannel({
    arguments: { channelId },
    identity
}: FieldRequest<GetPostsByChannelRequest>) {
    const username = identity?.username;
    try {
        const data = await docClient
            .query({
                TableName: process.env.CHANNELS_TABLE!,
                KeyConditionExpression: `pk = :pk`,
                FilterExpression: `attribute_exists(postId) and (#status = :statusLive or (#status = :statusProcessing and author = :author))`,
                ExpressionAttributeValues: {
                    ':pk': getPrimaryKey(channelId),
                    ':statusLive': PostStatus.Live,
                    ':statusProcessing': PostStatus.Processing,
                    ':author': username || null
                },
                ExpressionAttributeNames: {
                    '#status': 'status'
                }
            })
            .promise();
        return data.Items;
    } catch (err) {
        console.log(
            `DynamoDB error (${process.env.CHANNELS_TABLE}::${username}): `,
            err
        );
        return null;
    }
}

export default getPostsByChannel;

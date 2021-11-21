import { DynamoDB } from 'aws-sdk';
import { FieldRequest } from './types';
import { getChannelPosts } from './utilities/channelsClient';

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
        const posts = await getChannelPosts(docClient, channelId, username);
        return posts;
    } catch (err) {
        console.log(
            `DynamoDB error (${process.env.CHANNELS_TABLE}::${username}): `,
            err
        );
        return null;
    }
}

export default getPostsByChannel;

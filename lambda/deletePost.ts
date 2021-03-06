import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { FieldRequest, Post } from './types';
import { getPost } from './utilities/channelsClient';
import { getChannelPrimaryKey } from './utilities/getPrimaryKey';
import { getPostSortKey as getPostSortKey } from './utilities/getSortKey';

const docClient = new DynamoDB.DocumentClient();

export interface DeletePostRequest {
    postId: string;
}

export async function deletePost({
    identity,
    arguments: { postId }
}: FieldRequest<DeletePostRequest>) {
    try {
        const username = identity?.username;
        if (!username) {
            throw new Error('Cannot delete post, invalid user');
        }
        const post = await getPost(docClient, postId);

        if (!post) {
            console.log(
                `Failed to delete post, post not found for postId: ${postId}`
            );
            return null;
        }

        const params: DocumentClient.DeleteItemInput = {
            TableName: process.env.CHANNELS_TABLE!,
            Key: {
                pk: getChannelPrimaryKey(post.channelId),
                sk: getPostSortKey(post.postId, post.timestamp)
            }
        };

        await docClient.delete(params).promise();
        console.log(`Post ${postId} deleted by ${username}`);
        return postId;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default deletePost;

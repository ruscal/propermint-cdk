import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { FieldRequest, Post } from './types';
import { getPost } from './utilities/getPost';
import { getPrimaryKey } from './utilities/getPrimaryKey';
import { getSortKeyForPost as getPostSortKey } from './utilities/getSortKey';

const docClient = new DynamoDB.DocumentClient();

export interface DeletePostRequest {
    postId: string;
}

export async function deletePost({
    identity: { username },
    arguments: { postId }
}: FieldRequest<DeletePostRequest>) {
    try {
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
                pk: getPrimaryKey(post.channelId),
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

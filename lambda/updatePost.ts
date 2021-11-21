import { DynamoDB } from 'aws-sdk';
import { FieldRequest } from './types';
import { getPost } from './utilities/channelsClient';

const docClient = new DynamoDB.DocumentClient();

export interface UpdatePostRequest {
    post: {
        postId: string;
        channelId: string;
        title: string;
        content: string;
    };
}

export async function updatePost({
    identity,
    arguments: { post }
}: FieldRequest<UpdatePostRequest>) {
    try {
        const username = identity?.username;
        if (!username) {
            throw new Error('Cannot update post, invalid user');
        }
        const oldPost = await getPost(docClient, post.postId);

        if (!oldPost) {
            console.log(
                `Failed to update post, post not found for postId: ${post.postId}`
            );
            return null;
        }

        return post;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default updatePost;

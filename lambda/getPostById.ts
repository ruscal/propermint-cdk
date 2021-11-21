import { DynamoDB } from 'aws-sdk';
import { FieldRequest } from './types';
import { getPost } from './utilities/channelsClient';
const docClient = new DynamoDB.DocumentClient();

export interface GetPostByIdRequest {
    postId: string;
}

export async function getPostById({
    arguments: { postId }
}: FieldRequest<GetPostByIdRequest>) {
    try {
        const post = await getPost(docClient, postId);
        return post;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        throw err;
    }
}

export default getPostById;

import { DynamoDB } from 'aws-sdk';
import { FieldRequest } from './types';
import { deleteComment, getComment } from './utilities/reactionsClient';

const docClient = new DynamoDB.DocumentClient();

export interface DeleteCommentRequest {
    commentId: string;
}

export async function unlikeComment({
    identity,
    arguments: { commentId }
}: FieldRequest<DeleteCommentRequest>) {
    try {
        const username = identity?.username;
        if (!username) {
            throw new Error('Cannot delete comment, invalid user');
        }

        const comment = await getComment(docClient, commentId);
        if (!comment) {
            throw new Error('Cannot delete comment, invalid comment');
        }

        await deleteComment(docClient, comment);
        console.log(`Comment ${commentId} deleted by ${username}`);
        return null;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default unlikeComment;

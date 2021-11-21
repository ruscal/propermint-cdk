import { DynamoDB } from 'aws-sdk';
import { FieldRequest } from './types';
import { getLikeId } from './utilities/getLikeId';
import { deleteLike, getComment, getLike } from './utilities/reactionsClient';

const docClient = new DynamoDB.DocumentClient();

export interface UnlikeCommentRequest {
    commentId: string;
}

export async function unlikeComment({
    identity,
    arguments: { commentId }
}: FieldRequest<UnlikeCommentRequest>) {
    try {
        const username = identity?.username;
        if (!username) {
            throw new Error('Cannot unlike comment, invalid user');
        }

        const comment = await getComment(docClient, commentId);
        if (!comment) {
            throw new Error('Cannot unlike comment, invalid comment');
        }

        const likeId = getLikeId(
            comment.channelId,
            comment.postId,
            username,
            comment.commentId
        );
        const like = await getLike(docClient, likeId);

        if (!like) {
            console.log(
                `Failed to unlike comment, like not found for likeId: ${likeId}`
            );
            return null;
        }

        await deleteLike(docClient, like);
        console.log(`Comment ${commentId} unliked by ${username}`);
        return null;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default unlikeComment;

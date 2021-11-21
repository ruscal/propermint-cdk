import { DynamoDB } from 'aws-sdk';
import { FieldRequest } from './types';
import { getPost } from './utilities/channelsClient';
import { getLikeId } from './utilities/getLikeId';
import { deleteLike, getLike } from './utilities/reactionsClient';

const docClient = new DynamoDB.DocumentClient();

export interface UnlikePostRequest {
    postId: string;
}

export async function unlikePost({
    identity,
    arguments: { postId }
}: FieldRequest<UnlikePostRequest>) {
    try {
        const username = identity?.username;
        if (!username) {
            throw new Error('Cannot unlike post, invalid user');
        }

        const post = await getPost(docClient, postId);
        if (!post) {
            throw new Error('Cannot unlike post, invalid post');
        }

        const likeId = getLikeId(post.channelId, post.postId, username);
        const like = await getLike(docClient, likeId);

        if (!like) {
            console.log(
                `Failed to unlike post, like not found for likeId: ${likeId}`
            );
            return null;
        }

        await deleteLike(docClient, like);
        console.log(`Post ${postId} unliked by ${username}`);
        return null;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default unlikePost;

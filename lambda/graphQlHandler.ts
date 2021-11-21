import { createPost, CreatePostRequest } from './createPost';
import { deletePost, DeletePostRequest } from './deletePost';
import { getPostById, GetPostByIdRequest } from './getPostById';
import { updatePost, UpdatePostRequest } from './updatePost';
import { getPostsByUser, GetPostsByUserRequest } from './getPostsByUser';
import { AppSyncEvent, FieldRequest } from './types';
import {
    getPostsByChannel,
    GetPostsByChannelRequest
} from './getPostsByChannel';
import { createComment, CreateCommentRequest } from './createComment';
import { likePost, LikePostRequest } from './likePost';
import { likeComment, LikeCommentRequest } from './likeComment';
import { unlikePost, UnlikePostRequest } from './unlikePost';
import { unlikeComment, UnlikeCommentRequest } from './unlikeComment';

export const handler = async (event: AppSyncEvent) => {
    switch (event.info.fieldName) {
        case 'getPostById':
            // TODO: type guard / validate
            const getPostRequest = event as FieldRequest<GetPostByIdRequest>;
            return await getPostById(getPostRequest);
        case 'createPost': {
            // TODO: type guard / validate
            const createPostRequest = event as FieldRequest<CreatePostRequest>;
            return await createPost(createPostRequest);
        }
        case 'listPosts':
            // TODO: type guard / validate
            const getPostsByChannelRequest =
                event as FieldRequest<GetPostsByChannelRequest>;
            return await getPostsByChannel(getPostsByChannelRequest);
        case 'deletePost': {
            // TODO: type guard / validate
            const deletePostRequest = event as FieldRequest<DeletePostRequest>;
            return await deletePost(deletePostRequest);
        }
        case 'updatePost': {
            // TODO: type guard / validate
            const updatePostRequest = event as FieldRequest<UpdatePostRequest>;
            return await updatePost(updatePostRequest);
        }
        case 'postsByUsername': {
            // TODO: type guard / validate
            const getPostsByUserRequest =
                event as FieldRequest<GetPostsByUserRequest>;
            return await getPostsByUser(getPostsByUserRequest);
        }
        case 'createComment': {
            // TODO: type guard / validate
            const createCommentRequest =
                event as FieldRequest<CreateCommentRequest>;
            return await createComment(createCommentRequest);
        }
        case 'likePost': {
            // TODO: type guard / validate
            const likePostRequest = event as FieldRequest<LikePostRequest>;
            return await likePost(likePostRequest);
        }
        case 'likeComment': {
            // TODO: type guard / validate
            const likeCommentRequest =
                event as FieldRequest<LikeCommentRequest>;
            return await likeComment(likeCommentRequest);
        }
        case 'unlikePost': {
            // TODO: type guard / validate
            const unlikePostRequest = event as FieldRequest<UnlikePostRequest>;
            return await unlikePost(unlikePostRequest);
        }
        case 'unlikeComment': {
            // TODO: type guard / validate
            const unlikeCommentRequest =
                event as FieldRequest<UnlikeCommentRequest>;
            return await unlikeComment(unlikeCommentRequest);
        }
        default:
            return null;
    }
};

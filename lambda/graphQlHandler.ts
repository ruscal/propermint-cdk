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
        default:
            return null;
    }
};

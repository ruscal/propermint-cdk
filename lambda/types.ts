export enum PostStatus {
    Processing = 'processing',
    Live = 'live',
    Suppressed = 'suppressed'
}

export type Post = {
    postId: string;
    channelId: string;
    title: string;
    content: string;
    author: string;
    timestamp: number;
    status: PostStatus;
    imagePath: string;
    totalComments: number;
    totalLikes: number;
    topComments: string[];
    topLikes: string[];
};

export enum ReactionType {
    Comment = 'comment',
    Like = 'like'
}

export enum CommentStatus {
    Live = 'live'
}

export interface Comment {
    channelId: string;
    postId: string;
    commentId: string;
    author: string;
    comment: string;
    timestamp: number;
    totalLikes: number;
    topLikes: string[];
    postTimestamp: number;
}

export interface Like {
    channelId: string;
    postId: string;
    likeId: string;
    commentId?: string;
    author: string;
    timestamp: number;
    postTimestamp: number;
}

export interface FieldRequest<R> {
    arguments: R;
    identity?: {
        username: string;
    };
}

export interface AppSyncEvent<R = any> extends FieldRequest<R> {
    info: {
        fieldName: string;
    };
}

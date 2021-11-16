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
};

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

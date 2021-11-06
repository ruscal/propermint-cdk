export type Post = {
    postId: string;
    channelId: string;
    title: string;
    content: string;
    author: string;
    timestamp: number;
};

export interface FieldRequest<R> {
    arguments: R;
    identity: {
        username: string;
    };
}

export interface AppSyncEvent<R = any> extends FieldRequest<R> {
    info: {
        fieldName: string;
    };
}

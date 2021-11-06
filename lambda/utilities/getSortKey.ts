export function getSortKeyForPost(postId: string, timestamp: number) {
    return `POST#${timestamp}#${postId}`;
}

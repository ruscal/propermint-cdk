export function getPostSortKey(postId: string, timestamp: number) {
    return `POST#${timestamp}#${postId}`;
}

export function getCommentSortKey(timestamp: number) {
    return `COMMENT#${timestamp}`;
}

export function getLikeSortKey(timestamp: number) {
    return `LIKE#${timestamp}`;
}

export function getLikeId(
    channelId: string,
    postId: string,
    username: string,
    commentId?: string
) {
    return commentId
        ? `LIKE:${channelId}:${postId}:${commentId}:${username}`
        : `LIKE:${channelId}:${postId}:${username}`;
}

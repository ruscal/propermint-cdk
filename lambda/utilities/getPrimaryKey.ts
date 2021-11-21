export function getChannelPrimaryKey(channelId: string) {
    return `CHANNEL#${channelId}`;
}

export function getReactionPrimaryKey(channelId: string, username: string) {
    return `REACTION#${channelId}#${username}`;
}

export function getChannelUserKey(channelId: string, username: string) {
    return `${channelId}#${username}`;
}

export function getChannelPostKey(channelId: string, postId: string) {
    return `${channelId}#${postId}`;
}
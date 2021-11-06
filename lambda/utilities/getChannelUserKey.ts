export function getChannelUserKey(channelId: string, username: string) {
    return `${channelId}#${username}`;
}

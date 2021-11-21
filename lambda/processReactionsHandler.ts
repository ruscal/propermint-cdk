import { SQSRecord, SQSEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { Key } from 'aws-sdk/clients/dynamodb';
import { ReactionType } from './types';
import {
    getComment,
    getCommentLikesCount,
    getPostCommentsCount,
    getPostLikesCount,
    updateComment
} from './utilities/reactionsClient';
import { getPost, updatePost } from './utilities/channelsClient';

const docClient = new DynamoDB.DocumentClient();

export interface ProcessReactionRequest {
    channelId: string;
    postId: string;
    reactionType: ReactionType;
    commentId?: string;
}

export async function handler(event: SQSEvent) {
    await Promise.all(event.Records.map(processReaction));
}

async function processReaction(record: SQSRecord) {
    const request = JSON.parse(record.body) as ProcessReactionRequest;

    switch (request.reactionType) {
        case ReactionType.Comment:
            return processComments(request);

        case ReactionType.Like:
            return processLikes(request);
    }
}

async function processComments(request: ProcessReactionRequest) {
    console.log(`Processing comments: ${request}`);
    try {
        const { channelId, postId } = request;
        const commentCount = await getCommentsCountForPost(channelId, postId);
        const post = await getPost(docClient, postId);
        if (!post) {
            throw new Error('Could not update comment counts, post not found');
        }

        await updatePost(docClient, {
            ...post,
            totalComments: commentCount
        });
    } catch (ex) {
        console.log(`Process comments failed ${JSON.stringify(request)}`, ex);
    }
}

async function processLikes(request: ProcessReactionRequest) {
    console.log(`Processing likes: ${request}`);
    try {
        if (request.commentId) {
            return processLikesForComment(request);
        }

        return processLikesForPost(request);
    } catch (ex) {
        console.log(`Process comments failed ${JSON.stringify(request)}`, ex);
    }
}

async function processLikesForPost(request: ProcessReactionRequest) {
    const { channelId, postId } = request;
    const likes = await getLikesCountForPost(channelId, postId);
    const post = await getPost(docClient, postId);
    if (!post) {
        throw new Error('Could not update post likes, post not found');
    }

    await updatePost(docClient, {
        ...post,
        totalLikes: likes
    });
}

async function processLikesForComment(request: ProcessReactionRequest) {
    const { channelId, postId, commentId } = request;
    const likes = await getLikesCountForComment(channelId, postId, commentId!);
    const comment = await getComment(docClient, postId);
    if (!comment) {
        throw new Error('Could not update comment likes, comment not found');
    }

    await updateComment(docClient, {
        ...comment,
        totalLikes: likes
    });
}

async function getCommentsCountForPost(
    channelId: string,
    postId: string,
    lastEvaluatedKey?: Key
): Promise<number> {
    const data = await getPostCommentsCount(
        docClient,
        channelId,
        postId,
        lastEvaluatedKey
    );
    let count = data.Count || 0;
    return data.LastEvaluatedKey
        ? count +
              (await getCommentsCountForPost(
                  channelId,
                  postId,
                  data.LastEvaluatedKey
              ))
        : count;
}

async function getLikesCountForPost(
    channelId: string,
    postId: string,
    lastEvaluatedKey?: Key
): Promise<number> {
    const data = await getPostLikesCount(
        docClient,
        channelId,
        postId,
        lastEvaluatedKey
    );
    let count = data.Count || 0;
    return data.LastEvaluatedKey
        ? count +
              (await getLikesCountForPost(
                  channelId,
                  postId,
                  data.LastEvaluatedKey
              ))
        : count;
}

async function getLikesCountForComment(
    channelId: string,
    postId: string,
    commentId: string,
    lastEvaluatedKey?: Key
): Promise<number> {
    const data = await getCommentLikesCount(
        docClient,
        channelId,
        postId,
        commentId,
        lastEvaluatedKey
    );
    let count = data.Count || 0;
    return data.LastEvaluatedKey
        ? count +
              (await getLikesCountForComment(
                  channelId,
                  postId,
                  commentId,
                  data.LastEvaluatedKey
              ))
        : count;
}

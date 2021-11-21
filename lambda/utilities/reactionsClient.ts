import { DynamoDB } from 'aws-sdk';
import { DocumentClient, Key } from 'aws-sdk/clients/dynamodb';
import { Comment, Like, ReactionType } from '../types';
import { getChannelPostKey, getReactionPrimaryKey } from './getPrimaryKey';
import { getPostSortKey } from './getSortKey';

export async function getPostCommentsCount(
    dynamoDbClient: DynamoDB.DocumentClient,
    channelId: string,
    postId: string,
    lastEvaluatedKey?: Key
) {
    const data = await dynamoDbClient
        .query({
            TableName: process.env.REACTIONS_TABLE!,
            IndexName: 'reactionsByPost',
            KeyConditionExpression: `channelPost = :channelPost`,
            FilterExpression: `reactionType = :reactionType`,
            ExpressionAttributeValues: {
                ':channelPost': getChannelPostKey(channelId, postId),
                ':reactionType': ReactionType.Comment
            },
            ExclusiveStartKey: lastEvaluatedKey,
            Select: 'COUNT'
        })
        .promise();
    return data;
}

export async function getPostLikesCount(
    dynamoDbClient: DynamoDB.DocumentClient,
    channelId: string,
    postId: string,
    lastEvaluatedKey?: Key
) {
    const data = await dynamoDbClient
        .query({
            TableName: process.env.REACTIONS_TABLE!,
            IndexName: 'reactionsByPost',
            KeyConditionExpression: `channelPost = :channelPost`,
            FilterExpression: `reactionType = :reactionType`,
            ExpressionAttributeValues: {
                ':channelPost': getChannelPostKey(channelId, postId),
                ':reactionType': ReactionType.Like
            },
            ExclusiveStartKey: lastEvaluatedKey,
            Select: 'COUNT'
        })
        .promise();
    return data;
}

export async function getCommentLikesCount(
    dynamoDbClient: DynamoDB.DocumentClient,
    channelId: string,
    postId: string,
    commentId: string,
    lastEvaluatedKey?: Key
) {
    const data = await dynamoDbClient
        .query({
            TableName: process.env.REACTIONS_TABLE!,
            IndexName: 'reactionsByPost',
            KeyConditionExpression: `channelPost = :channelPost`,
            FilterExpression: `reactionType = :reactionType and commentId = :commentId`,
            ExpressionAttributeValues: {
                ':channelPost': getChannelPostKey(channelId, postId),
                ':reactionType': ReactionType.Like,
                ':commentId': commentId
            },
            ExclusiveStartKey: lastEvaluatedKey,
            Select: 'COUNT'
        })
        .promise();
    return data;
}

export async function getComment(
    dynamoDbClient: DynamoDB.DocumentClient,
    commentId: string
) {
    const queryPostResults = await dynamoDbClient
        .query({
            TableName: process.env.REACTIONS_TABLE!,
            IndexName: 'comments',
            KeyConditionExpression: `commentId = :commentId`,
            ExpressionAttributeValues: {
                ':commentId': commentId
            }
        })
        .promise();

    return queryPostResults.Items && (queryPostResults.Items[0] as Comment);
}

export async function getLike(
    dynamoDbClient: DynamoDB.DocumentClient,
    likeId: string
) {
    const queryPostResults = await dynamoDbClient
        .query({
            TableName: process.env.REACTIONS_TABLE!,
            IndexName: 'comments',
            KeyConditionExpression: `likeId = :likeId`,
            ExpressionAttributeValues: {
                ':likeId': likeId
            }
        })
        .promise();

    return queryPostResults.Items && (queryPostResults.Items[0] as Like);
}

export async function updateComment(
    dynamoDbClient: DynamoDB.DocumentClient,
    comment: Comment
) {
    let params: DocumentClient.UpdateItemInput = {
        TableName: process.env.REACTIONS_TABLE!,
        Key: {
            pk: getReactionPrimaryKey(comment.channelId, comment.author),
            sk: getPostSortKey(comment.postId, comment.postTimestamp)
        },
        UpdateExpression: '',
        ReturnValues: 'UPDATED_NEW'
    };
    let prefix = 'set ';
    let attributes = Object.keys(comment) as (keyof typeof comment)[];
    for (let i = 0; i < attributes.length; i++) {
        let attribute = attributes[i];
        if (attribute !== 'commentId') {
            params.UpdateExpression +=
                prefix + '#' + attribute + ' = :' + attribute;
            params.ExpressionAttributeValues![':' + attribute] =
                comment[attribute];
            params.ExpressionAttributeNames!['#' + attribute] = attribute;
            prefix = ', ';
        }
    }

    await dynamoDbClient.update(params).promise();
}

export async function deleteComment(
    dynamoDbClient: DynamoDB.DocumentClient,
    comment: Comment
) {
    const params: DocumentClient.DeleteItemInput = {
        TableName: process.env.CHANNELS_TABLE!,
        Key: {
            pk: getReactionPrimaryKey(comment.channelId, comment.author),
            sk: getPostSortKey(comment.postId, comment.postTimestamp)
        }
    };

    await dynamoDbClient.delete(params).promise();
}

export async function deleteLike(
    dynamoDbClient: DynamoDB.DocumentClient,
    like: Like
) {
    const params: DocumentClient.DeleteItemInput = {
        TableName: process.env.CHANNELS_TABLE!,
        Key: {
            pk: getReactionPrimaryKey(like.channelId, like.author),
            sk: getPostSortKey(like.postId, like.postTimestamp)
        }
    };

    await dynamoDbClient.delete(params).promise();
}

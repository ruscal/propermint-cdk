import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Post, PostStatus } from '../types';
import { getChannelPrimaryKey } from './getPrimaryKey';
import { getPostSortKey } from './getSortKey';

export async function getPost(
    dynamoDbClient: DynamoDB.DocumentClient,
    postId: string
) {
    const queryPostResults = await dynamoDbClient
        .query({
            TableName: process.env.CHANNELS_TABLE!,
            IndexName: 'posts',
            KeyConditionExpression: `postId = :postId`,
            ExpressionAttributeValues: {
                ':postId': postId
            }
        })
        .promise();

    return queryPostResults.Items && (queryPostResults.Items[0] as Post);
}

export async function getChannelPosts(
    dynamoDbClient: DynamoDB.DocumentClient,
    channelId: string,
    username?: string
) {
    const data = await dynamoDbClient
        .query({
            TableName: process.env.CHANNELS_TABLE!,
            KeyConditionExpression: `pk = :pk`,
            FilterExpression: `attribute_exists(postId) and (#status = :statusLive or (#status = :statusProcessing and author = :author))`,
            ExpressionAttributeValues: {
                ':pk': getChannelPrimaryKey(channelId),
                ':statusLive': PostStatus.Live,
                ':statusProcessing': PostStatus.Processing,
                ':author': username || null
            },
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ScanIndexForward: false
        })
        .promise();
    return data.Items;
}

export async function updatePost(
    dynamoDbClient: DynamoDB.DocumentClient,
    post: Post
) {
    let params: DocumentClient.UpdateItemInput = {
        TableName: process.env.CHANNELS_TABLE!,
        Key: {
            pk: getChannelPrimaryKey(post.channelId),
            sk: getPostSortKey(post.postId, post.timestamp)
        },
        UpdateExpression: '',
        ReturnValues: 'UPDATED_NEW'
    };
    let prefix = 'set ';
    let attributes = Object.keys(post) as (keyof typeof post)[];
    for (let i = 0; i < attributes.length; i++) {
        let attribute = attributes[i];
        if (attribute !== 'postId') {
            params.UpdateExpression +=
                prefix + '#' + attribute + ' = :' + attribute;
            params.ExpressionAttributeValues![':' + attribute] =
                post[attribute];
            params.ExpressionAttributeNames!['#' + attribute] = attribute;
            prefix = ', ';
        }
    }

    await dynamoDbClient.update(params).promise();
}

import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const docClient = new DynamoDB.DocumentClient();

async function postsByUsername(username: string) {
    const params: DocumentClient.QueryInput = {
        TableName: process.env.POST_TABLE!,
        IndexName: 'postsByUsername',
        KeyConditionExpression: '#owner = :username',
        ExpressionAttributeNames: { '#owner': 'owner' },
        ExpressionAttributeValues: { ':username': username }
    };

    try {
        const data = await docClient.query(params).promise();
        return data.Items;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        throw err;
    }
}

export default postsByUsername;

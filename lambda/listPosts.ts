import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const docClient = new DynamoDB.DocumentClient();

async function listPosts() {
    const params: DocumentClient.ScanInput = {
        TableName: process.env.POST_TABLE!
    };
    try {
        const data = await docClient.scan(params).promise();
        return data.Items;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default listPosts;

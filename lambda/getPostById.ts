import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
const docClient = new DynamoDB.DocumentClient();

async function getPostById(postId: string) {
    const params: DocumentClient.GetItemInput = {
        TableName: process.env.POST_TABLE!,
        Key: { id: postId }
    };
    try {
        const { Item } = await docClient.get(params).promise();
        return Item;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        throw err;
    }
}

export default getPostById;

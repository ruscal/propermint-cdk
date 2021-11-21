import { SQSRecord, SQSEvent } from 'aws-lambda';
import { DynamoDB, S3 } from 'aws-sdk';
import sharp from 'sharp';
import { PostStatus } from './types';
import { getPost } from './utilities/channelsClient';

const docClient = new DynamoDB.DocumentClient();
const s3 = new S3({ apiVersion: '2006-03-01' });

const ORIGINAL_FILENAME = 'original';
const imageSizes = [240, 320, 480, 640, 750, 1080];

const bucket = process.env.IMAGE_BUCKET!;

export interface ProcessPostRequest {
    postId: string;
}

export async function handler(event: SQSEvent) {
    await Promise.all(event.Records.map(processPost));
}

async function processPost(record: SQSRecord) {
    const { postId } = JSON.parse(record.body) as ProcessPostRequest;
    console.log(`Processing image: ${record.body}`);

    const post = await getPost(docClient, postId);
    if (!post) {
        console.log(`Failed to process post ${postId}`);
        return;
    }

    const prefix = `public/images/${post.channelId}/${post.postId}/`;
    const key = `${prefix}${post.imagePath}`;

    try {
        const { Body } = await s3
            .getObject({
                Bucket: bucket,
                Key: key
            })
            .promise();

        if (!Body) {
            console.log(`No content, aborting. (${key})`);
            return Promise.resolve();
        }

        const image = sharp(Body as any);
        const metaData = await image.metadata();

        await Promise.all(
            imageSizes.map((width) =>
                saveImage({
                    metaData,
                    imageData: Body as Buffer,
                    prefix,
                    bucket,
                    width
                })
            )
        );

        await docClient
            .put({
                TableName: process.env.CHANNELS_TABLE!,
                Item: {
                    ...post,
                    status: PostStatus.Live
                }
            })
            .promise();
    } catch (ex) {
        console.log(`Process post failed ${JSON.stringify(postId)}`, ex);
    }
}

interface SaveImageProps {
    imageData: Buffer;
    metaData: sharp.Metadata;
    width: number;
    bucket: string;
    prefix: string;
}

async function saveImage({
    imageData,
    metaData,
    width,
    bucket,
    prefix
}: SaveImageProps) {
    let resizedImage = imageData;
    if (metaData.width && metaData.width > width) {
        resizedImage = await sharp(imageData)
            .resize(width, null)
            .withMetadata()
            .jpeg({ mozjpeg: true })
            .toBuffer();
    }

    await s3
        .putObject({
            Bucket: bucket,
            Key: `${prefix}${width}.jpg`,
            Body: resizedImage
        })
        .promise();
}

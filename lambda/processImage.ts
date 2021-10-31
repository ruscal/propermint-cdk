import { S3Event, S3EventRecord } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import sharp from 'sharp';

const s3 = new S3({ apiVersion: '2006-03-01' });

const thumbnailHeight = 250;
const fullHeight = 1000;
const ORIGINAL_FILENAME = 'original';
const THUMBNAIL_FILENAME = 'sm';
const FULLSIZE_FILENAME = 'lg';

export async function handler(event: S3Event) {
    await Promise.all(event.Records.map(processImage));
}

async function processImage(record: S3EventRecord) {
    const key = record.s3.object.key;
    const bucket = record.s3.bucket.name;
    const originalExtension = getExtension(key);
    const originalFileName = `${ORIGINAL_FILENAME}.${originalExtension}`;

    console.log(
        `Processing image: ${JSON.stringify({
            s3: record.s3,
            originalFileName
        })}`
    );

    if (!originalExtension || !key.endsWith(originalFileName)) {
        console.log(`Invalid object, aborting. (${key})`);
        return Promise.resolve();
    }

    const prefix = key.substring(0, key.lastIndexOf('/') + 1);

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

        let thumbnail = Body;
        if (metaData.height && metaData.height > thumbnailHeight) {
            thumbnail = await sharp(Body as any)
                .resize(null, thumbnailHeight)
                .jpeg({ mozjpeg: true })
                .toBuffer();
        }

        let fullImage = Body;
        if (metaData.height && metaData.height > fullHeight) {
            fullImage = await sharp(Body as any)
                .resize(null, fullHeight)
                .jpeg({ mozjpeg: true })
                .toBuffer();
        }

        await s3
            .putObject({
                Bucket: bucket,
                Key: `${prefix}${THUMBNAIL_FILENAME}.jpg`,
                Body: thumbnail
            })
            .promise();

        await s3
            .putObject({
                Bucket: bucket,
                Key: `${prefix}${FULLSIZE_FILENAME}.jpg`,
                Body: fullImage
            })
            .promise();
    } catch (ex) {
        console.log(`Process image failed ${JSON.stringify(record.s3)}`, ex);
    }
}

function getExtension(key: string) {
    const lastPeriod = key.lastIndexOf('.');
    if (lastPeriod) {
        return key.substring(lastPeriod + 1);
    }
    return undefined;
}

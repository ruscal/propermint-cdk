import { S3Event, S3EventRecord } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import sharp from 'sharp';

const s3 = new S3({ apiVersion: '2006-03-01' });

const ORIGINAL_FILENAME = 'original';
const imageSizes = [240, 320, 480, 640, 750, 1080];

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
    } catch (ex) {
        console.log(`Process image failed ${JSON.stringify(record.s3)}`, ex);
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

function getExtension(key: string) {
    const lastPeriod = key.lastIndexOf('.');
    if (lastPeriod) {
        return key.substring(lastPeriod + 1);
    }
    return undefined;
}

import { Code, Function, Runtime } from 'monocdk/lib/aws-lambda';
import { SqsEventSource } from 'monocdk/lib/aws-lambda-event-sources';
import { Construct } from 'monocdk';
import { Queue } from 'monocdk/lib/aws-sqs';
import { Bucket } from 'monocdk/lib/aws-s3';
import { CHANNELS_TABLE_VAR } from './ProperMintDB';
import { Table } from 'monocdk/lib/aws-dynamodb';

const IMAGE_BUCKET_VAR = 'IMAGE_BUCKET';

export interface PostProcessorProps {
    imageRepositoryBucket: Bucket;
    channelsTable: Table;
}

export class PostProcessor extends Construct {
    processPostQueue: Queue;
    processImageHandler: Function;

    constructor(
        scope: Construct,
        id: string,
        { imageRepositoryBucket, channelsTable }: PostProcessorProps
    ) {
        super(scope, id);

        this.processPostQueue = new Queue(this, 'ProcessPostQueue');

        const processImageHandler = new Function(this, 'ProcessImageHandler', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'processPostHandler.handler',
            code: Code.fromAsset('lambda'),
            memorySize: 5120,
            environment: {
                [IMAGE_BUCKET_VAR]: imageRepositoryBucket.bucketName,
                [CHANNELS_TABLE_VAR]: channelsTable.tableName
            }
        });

        processImageHandler.addEventSource(
            new SqsEventSource(this.processPostQueue)
        );

        imageRepositoryBucket.grantPut(processImageHandler);
        imageRepositoryBucket.grantReadWrite(processImageHandler);
        channelsTable.grantReadWriteData(processImageHandler);
    }
}

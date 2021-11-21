import { Code, Function, Runtime } from 'monocdk/lib/aws-lambda';
import { SqsEventSource } from 'monocdk/lib/aws-lambda-event-sources';
import { Construct } from 'monocdk';
import { Queue } from 'monocdk/lib/aws-sqs';
import { Bucket } from 'monocdk/lib/aws-s3';
import { CHANNELS_TABLE_VAR, REACTIONS_TABLE_VAR } from './ProperMintDB';
import { Table } from 'monocdk/lib/aws-dynamodb';

const IMAGE_BUCKET_VAR = 'IMAGE_BUCKET';

export interface PostProcessorProps {
    imageRepositoryBucket: Bucket;
    channelsTable: Table;
    reactionsTable: Table;
}

export class PostProcessor extends Construct {
    processPostQueue: Queue;
    processReactionsQueue: Queue;
    processPostHandler: Function;
    processReactionsHandler: Function;

    constructor(
        scope: Construct,
        id: string,
        {
            imageRepositoryBucket,
            channelsTable,
            reactionsTable
        }: PostProcessorProps
    ) {
        super(scope, id);

        this.processPostQueue = new Queue(this, 'ProcessPostQueue');

        this.processPostHandler = new Function(this, 'ProcessPostHandler', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'processPostHandler.handler',
            code: Code.fromAsset('lambda'),
            memorySize: 5120,
            environment: {
                [IMAGE_BUCKET_VAR]: imageRepositoryBucket.bucketName,
                [CHANNELS_TABLE_VAR]: channelsTable.tableName
            }
        });

        this.processPostHandler.addEventSource(
            new SqsEventSource(this.processPostQueue)
        );

        imageRepositoryBucket.grantPut(this.processPostHandler);
        imageRepositoryBucket.grantReadWrite(this.processPostHandler);
        channelsTable.grantReadWriteData(this.processPostHandler);

        this.processReactionsQueue = new Queue(this, 'ProcessReactionsQueue');

        this.processReactionsHandler = new Function(
            this,
            'ProcessReactionsHandler',
            {
                runtime: Runtime.NODEJS_14_X,
                handler: 'processReactionsHandler.handler',
                code: Code.fromAsset('lambda'),
                memorySize: 5120,
                environment: {
                    [REACTIONS_TABLE_VAR]: reactionsTable.tableName
                }
            }
        );

        this.processReactionsHandler.addEventSource(
            new SqsEventSource(this.processReactionsQueue)
        );

        reactionsTable.grantReadWriteData(this.processReactionsHandler);
    }
}

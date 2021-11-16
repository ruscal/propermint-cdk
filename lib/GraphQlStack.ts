import { Construct, Duration, Expiration } from 'monocdk';
import {
    AuthorizationType,
    FieldLogLevel,
    GraphqlApi,
    Schema
} from 'monocdk/lib/aws-appsync';
import { IUserPool } from 'monocdk/lib/aws-cognito';
import { Table } from 'monocdk/lib/aws-dynamodb';
import { Code, Function, Runtime } from 'monocdk/lib/aws-lambda';
import { Queue } from 'monocdk/lib/aws-sqs';
import { CHANNELS_TABLE_VAR } from './ProperMintDB';

const PROCESS_POST_QUEUE_VAR = 'PROCESS_POST_QUEUE';

export interface GraphQlStackProps {
    userPool: IUserPool;
    channelsTable: Table;
    processPostQueue: Queue;
}

export class GraphQlStack extends Construct {
    api: GraphqlApi;
    graphQlHandler: Function;

    constructor(scope: Construct, id: string, props: GraphQlStackProps) {
        super(scope, id);

        const { userPool, channelsTable, processPostQueue } = props;
        this.api = new GraphqlApi(this, 'ProperMintApp', {
            name: 'ProperMintApp',
            logConfig: {
                fieldLogLevel: FieldLogLevel.ALL
            },
            schema: Schema.fromAsset('./graphql/schema.graphql'),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: AuthorizationType.API_KEY,
                    apiKeyConfig: {
                        expires: Expiration.after(Duration.days(365))
                    }
                },
                additionalAuthorizationModes: [
                    {
                        authorizationType: AuthorizationType.USER_POOL,
                        userPoolConfig: {
                            userPool
                        }
                    }
                ]
            }
        });

        this.graphQlHandler = new Function(this, 'GraphQlHandler', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'graphQlHandler.handler',
            code: Code.fromAsset('lambda'),
            memorySize: 2048,
            environment: {
                [PROCESS_POST_QUEUE_VAR]: processPostQueue.queueUrl,
                [CHANNELS_TABLE_VAR]: channelsTable.tableName
            }
        });

        channelsTable.grantFullAccess(this.graphQlHandler);
        processPostQueue.grantSendMessages(this.graphQlHandler);


        const lambdaDs = this.api.addLambdaDataSource(
            'GraphQlDataSource',
            this.graphQlHandler
        );

        lambdaDs.createResolver({
            typeName: 'Query',
            fieldName: 'getPostById'
        });

        lambdaDs.createResolver({
            typeName: 'Query',
            fieldName: 'listPosts'
        });

        lambdaDs.createResolver({
            typeName: 'Query',
            fieldName: 'postsByUsername'
        });

        lambdaDs.createResolver({
            typeName: 'Mutation',
            fieldName: 'createPost'
        });

        lambdaDs.createResolver({
            typeName: 'Mutation',
            fieldName: 'deletePost'
        });

        lambdaDs.createResolver({
            typeName: 'Mutation',
            fieldName: 'updatePost'
        });
    }
}

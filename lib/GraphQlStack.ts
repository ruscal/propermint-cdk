import { CfnOutput, Construct, Duration, Expiration } from 'monocdk';
import {
    AuthorizationType,
    FieldLogLevel,
    GraphqlApi,
    Schema
} from 'monocdk/lib/aws-appsync';
import { IUserPool } from 'monocdk/lib/aws-cognito';
import { Table } from 'monocdk/lib/aws-dynamodb';
import { Code, Function, Runtime } from 'monocdk/lib/aws-lambda';

export interface GraphQlStackProps {
    userPool: IUserPool;
    channelsTable: Table;
}

export class GraphQlStack extends Construct {
    api: GraphqlApi;
    graphQlHandler: Function;

    constructor(scope: Construct, id: string, props: GraphQlStackProps) {
        super(scope, id);

        const { userPool, channelsTable } = props;
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
            memorySize: 2048
        });

        // Enable the Lambda function to access the DynamoDB table (using IAM)
        channelsTable.grantFullAccess(this.graphQlHandler);

        // Create an environment variable that we will use in the function code
        this.graphQlHandler.addEnvironment(
            'CHANNELS_TABLE',
            channelsTable.tableName
        );

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

import {
    CfnOutput,
    Construct,
    Duration,
    Expiration,
    Stack,
    StackProps
} from 'monocdk';
import {
    aws_cognito,
    aws_appsync,
    aws_dynamodb,
    aws_lambda,
    aws_s3,
    aws_iam,
    aws_route53,
    aws_route53_targets,
    aws_cloudfront
} from 'monocdk';
import { DnsValidatedCertificate } from 'monocdk/lib/aws-certificatemanager';
import { S3EventSource } from 'monocdk/lib/aws-lambda-event-sources';
import { EventType } from 'monocdk/lib/aws-s3';

export interface PropermintCdkStackProps extends StackProps {
    domainName: string;
}

export class PropermintCdkStack extends Stack {
    constructor(scope: Construct, id: string, props: PropermintCdkStackProps) {
        super(scope, id, props);

        const userPool = new aws_cognito.UserPool(this, 'ProperMintUserPool', {
            selfSignUpEnabled: true,
            accountRecovery: aws_cognito.AccountRecovery.PHONE_AND_EMAIL,
            userVerification: {
                emailStyle: aws_cognito.VerificationEmailStyle.CODE
            },
            autoVerify: {
                email: true
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: true
                }
            }
        });

        const api = new aws_appsync.GraphqlApi(this, 'ProperMintApp', {
            name: 'ProperMintApp',
            logConfig: {
                fieldLogLevel: aws_appsync.FieldLogLevel.ALL
            },
            schema: aws_appsync.Schema.fromAsset('./graphql/schema.graphql'),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: aws_appsync.AuthorizationType.API_KEY,
                    apiKeyConfig: {
                        expires: Expiration.after(Duration.days(365))
                    }
                },
                additionalAuthorizationModes: [
                    {
                        authorizationType:
                            aws_appsync.AuthorizationType.USER_POOL,
                        userPoolConfig: {
                            userPool
                        }
                    }
                ]
            }
        });

        // Create the function
        const postLambda = new aws_lambda.Function(this, 'AppSyncPostHandler', {
            runtime: aws_lambda.Runtime.NODEJS_14_X,
            handler: 'main.handler',
            code: aws_lambda.Code.fromAsset('lambda'),
            memorySize: 2048
        });

        // Set the new Lambda function as a data source for the AppSync API
        const lambdaDs = api.addLambdaDataSource(
            'lambdaDatasource',
            postLambda
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

        const postTable = new aws_dynamodb.Table(this, 'PostsTable', {
            tableName: 'posts',
            billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'id',
                type: aws_dynamodb.AttributeType.STRING
            }
        });

        // Add a global secondary index to enable another data access pattern
        postTable.addGlobalSecondaryIndex({
            indexName: 'postsByUsername',
            partitionKey: {
                name: 'owner',
                type: aws_dynamodb.AttributeType.STRING
            }
        });

        // Enable the Lambda function to access the DynamoDB table (using IAM)
        postTable.grantFullAccess(postLambda);

        // Create an environment variable that we will use in the function code
        postLambda.addEnvironment('POST_TABLE', postTable.tableName);

        const userPoolClient = new aws_cognito.UserPoolClient(
            this,
            'UserPoolClient',
            {
                userPool,
                authFlows: {
                    adminUserPassword: true,
                    custom: true,
                    userSrp: true
                },
                supportedIdentityProviders: [
                    aws_cognito.UserPoolClientIdentityProvider.COGNITO
                ]
            }
        );

        // 👇 Identity Pool
        const identityPool = new aws_cognito.CfnIdentityPool(
            this,
            'identity-pool',
            {
                identityPoolName: 'my-identity-pool',
                allowUnauthenticatedIdentities: true,
                cognitoIdentityProviders: [
                    {
                        clientId: userPoolClient.userPoolClientId,
                        providerName: userPool.userPoolProviderName
                    }
                ]
            }
        );

        const unauthenticatedRole = new aws_iam.Role(
            this,
            'anonymous-group-role',
            {
                description: 'Default role for anonymous users',
                assumedBy: new aws_iam.FederatedPrincipal(
                    'cognito-identity.amazonaws.com',
                    {
                        StringEquals: {
                            'cognito-identity.amazonaws.com:aud':
                                identityPool.ref
                        },
                        'ForAnyValue:StringLike': {
                            'cognito-identity.amazonaws.com:amr':
                                'unauthenticated'
                        }
                    },
                    'sts:AssumeRoleWithWebIdentity'
                ),
                managedPolicies: [
                    aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
                        'service-role/AWSLambdaBasicExecutionRole'
                    )
                ]
            }
        );

        const authenticatedRole = new aws_iam.Role(this, 'users-group-role', {
            description: 'Default role for authenticated users',
            assumedBy: new aws_iam.FederatedPrincipal(
                'cognito-identity.amazonaws.com',
                {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud': identityPool.ref
                    },
                    'ForAnyValue:StringLike': {
                        'cognito-identity.amazonaws.com:amr': 'authenticated'
                    }
                },
                'sts:AssumeRoleWithWebIdentity'
            ),
            managedPolicies: [
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaBasicExecutionRole'
                )
            ]
        });
        authenticatedRole.addToPolicy(
            new aws_iam.PolicyStatement({
                effect: aws_iam.Effect.ALLOW,
                actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                resources: ['*']
            })
        );

        new aws_cognito.CfnIdentityPoolRoleAttachment(
            this,
            'identity-pool-role-attachment',
            {
                identityPoolId: identityPool.ref,
                roles: {
                    authenticated: authenticatedRole.roleArn,
                    unauthenticated: unauthenticatedRole.roleArn
                },
                roleMappings: {
                    mapping: {
                        type: 'Token',
                        ambiguousRoleResolution: 'AuthenticatedRole',
                        identityProvider: `cognito-idp.${
                            Stack.of(this).region
                        }.amazonaws.com/${userPool.userPoolId}:${
                            userPoolClient.userPoolClientId
                        }`
                    }
                }
            }
        );

        const imageRepositoryBucket = new aws_s3.Bucket(
            this,
            'imageRepository',
            {
                publicReadAccess: true,
                cors: [
                    {
                        allowedHeaders: ['*'],
                        allowedMethods: [
                            aws_s3.HttpMethods.GET,
                            aws_s3.HttpMethods.HEAD,
                            aws_s3.HttpMethods.PUT,
                            aws_s3.HttpMethods.POST,
                            aws_s3.HttpMethods.DELETE
                        ],
                        allowedOrigins: ['*'],
                        exposedHeaders: [
                            'x-amz-server-side-encryption',
                            'x-amz-request-id',
                            'x-amz-id-2',
                            'ETag'
                        ],
                        maxAge: 3000
                    }
                ]
            }
        );

        const processImageHandler = new aws_lambda.Function(
            this,
            'ProcessImageHandler',
            {
                runtime: aws_lambda.Runtime.NODEJS_14_X,
                handler: 'processImage.handler',
                code: aws_lambda.Code.fromAsset('lambda'),
                memorySize: 2048
            }
        );

        const s3PutEventSource = new S3EventSource(imageRepositoryBucket, {
            events: [EventType.OBJECT_CREATED_PUT]
        });

        processImageHandler.addEventSource(s3PutEventSource);
        imageRepositoryBucket.grantPut(processImageHandler);
        imageRepositoryBucket.grantReadWrite(processImageHandler);

        const zone = aws_route53.HostedZone.fromLookup(this, 'Zone', {
            domainName: props.domainName
        });
        const siteDomain = 'm.' + props.domainName;
        new CfnOutput(this, 'Site', { value: 'https://' + siteDomain });

        // TLS certificate
        const certificateArn = new DnsValidatedCertificate(
            this,
            'SiteCertificate',
            {
                domainName: siteDomain,
                hostedZone: zone,
                region: 'us-east-1' // Cloudfront only checks this region for certificates.
            }
        ).certificateArn;
        new CfnOutput(this, 'Certificate', { value: certificateArn });

        // CloudFront distribution that provides HTTPS
        const distribution = new aws_cloudfront.CloudFrontWebDistribution(
            this,
            'SiteDistribution',
            {
                aliasConfiguration: {
                    acmCertRef: certificateArn,
                    names: [siteDomain],
                    sslMethod: aws_cloudfront.SSLMethod.SNI,
                    securityPolicy:
                        aws_cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016
                },
                originConfigs: [
                    {
                        s3OriginSource: {
                            s3BucketSource: imageRepositoryBucket
                        },
                        behaviors: [
                            {
                                compress: true,
                                isDefaultBehavior: true
                            }
                        ]
                    }
                ]
            }
        );
        new CfnOutput(this, 'DistributionId', {
            value: distribution.distributionId
        });

        // Route53 alias record for the CloudFront distribution
        new aws_route53.ARecord(this, 'SiteAliasRecord', {
            recordName: siteDomain,
            target: aws_route53.RecordTarget.fromAlias(
                new aws_route53_targets.CloudFrontTarget(distribution)
            ),
            zone
        });

        new CfnOutput(this, 'GraphQLAPIURL', {
            value: api.graphqlUrl
        });

        new CfnOutput(this, 'AppSyncAPIKey', {
            value: api.apiKey || ''
        });

        new CfnOutput(this, 'ProjectRegion', {
            value: this.region
        });

        new CfnOutput(this, 'UserPoolId', {
            value: userPool.userPoolId
        });

        new CfnOutput(this, 'UserPoolClientId', {
            value: userPoolClient.userPoolClientId
        });

        new CfnOutput(this, 'IdentityPoolId', {
            value: identityPool.ref
        });

        new CfnOutput(this, 'ImageRepositoryBucket', {
            value: imageRepositoryBucket.bucketName
        });
    }
}

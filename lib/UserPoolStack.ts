import { CfnOutput, Construct, Stack } from 'monocdk';
import {
    AccountRecovery,
    CfnIdentityPool,
    CfnIdentityPoolRoleAttachment,
    UserPool,
    UserPoolClient,
    UserPoolClientIdentityProvider,
    VerificationEmailStyle
} from 'monocdk/lib/aws-cognito';
import {
    Effect,
    FederatedPrincipal,
    ManagedPolicy,
    PolicyStatement,
    Role
} from 'monocdk/lib/aws-iam';

export class UserPoolStack extends Construct {
    userPool: UserPool;
    userPoolClient: UserPoolClient;
    identityPool: CfnIdentityPool;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.userPool = new UserPool(this, 'ProperMintUserPool', {
            selfSignUpEnabled: true,
            accountRecovery: AccountRecovery.PHONE_AND_EMAIL,
            userVerification: {
                emailStyle: VerificationEmailStyle.CODE
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

        this.userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
            userPool: this.userPool,
            authFlows: {
                adminUserPassword: true,
                custom: true,
                userSrp: true
            },
            supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO]
        });

        this.identityPool = new CfnIdentityPool(this, 'identity-pool', {
            identityPoolName: 'my-identity-pool',
            allowUnauthenticatedIdentities: true,
            cognitoIdentityProviders: [
                {
                    clientId: this.userPoolClient.userPoolClientId,
                    providerName: this.userPool.userPoolProviderName
                }
            ]
        });

        const unauthenticatedRole = new Role(this, 'anonymous-group-role', {
            description: 'Default role for anonymous users',
            assumedBy: new FederatedPrincipal(
                'cognito-identity.amazonaws.com',
                {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud':
                            this.identityPool.ref
                    },
                    'ForAnyValue:StringLike': {
                        'cognito-identity.amazonaws.com:amr': 'unauthenticated'
                    }
                },
                'sts:AssumeRoleWithWebIdentity'
            ),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaBasicExecutionRole'
                )
            ]
        });

        const authenticatedRole = new Role(this, 'users-group-role', {
            description: 'Default role for authenticated users',
            assumedBy: new FederatedPrincipal(
                'cognito-identity.amazonaws.com',
                {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud':
                            this.identityPool.ref
                    },
                    'ForAnyValue:StringLike': {
                        'cognito-identity.amazonaws.com:amr': 'authenticated'
                    }
                },
                'sts:AssumeRoleWithWebIdentity'
            ),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaBasicExecutionRole'
                )
            ]
        });
        authenticatedRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                resources: ['*']
            })
        );

        new CfnIdentityPoolRoleAttachment(
            this,
            'identity-pool-role-attachment',
            {
                identityPoolId: this.identityPool.ref,
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
                        }.amazonaws.com/${this.userPool.userPoolId}:${
                            this.userPoolClient.userPoolClientId
                        }`
                    }
                }
            }
        );
    }
}

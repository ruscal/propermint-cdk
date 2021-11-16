import { CfnOutput, Construct, Stack, StackProps } from 'monocdk';
import { Queue } from 'monocdk/lib/aws-sqs';
import { GraphQlStack } from './GraphQlStack';
import { ImageRepository } from './ImageRespository';
import { PostProcessor } from './PostProcessor';
import { ProperMintDB } from './ProperMintDB';
import { UserPoolStack } from './UserPoolStack';

export interface PropermintCdkStackProps extends StackProps {
    domainName: string;
}

export class PropermintCdkStack extends Stack {
    constructor(scope: Construct, id: string, props: PropermintCdkStackProps) {
        super(scope, id, props);

        const { domainName } = props;

        const userPoolStack = new UserPoolStack(this, 'UserPoolStack');

        const properMintDB = new ProperMintDB(this, 'ProperMintDB');

        const imageRepository = new ImageRepository(this, 'ImageRepository', {
            domainName
        });

        const postProcessor = new PostProcessor(this, 'PostProcessor', {
            imageRepositoryBucket: imageRepository.imageRepositoryBucket,
            channelsTable: properMintDB.channelsTable
        });

        const graphQlStack = new GraphQlStack(this, 'GraphQlStack', {
            userPool: userPoolStack.userPool,
            channelsTable: properMintDB.channelsTable,
            processPostQueue: postProcessor.processPostQueue
        });

        new CfnOutput(this, 'ProjectRegion', {
            value: this.region
        });

        new CfnOutput(this, 'GraphQLAPIURL', {
            value: graphQlStack.api.graphqlUrl
        });

        new CfnOutput(this, 'AppSyncAPIKey', {
            value: graphQlStack.api.apiKey || ''
        });

        new CfnOutput(this, 'DistributionId', {
            value: imageRepository.distribution.distributionId
        });

        new CfnOutput(this, 'ImageRepositoryBucket', {
            value: imageRepository.imageRepositoryBucket.bucketName
        });

        new CfnOutput(this, 'UserPoolId', {
            value: userPoolStack.userPool.userPoolId
        });

        new CfnOutput(this, 'UserPoolClientId', {
            value: userPoolStack.userPoolClient.userPoolClientId
        });

        new CfnOutput(this, 'IdentityPoolId', {
            value: userPoolStack.identityPool.ref
        });
    }
}

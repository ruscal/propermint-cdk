import { CfnOutput, Construct, Stack, StackProps } from 'monocdk';
import { GraphQlStack } from './GraphQlStack';
import { ImageRepository } from './ImageRespository';
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

        const graphQlStack = new GraphQlStack(this, 'GraphQlStack', {
            userPool: userPoolStack.userPool,
            channelsTable: properMintDB.channelsTable
        });

        const imageRepository = new ImageRepository(this, 'ImageRepository', {
            domainName
        });

        new CfnOutput(this, 'ProjectRegion', {
            value: this.region
        });
    }
}

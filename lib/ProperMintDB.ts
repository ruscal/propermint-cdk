import { Construct } from 'monocdk';
import { AttributeType, BillingMode, Table } from 'monocdk/lib/aws-dynamodb';

export const CHANNELS_TABLE_VAR = 'CHANNELS_TABLE';

// DB Schema
// interface schema {
//     channel: {
//         id: string,
//         displayName: string;
//         isPrivate: boolean;
//     },
//     post: {
//         channelId: string;
//         author: string;
//     },
//     access: {
//         channelId: string;
//         userId: string;
//     }
// }

// posts by channel
// posts by user / channel
// channel by id
// channels by user
// public channels

export class ProperMintDB extends Construct {
    channelsTable: Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.channelsTable = new Table(this, 'ChannelsTable', {
            tableName: 'channels',
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'pk',
                type: AttributeType.STRING
            },
            sortKey: {
                name: 'sk',
                type: AttributeType.STRING
            }
        });

        this.channelsTable.addGlobalSecondaryIndex({
            indexName: 'postsByUser',
            partitionKey: {
                name: 'channelUser',
                type: AttributeType.STRING
            },
            sortKey: {
                name: 'timestamp',
                type: AttributeType.NUMBER
            }
        });

        this.channelsTable.addGlobalSecondaryIndex({
            indexName: 'posts',
            partitionKey: {
                name: 'postId',
                type: AttributeType.STRING
            }
        });
    }
}

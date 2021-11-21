import { Construct } from 'monocdk';
import { AttributeType, BillingMode, Table } from 'monocdk/lib/aws-dynamodb';

export const CHANNELS_TABLE_VAR = 'CHANNELS_TABLE';
export const REACTIONS_TABLE_VAR = 'REACTIONS_TABLE';

// DB Schema
// interface channelsSchema {
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

// interface reactionsSchema {
//     comment: {
//         id: string,
//         postId: string;
//         channelId: string;
//         comment: string;
//         userId: string;
//         timestamp: number;
//     },
//     like: {
//         id: string,
//         postId: string;
//         channelId: string;
//         commentId?: string;
//         userId: string;
//         timestamp: number;
//     }
// }

// comments by post
// likes by post
// likes by commment
// user has liked post -> user likes by postId
// user has liked comment -> user likes by postId

export class ProperMintDB extends Construct {
    channelsTable: Table;
    reactionsTable: Table;

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

        this.reactionsTable = new Table(this, 'ReactionsTable', {
            tableName: 'reactions',
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

        this.reactionsTable.addGlobalSecondaryIndex({
            indexName: 'reactionsByPost',
            partitionKey: {
                name: 'channelPost',
                type: AttributeType.STRING
            },
            sortKey: {
                name: 'reactionTimestamp',
                type: AttributeType.STRING
            }
        });

        this.reactionsTable.addGlobalSecondaryIndex({
            indexName: 'comments',
            partitionKey: {
                name: 'commentId',
                type: AttributeType.STRING
            },
            sortKey: {
                name: 'timestamp',
                type: AttributeType.STRING
            }
        });

        this.reactionsTable.addGlobalSecondaryIndex({
            indexName: 'likes',
            partitionKey: {
                name: 'likeId',
                type: AttributeType.STRING
            },
            sortKey: {
                name: 'timestamp',
                type: AttributeType.STRING
            }
        });
    }
}

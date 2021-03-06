import { Bucket, HttpMethods } from 'monocdk/lib/aws-s3';
import { Code, Function, Runtime } from 'monocdk/lib/aws-lambda';
import { SqsEventSource } from 'monocdk/lib/aws-lambda-event-sources';
import { ARecord, HostedZone, RecordTarget } from 'monocdk/lib/aws-route53';
import { CfnOutput, Construct } from 'monocdk';
import { DnsValidatedCertificate } from 'monocdk/lib/aws-certificatemanager';
import {
    CloudFrontWebDistribution,
    SecurityPolicyProtocol,
    SSLMethod
} from 'monocdk/lib/aws-cloudfront';
import { CloudFrontTarget } from 'monocdk/lib/aws-route53-targets';

export interface ImageRepositoryProps {
    domainName: string;
}

export class ImageRepository extends Construct {
    imageRepositoryBucket: Bucket;
    distribution: CloudFrontWebDistribution;

    constructor(scope: Construct, id: string, props: ImageRepositoryProps) {
        super(scope, id);

        const { domainName } = props;

        this.imageRepositoryBucket = new Bucket(this, 'imageRepository', {
            publicReadAccess: true,
            cors: [
                {
                    allowedHeaders: ['*'],
                    allowedMethods: [
                        HttpMethods.GET,
                        HttpMethods.HEAD,
                        HttpMethods.PUT,
                        HttpMethods.POST,
                        HttpMethods.DELETE
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
        });

        const zone = HostedZone.fromLookup(this, 'Zone', {
            domainName: domainName
        });
        const siteDomain = 'm.' + domainName;
        new CfnOutput(this, 'CDN', { value: 'https://' + siteDomain });

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

        this.distribution = new CloudFrontWebDistribution(
            this,
            'SiteDistribution',
            {
                aliasConfiguration: {
                    acmCertRef: certificateArn,
                    names: [siteDomain],
                    sslMethod: SSLMethod.SNI,
                    securityPolicy: SecurityPolicyProtocol.TLS_V1_1_2016
                },
                originConfigs: [
                    {
                        s3OriginSource: {
                            s3BucketSource: this.imageRepositoryBucket
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

        // Route53 alias record for the CloudFront distribution
        new ARecord(this, 'SiteAliasRecord', {
            recordName: siteDomain,
            target: RecordTarget.fromAlias(
                new CloudFrontTarget(this.distribution)
            ),
            zone
        });
    }
}

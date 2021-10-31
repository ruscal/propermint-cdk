#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'monocdk';
import { PropermintCdkStack } from '../lib/propermint-cdk-stack';

const app = new App();
new PropermintCdkStack(app, 'PropermintCdkStack', {
    env: { account: '259438430521', region: 'us-east-1' },
    domainName: 'propermint.life'

    /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

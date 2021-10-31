import {
    expect as expectCDK,
    matchTemplate,
    MatchStyle
} from '@aws-cdk/assert';
import * as cdk from 'monocdk';
import * as PropermintCdk from '../lib/propermint-cdk-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new PropermintCdk.PropermintCdkStack(app, 'MyTestStack', {
        domainName: 'test.com'
    });
    // THEN
    expectCDK(stack).to(
        matchTemplate(
            {
                Resources: {}
            },
            MatchStyle.EXACT
        )
    );
});

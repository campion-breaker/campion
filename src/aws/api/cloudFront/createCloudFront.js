const sdk = require('../sdk');
const configDir = require('../../utils/configDir');
require('dotenv').config({ path: `${configDir}/.env` });

const createCloudFront = () => {
  const params = {
    DistributionConfig: {
      CallerReference: Date.now().toString(),
      Comment: '',
      Origins: {
        Items: [
          {
            DomainName: 'campion-breaker.github.io',
            Id: 'campion',
            CustomOriginConfig: {
              HTTPPort: 80,
              HTTPSPort: 443,
              OriginProtocolPolicy: 'match-viewer',
            },
          },
        ],
        Quantity: 1,
      },
      DefaultCacheBehavior: {
        TargetOriginId: 'campion',
        ViewerProtocolPolicy: 'allow-all',
        AllowedMethods: {
          Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
          Quantity: 7,
        },
        LambdaFunctionAssociations: {
          Quantity: 1,
          Items: [
            {
              EventType: 'viewer-request',
              LambdaFunctionARN: process.env.AWS_LAMBDA_ARN,
              IncludeBody: true,
            },
          ],
        },
        MinTTL: 0,
        ForwardedValues: {
          Cookies: {
            Forward: `all`,
            WhitelistedNames: {
              Quantity: 0,
            },
          },
          QueryString: true,
        },
      },
      Enabled: true,
    },
  };

  return sdk().cloudFront.createDistribution(params).promise();
};

module.exports = createCloudFront;

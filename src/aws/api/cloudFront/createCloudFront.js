const { cloudFront } = require('../sdk');
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
          },
        ],
        Quantity: 1,
      },
      CacheBehaviors: {
        Quantity: 1,
        Items: [
          {
            PathPattern: '/*',
            TargetOriginId: 'campion',
            ViewerProtocolPolicy: 'allow-all',
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
          },
        ],
      },
      DefaultCacheBehavior: {
        TargetOriginId: 'campion',
        ViewerProtocolPolicy: 'allow-all',
        AllowedMethods: {
          Items: ['GET', 'HEAD'],
          Quantity: 2,
        },
      },
      Enabled: true,
    },
  };

  return cloudFront.createDistribution(params).promise();
};

module.exports = createCloudFront;

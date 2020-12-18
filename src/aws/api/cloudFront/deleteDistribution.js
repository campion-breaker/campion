const sdk = require("../sdk");

const deleteDistribution = async (Id) => {
  let e_tag;
  let disabled;
  const cloudFront = sdk().cloudFront;
  
  async function disableCloudfrontDistribution() {
    const previousDistributionConfig = await cloudFront
      .getDistributionConfig({
        Id,
      })
      .promise();
    e_tag = previousDistributionConfig.ETag;

    if (previousDistributionConfig.DistributionConfig.Enabled === false) {
      return;
    }

    previousDistributionConfig.DistributionConfig.Enabled = false;

    const disableParams = {
      Id,
      DistributionConfig: previousDistributionConfig.DistributionConfig,
      IfMatch: e_tag,
    };
    return cloudFront.updateDistribution(disableParams).promise();
  }

  await disableCloudfrontDistribution(Id);

  while (disabled !== "Deployed") {
    const previousDistribution = await cloudFront
      .getDistribution({
        Id,
      })
      .promise();

    disabled = previousDistribution.Distribution.Status;
    e_tag = previousDistribution.ETag;
  }

  const deleteParams = {
    Id,
    IfMatch: e_tag,
  };

  await new Promise((resolve) => setTimeout(() => resolve(), 2000));

  return cloudFront.deleteDistribution(deleteParams).promise()
};

module.exports = deleteDistribution;

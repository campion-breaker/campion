const { cloudFront } = require("../sdk");

const deleteDistribution = async (Id) => {
  let e_tag;
  let disabled;
  async function disableCloudfrontDistribution() {
    const previousDistributionConfig = await cloudFront
      .getDistributionConfig({
        Id,
      })
      .promise();
    e_tag = previousDistributionConfig.ETag;

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

  return cloudFront.deleteDistribution(deleteParams).promise();
};

module.exports = deleteDistribution;

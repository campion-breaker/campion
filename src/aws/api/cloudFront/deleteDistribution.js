const { cloudFront } = require('../sdk');

const deleteDistribution = (Id) => {
  const params = {
    Id,
  };

  return cloudFront.deleteDistribution(params).promise();
};

module.exports = deleteDistribution;

const sdk = require('../sdk');

const deleteTable = (TableName) => {
  const params = {
    TableName,
  };

  return sdk().ddb.deleteTable(params).promise();
};

module.exports = deleteTable;

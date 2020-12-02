const { ddb } = require('../sdk');

const deleteTable = (TableName) => {
  const params = {
    TableName,
  };

  return ddb.deleteTable(params).promise();
};

module.exports = deleteTable;

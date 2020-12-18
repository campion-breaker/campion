const sdk = require('../sdk');

const createTable = (TableName) => {
  const params = {
    AttributeDefinitions: [{ AttributeName: 'ID', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'ID', KeyType: 'HASH' }],
    TableName,
    BillingMode: 'PAY_PER_REQUEST',
  };

  return sdk().ddb.createTable(params).promise();
};

module.exports = createTable;

const { ddb } = require('../sdk');

const createTables = () => {
  const params = {
    AttributeDefinitions: [{ AttributeName: 'ID', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'ID', KeyType: 'HASH' }],
    TableName: 'SERVICES_CONFIG',
    BillingMode: 'PAY_PER_REQUEST',
  };

  return ddb.createTable(params).promise();
};

module.exports = createTables;

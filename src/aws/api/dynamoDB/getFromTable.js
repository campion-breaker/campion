const { ddb } = require('../sdk');

const formatItem = (item) => {
  const result = {};
  Object.keys(item).forEach((attr) => {
    const type = Object.keys(item[attr])[0] === 'S' ? 'S' : 'N';
    result[attr] = type === 'S' ? item[attr][type] : +item[attr][type];
  });
  return result;
};

async function getFromTable(tableName) {
  const params = {
    TableName: tableName,
  };

  const result = [];
  try {
    const data = await ddb.scan(params).promise();
    data.Items.forEach((item) => result.push(formatItem(item)));
  } catch (e) {
    console.log(e);
  }

  return result;
}

module.exports = getFromTable;

const { ddb } = require("../sdk");

const formatItem = (item) => {
  const result = {};
  Object.keys(item).forEach((attr) => {
    const type = Object.keys(item[attr])[0] === "S" ? "S" : "N";
    result[attr] = type === "S" ? item[attr][type] : +item[attr][type];
  });
  return result;
};

async function getAllServiceConfigs(tableName) {
  const params = {
    TableName: tableName,
  };

  const result = [];
  await ddb
    .scan(params, (err, data) => {
      data.Items.forEach((item) => result.push(formatItem(item)));
    })
    .promise();

  return result;
}

module.exports = getAllServiceConfigs;

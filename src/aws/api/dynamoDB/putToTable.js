const { ddb } = require("../sdk");

async function putToTable(tableName, item) {
  const params = {
    TableName: tableName,
    Item: formatItem(item),
  };

  return ddb.putItem(params).promise();
}

const formatItem = (item) => {
  const attrType = (attr) => {
    return typeof attr === "string" ? "S" : "N";
  };

  const result = {};

  Object.keys(item).forEach((attr) => {
    result[attr] = {
      [attrType(item[attr])]: item[attr].toString(),
    };
  });

  return result;
};

module.exports = putToTable;

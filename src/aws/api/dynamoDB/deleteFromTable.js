const { ddb } = require("../sdk");

async function deleteFromTable(tableName, items) {
  for (let i = 0; i < items.length; i += 1) {
    const params = {
      TableName: tableName,
      Key: {
        [items[i].ID]: {
          S: items[i].ID,
        },
      },
    };
    console.log(params);
    ddb.deleteFromTable(params).promise();
  }
}

module.exports = deleteFromTable;

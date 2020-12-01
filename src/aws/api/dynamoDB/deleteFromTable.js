const { ddb } = require("../sdk");

async function deleteFromTable(tableName, items) {
  let itemsCopy = [...[items].flat()];
  const promises = [];

  while (itemsCopy.length > 0) {
    const slice = itemsCopy.slice(0, 25);
    itemsCopy = itemsCopy.slice(25);

    const paramsInner = [];
    for (let i = 0; i < slice.length; i++) {
      const item = {
        DeleteRequest: {
          Key: {
            ID: {
              S: slice[i].ID
            }
          }
        }
      };
      paramsInner.push(item);
    }

    const params = {
      RequestItems: {
        [tableName]: paramsInner
      }
    };

    promises.push(ddb.batchWriteItem(params).promise());
  };

  return Promise.all(promises);
}

module.exports = deleteFromTable;

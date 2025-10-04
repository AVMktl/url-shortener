// config/azureTables.js
const { AzureNamedKeyCredential, TableClient } = require('@azure/data-tables');

const account = process.env.AZURE_STORAGE_ACCOUNT;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

if (!account || !accountKey) {
  throw new Error('Missing Azure Tables credentials in env');
}

const credential = new AzureNamedKeyCredential(account, accountKey);
const baseUrl = `https://${account}.table.core.windows.net`;

function tableClient(tableName) {
  return new TableClient(baseUrl, tableName, credential);
}

async function createIfNotExists(tableName) {
  const client = tableClient(tableName);
  try {
    await client.createTable();
    console.log(`Created table: ${tableName}`);
  } catch (err) {
    // 409 = Table already exists
    if (err.statusCode && err.statusCode !== 409) {
      console.error(`Error creating table ${tableName}:`, err);
      throw err;
    }
  }
  return client;
}

module.exports = { tableClient, createIfNotExists };


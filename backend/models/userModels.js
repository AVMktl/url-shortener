// models/userModel.js
const { v4: uuidv4 } = require('uuid');
const { tableClient } = require('../config/azureTables');

const USERS_TABLE = process.env.USERS_TABLE_NAME || 'Users';

function client() {
  return tableClient(USERS_TABLE);
}

/**
 * Store user:
 * PartitionKey = 'user'
 * RowKey = userId (uuid)
 * email, name, passwordHash, createdAt
 */
async function createUser({ email, passwordHash, name = '' }) {
  const id = uuidv4();
  const entity = {
    partitionKey: 'user',
    rowKey: id,
    email,
    name,
    passwordHash,
    createdAt: new Date().toISOString()
  };
  await client().createEntity(entity);
  return { id, email, name };
}

async function getUserByEmail(email) {
  // Azure Tables: no secondary index; query by filter
  const filter = `email eq '${email.replace(/'/g, "''")}'`;
  const iter = client().listEntities({ queryOptions: { filter } });
  for await (const e of iter) return e;
  return null;
}

async function getUserById(userId) {
  try {
    const e = await client().getEntity('user', userId);
    return e;
  } catch (err) {
    if (err.statusCode === 404) return null;
    throw err;
  }
}

module.exports = { createUser, getUserByEmail, getUserById, USERS_TABLE };


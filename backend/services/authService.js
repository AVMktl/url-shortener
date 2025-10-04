// services/authService.js
const { v4: uuidv4 } = require('uuid');
const { tableClient } = require('../config/azureTables');

const REFRESH_TABLE = process.env.REFRESH_TOKENS_TABLE_NAME || 'RefreshTokens';

function refreshClient() {
  return tableClient(REFRESH_TABLE);
}

/**
 * Save a refresh token record so we can revoke / validate server-side.
 * PartitionKey = userId
 * RowKey = tokenId
 * expiresAt = ISO
 */
async function storeRefreshToken({ userId, tokenId, expiresAt }) {
  await refreshClient().createEntity({
    partitionKey: userId,
    rowKey: tokenId,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString()
  });
}

async function isRefreshTokenValid(userId, tokenId) {
  try {
    const e = await refreshClient().getEntity(userId, tokenId);
    if (!e) return false;
    return new Date(e.expiresAt) > new Date();
  } catch (err) {
    if (err.statusCode === 404) return false;
    throw err;
  }
}

async function revokeRefreshToken(userId, tokenId) {
  try {
    await refreshClient().deleteEntity(userId, tokenId);
  } catch (err) {
    // ignore
  }
}

module.exports = { storeRefreshToken, isRefreshTokenValid, revokeRefreshToken };


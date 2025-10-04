// models/urlModel.js
const { nanoid } = require('nanoid');
const { v4: uuidv4 } = require('uuid');
const { tableClient } = require('../config/azureTables');

const SHORT_URL_TABLE = process.env.SHORT_URL_TABLE_NAME || 'ShortUrls';
const URL_CLICKS_TABLE = process.env.URL_CLICKS_TABLE_NAME || 'UrlClicks';

function urlClient() { return tableClient(SHORT_URL_TABLE); }
function clicksClient() { return tableClient(URL_CLICKS_TABLE); }

/**
 * Create short URL entity
 * If userId=null -> anonymous
 * alias: optional (generated if null)
 */
async function createShortUrl({ longUrl, userId = null, alias = null, expirationDate = null }) {
  if (!alias) alias = nanoid(6);
  const partitionKey = userId || 'anonymous';
  const rowKey = alias;

  const entity = {
    partitionKey,
    rowKey,
    longUrl,
    userId: userId || null,
    createdAt: new Date().toISOString(),
    expirationDate: expirationDate || null,
    totalClicks: 0
  };

  await urlClient().createEntity(entity);
  return entity;
}

/**
 * Get short URL entity by alias (search anonymous + all users)
 */
async function getShortUrl(alias) {
  // Try anonymous first
  try {
    return await urlClient().getEntity('anonymous', alias);
  } catch (err) {
    if (err.statusCode !== 404) throw err;
  }

  // Try users (since PartitionKey = userId, we need to scan)
  const iter = urlClient().listEntities();
  for await (const e of iter) {
    if (e.rowKey === alias) return e;
  }

  return null;
}

/**
 * Increment totalClicks
 */
async function incrementClicks(urlEntity) {
  urlEntity.totalClicks = (urlEntity.totalClicks || 0) + 1;
  await urlClient().updateEntity(urlEntity, 'Merge');
}

/**
 * Log click
 */
async function logClick({ alias, userAgent, referrer, ip, country = 'unknown', region = 'unknown', city = 'unknown' }) {
  const entity = {
    partitionKey: alias,
    rowKey: uuidv4(),
    clickedAt: new Date().toISOString(),
    userAgent,
    referrer: referrer || null,
    ip,
    country,
    region,
    city
  };
  await clicksClient().createEntity(entity);
}

/**
 * List URLs by userId
 */
async function listUrlsByUser(userId) {
  const iter = urlClient().listEntities({ queryOptions: { filter: `PartitionKey eq '${userId}'` } });
  const urls = [];
  for await (const u of iter) urls.push(u);
  return urls;
}

module.exports = { createShortUrl, getShortUrl, incrementClicks, logClick, listUrlsByUser, SHORT_URL_TABLE, URL_CLICKS_TABLE };
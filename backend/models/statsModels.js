// models/statsModel.js
const { tableClient } = require('../config/azureTables');
const { URL_CLICKS_TABLE } = require('./urlModels');

const clicksClient = tableClient(URL_CLICKS_TABLE);

async function getClicksByAlias(alias) {
  const clicks = [];
  for await (const click of clicksClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${alias}'` } })) {
    clicks.push(click);
  }
  return clicks;
}

/**
 * Aggregate clicks: by day, top referrers, top user agents, last click
 */
function aggregateClicks(clicks) {
  const clicksByDay = {};
  const topReferrers = {};
  const topUserAgents = {};
  let lastClick = null;

  clicks.forEach(c => {
    const date = new Date(c.clickedAt).toISOString().split('T')[0]; // YYYY-MM-DD
    clicksByDay[date] = (clicksByDay[date] || 0) + 1;

    if (c.referrer) topReferrers[c.referrer] = (topReferrers[c.referrer] || 0) + 1;
    if (c.userAgent) topUserAgents[c.userAgent] = (topUserAgents[c.userAgent] || 0) + 1;

    const clickedAt = new Date(c.clickedAt);
    if (!lastClick || clickedAt > lastClick) lastClick = clickedAt;
  });

  return { clicksByDay, topReferrers, topUserAgents, lastClick };
}

module.exports = { getClicksByAlias, aggregateClicks };

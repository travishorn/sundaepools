const axios = require("axios");

exports.handler = async function (event) {
  const tickers = event.queryStringParameters.tickers.split(",");

  /*
   * Big problem: This API endpoint doesn't return all pools. 14 of the 30
   * SundaeSwap pools are missing.
   */
  const { data: apRes } = await axios.get("https://a.adapools.org/yoroi-api/");

  const poolData = [];

  Object.entries(apRes.pools).forEach(([index, pool]) => {
    if (tickers.includes(pool.db_ticker)) {
      poolData.push({
        ticker: pool.db_ticker,
        roa: pool.roa,
        saturation: pool.saturation,
        totalStake: pool.total_stake,
        bpe: pool.blocks_epoch,
        margin: pool.tax_ratio,
        pledge: pool.pledge,
      });
    }
  });

  const poolDataAlpha = poolData.sort((a, b) => {
    if ((a.ticker) > (b.ticker)) return 1;
    if ((a.ticker) < (b.ticker)) return -1;
    return 0;
  });

  const tickLen = poolDataAlpha.reduce((prev, curr) => {
    return curr.ticker.length > prev ? curr.ticker.length : prev;
  }, 4);

  console.log(tickLen);

  const header = `| ${"Pool".padEnd(tickLen)} | ROA   | Sat | Stake  | BPE | Margin | Pledge |
|${"-".padEnd(tickLen + 2, "-")}|-------|-----|--------|-----|--------|--------|
`;
  
  const tableData = poolDataAlpha.map((pool) => {
    const ticker = pool.ticker.padEnd(tickLen);
    const roa = `${(+pool.roa).toFixed(2)}%`;
    const saturation = `${(+pool.saturation * 100).toFixed()}%`;
    const stake = `${(+pool.totalStake / 1000000000000).toFixed(2)}M`;
    const bpe = pool.bpe.padStart(3);
    const margin = `${(+pool.margin * 100).toFixed(2)}%`;
    const pledge = `${(+pool.pledge / 1000000000000).toFixed(2)}M`;
    
    return `| ${ticker} | ${roa} | ${saturation} | ${stake} | ${bpe} |  ${margin} |  ${pledge} |`;
  });

  return {
    statusCode: 200,
    body: `${header}${tableData.join("\r\n")}`,
  };
};

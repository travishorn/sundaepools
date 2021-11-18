const axios = require("axios");

exports.handler = async function (event) {
  const { data: res } = await axios.get("https://smashpeek.com/ppservices/pooldetails/getsundaepools");

  const poolData = res.pools.map((pool) => {
    return {
      ticker: pool.ticker,
      saturation: pool.pct_saturated,
      stake: pool.live_stake,
      margin: pool.margin_pct,
      pledge: pool.pledge.replace(/,/g, ""),
    };
  });

  const poolDataAlpha = poolData.sort((a, b) => {
    if ((a.ticker) > (b.ticker)) return 1;
    if ((a.ticker) < (b.ticker)) return -1;
    return 0;
  });

  const tickLen = poolDataAlpha.reduce((prev, curr) => {
    return curr.ticker.length > prev ? curr.ticker.length : prev;
  }, 4);

  const header = `\`\`\`
| ${"Pool".padEnd(tickLen)} |  Sat | Stake | Margin | Pledge |
|${"-".padEnd(tickLen + 2, "-")}|------|-------|--------|--------|
`;
  
  const tableData = poolDataAlpha.map((pool) => {
    const ticker = pool.ticker.padEnd(tickLen);
    const saturation = `${(+pool.saturation).toFixed().padStart(3)}%`;
    const stake = `${(pool.stake / 1000000).toFixed(1)}M`.padStart(5);
    const margin = `${pool.margin}%`.padStart(6);
    const pledge = `${(+pool.pledge / 1000000).toFixed(2)}M`;
    
    return `| ${ticker} | ${saturation} | ${stake} | ${margin} |  ${pledge} |`;
  });

  const footer = `
\`\`\``;

  return {
    statusCode: 200,
    body: `${header}${tableData.join("\r\n")}${footer}`,
  };
};

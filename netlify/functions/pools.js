const axios = require("axios");

const genSeparated = (data, separator) => {
  const header = "Pool,Sat,Stake,Margin,Pledge\r\n";
    
  const tableData = data.map((pool) => {
    const ticker = pool.ticker;
    const saturation = (pool.saturation / 100).toFixed(4);
    const stake = pool.stake;
    const margin = (pool.margin / 100).toFixed(4);
    const pledge = pool.pledge;
    
    return `${ticker},${saturation},${stake},${margin},${pledge}`;
  });

  const output =`${header}${tableData.join("\r\n")}`;
  
  return separator && separator !== "," ?
         output.replace(/,/g, separator) :
         output;
};

const genCsv = (data) => {
  return genSeparated(data, ",");
};

const genTsv = (data) => {
  return genSeparated(data, "\t");
};

const genMarkdown = (data) => {
  const tickLen = data.reduce((prev, curr) => {
    return curr.ticker.length > prev ? curr.ticker.length : prev;
  }, 4);

  const header = `| ${"Pool".padEnd(tickLen)} |  Sat | Stake | Margin | Pledge |
|${"-".padEnd(tickLen + 2, "-")}|------|-------|--------|--------|
`;
  
  const tableData = data.map((pool) => {
    const ticker = pool.ticker.padEnd(tickLen);
    const saturation = `${(+pool.saturation).toFixed().padStart(3)}%`;
    const stake = `${(pool.stake / 1000000).toFixed(1)}M`.padStart(5);
    const margin = `${pool.margin}%`.padStart(6);
    const pledge = `${(+pool.pledge / 1000000).toFixed(2)}M`;
    
    return `| ${ticker} | ${saturation} | ${stake} | ${margin} |  ${pledge} |`;
  });

  return `${header}${tableData.join("\r\n")}`;
};

exports.handler = async function (event) {
  const { data: res } = await axios.get("https://smashpeek.com/ppservices/pooldetails/getsundaepools");

  const poolData = res.pools.map((pool) => {
    return {
      ticker: pool.ticker.replace(/,/g, ""),
      saturation: pool.pct_saturated.replace(/,/g, ""),
      stake: pool.live_stake.replace(/,/g, ""),
      margin: pool.margin_pct.replace(/,/g, ""),
      pledge: pool.pledge.replace(/,/g, ""),
    };
  });

  const poolDataAlpha = poolData.sort((a, b) => {
    if ((a.ticker) > (b.ticker)) return 1;
    if ((a.ticker) < (b.ticker)) return -1;
    return 0;
  });

  let output;

  switch (event.queryStringParameters.format) {
    case "csv":
      output = genCsv(poolDataAlpha);
      break;
    case "tsv":
      output = genTsv(poolDataAlpha);
      break;
    default:
      output = genMarkdown(poolDataAlpha);
  };

  return {
    statusCode: 200,
    body: output,
  };
};

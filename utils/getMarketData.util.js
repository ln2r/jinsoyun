import ago from 's-ago';
import { MARKET_LIMIT } from "../consts/MarketLimit.const";
import { getCurrency } from "./getCurrency.util";
import { removeDuplicates } from "./removeDuplicates.util";

export const getMarketData = (data) => {
  const clean = removeDuplicates(data);

  let out = (data.length > MARKET_LIMIT)? `Returning ${MARKET_LIMIT} out of ${clean.length} results found.\n\n` : '';
  if (data.length > MARKET_LIMIT) {
    let i = 0;
    for(i; i < MARKET_LIMIT; i++) {
      out += `**${data[i].name}**
        - Updated: ${ago(new Date(data[i].ISO))}
        - Each: ${getCurrency(data[i].priceEach)}
      `;
    }
  } else {
    clean.map(item => {
      out += `**${item.name}**
        - Updated: ${ago(new Date(item.ISO))}
        - Each: ${getCurrency(item.priceEach)}
      `;
    });
  }

  return out;
}
import get from 'axios'
import { redisClient } from '../configs/redis.config.js';
import { CACHE_AGE } from '../consts/CacheAge.const.js';

export const getApi = async (url, options) => {
  console.debug(`fetch: hitting "${url}"`);
  const cache = (options)? options.cache : true;

  // convert to lower case, 
  // since user input is sometimes incosistence
  url = url.toLowerCase();

  // if (cache) {
  //   const redis = await redisClient.get(url);
  //   if (redis) {
  //     console.debug(`fetch: cache hit`);
  //     return JSON.parse(redis);
  //   }
    
  //   console.debug(`fetch: cache miss`);
  // }
  
  let apiResponse = null;
  // try {
  //   apiResponse = await get(url);
  //   apiResponse = apiResponse.data.body;
  // } catch(err) {
  //   apiResponse = err.response.data.body.message;
  // } 

  apiResponse = await get(url);
  // update cache if its OK
  // if (cache) {
  //   if (apiResponse !== null) {
  //     await redisClient.set(
  //       url,
  //       JSON.stringify(apiResponse),
  //       'EX',
  //       CACHE_AGE
  //     )
  //   }
  // }

  console.log(apiResponse.data.body)

  return apiResponse.data.body;
}
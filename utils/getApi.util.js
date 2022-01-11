import get from 'axios'
import { redisClient } from '../configs/redis.config.js';
import { CACHE_AGE } from '../consts/CacheAge.const.js';

export const getApi = async (url) => {
  // convert to lower case, 
  // since user input is sometimes incosistence
  url = url.toLowerCase();

  const cache = await redisClient.get(url);
  if (cache) {
    console.debug(`fetch: cache hit`);
    return JSON.parse(cache);
  }
  
  console.debug(`fetch: cache miss`);
  let apiResponse = null
  try {
    apiResponse = await get(url);
    apiResponse = apiResponse.data.body;
  } catch(err) {
    apiResponse = err.response.data.body.message;
  } 

  // update cache if its OK
  if (apiResponse !== null) {
    await redisClient.set(
      url,
      JSON.stringify(apiResponse),
      'EX',
      CACHE_AGE
    )
  }

  return apiResponse;
}
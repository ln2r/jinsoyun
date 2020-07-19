const fetch = require('node-fetch');
const sendLog = require('../services/sendLog');

/**
 * getSiteData
 * Used to get JSON data from the 3rd party source
 * @param {String} address site address
 * @return data fetched from site in JSON format
 * @example
 *  // Using the function locally
 *  module.exports.getSiteData("https://api.silveress.ie/bns/v3/items");
 *
 *  // Using the function outside the file
 *  core.getSiteData("https://api.silveress.ie/bns/v3/items");
 */
module.exports = async function(address) {
  sendLog('debug', 'fetchSite', `Fetching data from ${address}...`);

  function fetch_ (url){
    return Promise.race([
      fetch(url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request Timed Out.')), 10000)
      )
    ]);
  }

  return fetch_(address)
    .then((res) =>{
      sendLog('debug', 'fetchSite', 'Fetched without problem.');
      return res;
    }).catch((err) => {
      sendLog('error', 'fetchSite', err);
      return {'status': 'error', err};
    });
};

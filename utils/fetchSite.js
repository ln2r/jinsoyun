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
  const FETCH_TIMEOUT = 10000;
  let timedOut = false;

  sendLog('debug', 'fetchSite', `Fetching data from ${address}...`);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(function() {
      timedOut = true;
      sendLog('warn', 'fetchSite', `Request to '${address}' timed out.`);
    }, FETCH_TIMEOUT);
      
    return fetch (address)
      .then((res) => {
        clearTimeout(timeout);
        if(!timedOut){
          resolve(res.json());
        }else{
          resolve({'status':'error', 'message':`Request to '${address}' timed out.`}); 
        }
      }).catch((err) => {
        if(timedOut) return;
        reject(err);           
      });
  }).then(()=>{
    sendLog('debug', 'fetchSite', 'Fetched without problem.');
  }).catch((err) => {
    sendLog('error', 'fetchSite', err);
  });
};

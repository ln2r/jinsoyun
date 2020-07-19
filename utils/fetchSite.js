const fetch = require('node-fetch');
const sendLog = require('../services/sendLog');

/**
 * getSiteData
 * Used to get JSON data from the 3rd party source
 * @param {String} address site address
 * @return data fetched from site in JSON format
 * @example
 *  fetchSite("https://api.silveress.ie/bns/v3/items");
 */
module.exports = function(address) {
  const FETCH_TIMEOUT = 10000;
  let timedOut = false;

  sendLog('debug', 'fetchSite', `Fetching data from ${address}...`);
  const timeOut = setTimeout(function() {
    timedOut = true;
    sendLog('warn', 'fetchSite', `Request to '${address}' timed out.`);
  }, FETCH_TIMEOUT);
  
  return fetch(address)
    .then((res) => {
      clearTimeout(timeOut);
      if(!timedOut){
        sendLog('debug', 'fetchSite', 'Fetched without problem.');
        return res.json();
      } else if(timedOut){
        return {'status':'error', 'message':`Request to '${address}' timed out.`};
      }      
    }).catch((err) => {
      sendLog('error', 'fetchSite', err);
      return {'status': 'error', err};
    });
};
const fetch = require('node-fetch');

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
module.exports = async function(address){
  return await fetch(address)
    .then((response) => {
      return response.json();
    })
    .catch((error) => {
      console.error('[core] [site-data] Error: '+error);
      module.exports.sendBotReport({'name': 'SiteFetchError', 'message': 'Unable to get site data, site unreachable', 'path': 'core.js (getSiteData)', 'code': 10400, 'method': 'GET'}, 'itemUpdate-core', 'error');

      return {'status': 'error', error};
    });
}
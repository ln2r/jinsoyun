/**
 * getPriceStatus
 * Used to get price status compared to last one
 * @param {Number} priceOld old price
 * @param {Number} priceNew the latest price
 * @return status price
 * @example
 * getPriceStatus(2000, 3000) // return +50.00%🔼
 */
module.exports = function(priceOld, priceNew){
  let priceStatus = ('0.00%') + '➖';
    
    if(priceNew !== priceOld) {     
      const percentage = (((priceNew - priceOld) / priceOld) * 100).toFixed(2);
      let symbol;
      let emoji;

      if (percentage < 0) {
          symbol = '';
          emoji = '🔽';
      } else {
          symbol = '+';
          emoji = '🔼';
      }

      priceStatus = (symbol + percentage+'%') + emoji;
    }

    return priceStatus;
}
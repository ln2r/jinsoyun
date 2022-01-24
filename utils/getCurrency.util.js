export const getCurrency = (string) => {
  const len = (string.toString()).length;
  let gold = '';
  let silver = '';
  let copper = '';

  if (len > 4) {
    gold = (string.toString()).substring( 0, len -4)+ '<:gold:463569669496897547>';
  }
  if (len > 2) {
    silver = (string.toString()).substring( len -2, len - 4 )+ '<:silver:463569669442371586>';
  }
  if (len > 0) {
    copper = (string.toString()).substring( len, len -2 )+ '<:copper:463569668095868928>';
  }

  const total = gold + silver + copper;
  return total;
}
export const getArrayContent = (array) => {
  let out = '';
  if (array.length === 0 || array[0] === 'n/a') {
    return 'No Data'
  } else {
    array.map(item => {
      out += `- ${item.replace('&#39;', '\'')}\n`
    });

    return out;
  }
}
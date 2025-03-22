// FIXME: find better way
export const removeDuplicates = (array) => {
  array.map((item, index) => {
    const itemIndex = index;
    array.map((compared, index) => {

      if (item.name === compared.name && itemIndex !== index) {
        array.splice(index, 1);
      }
    });
  });

  return array
};
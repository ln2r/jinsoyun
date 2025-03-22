export const getAccessories = (data) => {
  let out = '';
  const accesoriesType = ['soul', 'talisman', 'gloves', 'bracelet', 'belt', 'necklace', 'ring', 'earring', 'soulBadge', 'mysticBadge'];

  accesoriesType.map(item => {
    (data.equipments[item] !== 'n/a')? out += `- ${data.equipments[item]}\n` : ''
  });

  // adding pet
  out += `- ${data.equipments.pet.name} ${(data.equipments.pet.appearance === 'n/a')? '' : `(${data.equipments.pet.appearance})`}`;

  return out;
}
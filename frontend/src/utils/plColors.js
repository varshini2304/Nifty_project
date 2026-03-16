// frontend/src/utils/plColors.js
export const getColor = (value) => {
  if (value > 0) return 'green';
  if (value < 0) return 'red';
  return 'grey';
};

export const getColorClass = (value) => {
  const color = getColor(value);
  if (color === 'green') return 'text-green-700';
  if (color === 'red') return 'text-red-700';
  return 'text-gray-400';
};

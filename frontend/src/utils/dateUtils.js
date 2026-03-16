// frontend/src/utils/dateUtils.js
import dayjs from 'dayjs';

export const toDisplay = (value) => {
  if (!value) return '';
  const str = String(value);
  if (str.length !== 8) return '';
  return dayjs(str, 'YYYYMMDD').format('DD/MM/YYYY');
};

export const toInt = (dateValue) => {
  if (!dateValue) return null;
  return Number(dayjs(dateValue).format('YYYYMMDD'));
};

export const isValidInt = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && String(num).length === 8;
};

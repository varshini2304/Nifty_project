// backend/src/utils/dateUtils.js
const pad = (value) => String(value).padStart(2, '0');

const todayYYYYMMDD = () => {
  const now = new Date();
  return Number(`${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`);
};

const nowTimestamp = () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return `${datePart} ${timePart}`;
};

const isValidYYYYMMDD = (value) => {
  const num = Number(value);
  if (!Number.isInteger(num)) {
    return false;
  }

  const str = String(num);
  if (str.length !== 8) {
    return false;
  }

  const year = Number(str.slice(0, 4));
  const month = Number(str.slice(4, 6));
  const day = Number(str.slice(6, 8));
  if (year < 1900 || month < 1 || month > 12) {
    return false;
  }

  const maxDays = new Date(year, month, 0).getDate();
  return day >= 1 && day <= maxDays;
};

const prevDay = (value) => {
  const num = Number(value);
  const str = String(num);
  const year = Number(str.slice(0, 4));
  const month = Number(str.slice(4, 6));
  const day = Number(str.slice(6, 8));
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return Number(`${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`);
};

module.exports = {
  todayYYYYMMDD,
  nowTimestamp,
  prevDay,
  isValidYYYYMMDD,
};

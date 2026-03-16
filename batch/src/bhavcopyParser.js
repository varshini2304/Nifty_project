// batch/src/bhavcopyParser.js
const AdmZip = require('adm-zip');
const { parse } = require('fast-csv');
const { Readable } = require('stream');
const { nseGet } = require('./nseHttpClient');

const pad = (value) => String(value).padStart(2, '0');

const nowTimestamp = () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return `${datePart} ${timePart}`;
};

const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const buildBhavcopyUrl = (dateInt) => {
  const str = String(dateInt);
  const year = str.slice(0, 4);
  const month = str.slice(4, 6);
  const day = str.slice(6, 8);
  const monthIdx = Number(month) - 1;
  const monthName = monthNames[monthIdx];
  return `https://archives.nseindia.com/content/historical/EQUITIES/${year}/${monthName}/cm${day}${monthName}${year}bhav.csv.zip`;
};

const parseBhavcopy = async (dateInt, activeCodes) => {
  const url = buildBhavcopyUrl(dateInt);
  const response = await nseGet(url, { responseType: 'arraybuffer' });
  const zipBuffer = Buffer.from(response.data);

  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const csvEntry = entries.find((entry) => entry.entryName.toLowerCase().endsWith('.csv'));
  if (!csvEntry) {
    return [];
  }

  const csvBuffer = csvEntry.getData();
  const activeSet = new Set(activeCodes.map((code) => String(code).trim()));
  const rows = [];

  await new Promise((resolve, reject) => {
    Readable.from(csvBuffer)
      .pipe(parse({ headers: true, ignoreEmpty: true, trim: true }))
      .on('error', (err) => reject(err))
      .on('data', (row) => {
        const code = String(row.SYMBOL || '').trim();
        if (!code || !activeSet.has(code)) {
          return;
        }
        const priceClose = Number(row.CLOSE || 0);
        const price = Number(row.LAST || 0);
        rows.push({
          dt: Number(dateInt),
          code,
          price,
          priceClose,
          market: 'NSE',
          updateSource: 'bhavcopy',
          updateTime: nowTimestamp(),
        });
      })
      .on('end', () => resolve());
  });

  return rows;
};

module.exports = { parseBhavcopy, nowTimestamp };

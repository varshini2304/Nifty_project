// backend/src/services/plCalculator.js
const TradesList = require('../models/TradesList');
const StocksPriceList = require('../models/StocksPriceList');
const { prevDay } = require('../utils/dateUtils');

const round2 = (value) => Math.round(value * 100) / 100;

const positionPipeline = (code, cutoffDate) => [
  { $match: { code, tradeDate: { $lte: cutoffDate }, isDeleted: 0 } },
  {
    $group: {
      _id: '$code',
      positionSum: {
        $sum: {
          $multiply: [
            '$quantity',
            { $cond: [{ $eq: ['$side', 'B'] }, 1, -1] },
          ],
        },
      },
    },
  },
];

const cashflowPipeline = (code, dateInt) => [
  { $match: { code, tradeDate: dateInt, isDeleted: 0 } },
  {
    $group: {
      _id: '$code',
      cashflow: {
        $sum: {
          $multiply: [
            '$tradePrice',
            '$quantity',
            { $cond: [{ $eq: ['$side', 'B'] }, -1, 1] },
          ],
        },
      },
      tradePriceNumerator: {
        $sum: {
          $multiply: [
            '$tradePrice',
            '$quantity',
            { $cond: [{ $eq: ['$side', 'B'] }, 1, -1] },
          ],
        },
      },
      tradePriceDenominator: {
        $sum: {
          $multiply: [
            '$quantity',
            { $cond: [{ $eq: ['$side', 'B'] }, 1, -1] },
          ],
        },
      },
    },
  },
];

const tradePlPipeline = (code) => [
  { $match: { code, isDeleted: 0 } },
  {
    $group: {
      _id: '$code',
      tradePL: {
        $sum: {
          $multiply: [
            '$tradePrice',
            '$quantity',
            { $cond: [{ $eq: ['$side', 'B'] }, -1, 1] },
          ],
        },
      },
    },
  },
];

const getLatestTradeName = async (code) => {
  const trade = await TradesList.findOne({ code, isDeleted: 0 })
    .sort({ tradeDate: -1, tradeNo: -1 })
    .lean();
  return trade ? trade.name : '';
};

const calculatePL = async (dateInt) => {
  const codes = await TradesList.distinct('code', { isDeleted: 0 });
  if (codes.length === 0) {
    return [];
  }

  const t1 = prevDay(dateInt);

  const results = await Promise.all(
    codes.map(async (code) => {
      const [
        positionT,
        positionT1,
        cashflowAgg,
        tradePlAgg,
        priceTDoc,
        priceT1Doc,
        name,
      ] = await Promise.all([
        TradesList.aggregate(positionPipeline(code, dateInt)),
        TradesList.aggregate(positionPipeline(code, t1)),
        TradesList.aggregate(cashflowPipeline(code, dateInt)),
        TradesList.aggregate(tradePlPipeline(code)),
        StocksPriceList.findOne({ code, dt: dateInt }).lean(),
        StocksPriceList.findOne({ code, dt: t1 }).lean(),
        getLatestTradeName(code),
      ]);

      const positionTValue = positionT[0] ? Number(positionT[0].positionSum) : 0;
      const positionT1Value = positionT1[0] ? Number(positionT1[0].positionSum) : 0;
      const cashflowValue = cashflowAgg[0] ? Number(cashflowAgg[0].cashflow) : 0;
      const tradePlValue = tradePlAgg[0] ? Number(tradePlAgg[0].tradePL) : 0;

      const tradePriceNumerator = cashflowAgg[0]
        ? Number(cashflowAgg[0].tradePriceNumerator)
        : 0;
      const tradePriceDenominator = cashflowAgg[0]
        ? Number(cashflowAgg[0].tradePriceDenominator)
        : 0;

      const tradePriceValue = tradePriceDenominator !== 0
        ? tradePriceNumerator / tradePriceDenominator
        : 0;

      const priceT = priceTDoc ? Number(priceTDoc.price) : 0;
      const priceT1 = priceT1Doc && priceT1Doc.priceClose !== undefined
        ? Number(priceT1Doc.priceClose)
        : 0;

      const pctChange = priceT1 !== 0 ? ((priceT - priceT1) * 100) / priceT1 : 0;
      const pricePL = positionTValue * priceT - positionT1Value * priceT1;
      const pl = pricePL + cashflowValue;
      const totalPL = pricePL + tradePlValue;

      return {
        code,
        name,
        positionT: round2(positionTValue),
        positionT1: round2(positionT1Value),
        tradePrice: round2(tradePriceValue),
        cashflow: round2(cashflowValue),
        priceT: round2(priceT),
        priceT1: round2(priceT1),
        pctChange: round2(pctChange),
        pl: round2(pl),
        pricePL: round2(pricePL),
        tradePL: round2(tradePlValue),
        totalPL: round2(totalPL),
      };
    })
  );

  return results;
};

module.exports = {
  calculatePL,
};

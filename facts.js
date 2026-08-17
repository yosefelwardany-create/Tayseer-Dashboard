// Extracted 17 Aug 2026 from Zoho Books: balance sheet, AR aging by customer,
// and the monthly Sales-by-Item report. Figures in SAR. Generated, not hand-kept.

export const FACTS = {
 "asOf": "17 Aug 2026",
 "results": {
  "jan": -1012524.78,
  "feb": -1925422.11,
  "mar": -787733.7,
  "apr": -676781.58,
  "may": -1181651.11,
  "jun": -3297542.49,
  "jul": -1122755.79
 },
 "ytdJanJul": -10004411.56,
 "currentYearEarnings": -10049454.33,
 "augMtd": -45042.77,
 "mgmtFee": {
  "jan": 319838.54,
  "feb": 354855.84,
  "mar": 336289.13,
  "apr": 277937.04,
  "may": 322319.29,
  "jun": 310591.77,
  "jul": 144338.91
 },
 "advertising": {
  "jan": 304251.35,
  "feb": 260569.93,
  "mar": 279519.7,
  "apr": 84166.92,
  "may": 137256.36,
  "jun": 1040763.15,
  "jul": 456323.05
 },
 "inventory": {
  "tradingGoods": 4558123.83,
  "delistedSkus": 127059.0,
  "provisionDelisted": -127059.0,
  "provisionNearExpiry": -642362.42,
  "tradingSmall": 200.0
 },
 "receivables": {
  "domestic": 6799039.71,
  "legalAction": 554021.0,
  "provisionDoubtful": -343889.13,
  "provisionLegal": -554021.0
 },
 "aging": {
  "customers": 1514,
  "totalOutstanding": 7104595.09,
  "overdue": 1817333.4,
  "legal": 554021.08,
  "buckets": {
   "NotDue": 3830014.73,
   "0-7Days": 185310.29,
   "8-15Days": 745457.92,
   "16-30Days": 147565.41,
   "31-60Days": 201899.73,
   "61-90Days": 168056.54,
   "91-120Days": 89723.13,
   "121-150Days": 21364.56,
   "151-180Days": 57266.47,
   "181-270Days": 84288.58,
   "271-365Days": 56004.77,
   ">365": 60396.0
  },
  "top": [
   {
    "n": "Ninja Retail Company",
    "out": 1095087.0,
    "overdue": 0.0,
    "gt365": 0.0
   },
   {
    "n": "Keeta Technologies Arabia Limited",
    "out": 629194.69,
    "overdue": 0.0,
    "gt365": 0.0
   },
   {
    "n": "Danube Company Limited",
    "out": 427276.21,
    "overdue": 1423.53,
    "gt365": 0.0
   },
   {
    "n": "Tamimi Markets Co LLC- شركة أسواق التميمي المحدودة",
    "out": 341076.87,
    "overdue": 0.0,
    "gt365": 0.0
   },
   {
    "n": "Noon Ecommerce Solutions One Person Company LLC",
    "out": 334914.05,
    "overdue": 14051.35,
    "gt365": 0.0
   },
   {
    "n": "Panda Retail Company",
    "out": 283292.84,
    "overdue": 282.45,
    "gt365": 0.0
   },
   {
    "n": "Ninja Retail Company (V03670)",
    "out": 242732.74,
    "overdue": 0.0,
    "gt365": 0.0
   },
   {
    "n": "BinDawood Holding",
    "out": 235099.96,
    "overdue": 126616.93,
    "gt365": 0.0
   },
   {
    "n": "شركة السواحل التجارية",
    "out": 232760.0,
    "overdue": 0.0,
    "gt365": 0.0
   },
   {
    "n": "شركة دارك ستورز السعودية للتجارة Hungerstation",
    "out": 220988.45,
    "overdue": 0.0,
    "gt365": 0.0
   }
  ]
 },
 "sales": {
  "monthly": {
   "jan": {
    "cartons": 19096.4,
    "gross": 2897306.29,
    "net": 2053683.87,
    "sarPerCarton": 151.7
   },
   "feb": {
    "cartons": 8242.1,
    "gross": 1381470.02,
    "net": 869526.74,
    "sarPerCarton": 167.6
   },
   "mar": {
    "cartons": 15132.4,
    "gross": 2462444.22,
    "net": 2155219.02,
    "sarPerCarton": 162.7
   },
   "apr": {
    "cartons": 18584.2,
    "gross": 4420310.17,
    "net": 3395415.56,
    "sarPerCarton": 237.9
   },
   "may": {
    "cartons": 23061.5,
    "gross": 4484641.73,
    "net": 3578256.1,
    "sarPerCarton": 194.5
   },
   "jun": {
    "cartons": 17128.6,
    "gross": 3989368.83,
    "net": 3060384.8,
    "sarPerCarton": 232.9
   },
   "jul": {
    "cartons": 14402.2,
    "gross": 4293340.55,
    "net": 3261488.77,
    "sarPerCarton": 298.1
   }
  },
  "brandGross": {
   "Al-Ameed": {
    "jan": 0,
    "feb": 0,
    "mar": 0,
    "apr": 2955162.6,
    "may": 2548617.47,
    "jun": 1750421.39,
    "jul": 2553220.1
   },
   "Antaar": {
    "jan": 44369.4,
    "feb": 35462.61,
    "mar": 29083.29,
    "apr": 10214.48,
    "may": 33218.97,
    "jun": 5315.92,
    "jul": 2962.37
   },
   "CN": {
    "jan": 1167.53,
    "feb": 0.0,
    "mar": 0.0,
    "apr": 6.0,
    "may": 17294.51,
    "jun": 57855.31,
    "jul": 114296.5
   },
   "MS_Snacks": {
    "jan": 0.0,
    "feb": 6820.28,
    "mar": 0.0,
    "apr": 0.0,
    "may": 0.0,
    "jun": 0.0,
    "jul": 0
   },
   "Nongshim": {
    "jan": 2654546.48,
    "feb": 736656.94,
    "mar": 2190150.85,
    "apr": 1001196.88,
    "may": 1602692.73,
    "jun": 1456754.46,
    "jul": 1587961.65
   },
   "Tanza": {
    "jan": 119860.25,
    "feb": 19129.01,
    "mar": 2431.48,
    "apr": 9229.36,
    "may": 4620.24,
    "jun": 4272.0,
    "jul": 2360.0
   },
   "Unitop": {
    "jan": 77276.36,
    "feb": 583401.18,
    "mar": 240778.6,
    "apr": 263783.25,
    "may": 148935.31,
    "jun": 714749.75,
    "jul": 32539.93
   },
   "V7_VSS": {
    "jan": 0.02,
    "feb": 0.0,
    "mar": 0.0,
    "apr": 180635.0,
    "may": 129262.5,
    "jun": 0.0,
    "jul": 0.0
   }
  },
  "julReportVsLedgerGap": 5004.56
 }
};

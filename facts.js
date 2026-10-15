// Tayseer Trading — the facts outside the P&L rows: balance sheet, cash flow,
// AR aging and the monthly sales report. Figures in SAR.
//
// SOURCES
//   Balance sheet   Zoho Books, as of 15 Oct 2026
//   Cash flow       Zoho Books, 1–30 Sep 2026
//   Sales report    line-level export, ReportDate 2026-09, OrderStatus 4,
//                   aggregated here (its own Total row is dropped)
//   AR aging        as of 17 Aug 2026 — TWO MONTHS STALE. It has not been
//                   refreshed with either the August or the September pack.
//                   `agingAsOf` carries its own date so the app says so
//                   rather than implying the buckets are current.
//
// The statements agree: the September P&L result (+141,189.22) is the same
// figure the September cash flow statement carries as Net Income, and the
// 15 Oct balance sheet balances to nil.

export const FACTS = {
 "asOf": "15 Oct 2026",
 "plThrough": "Sep 2026",
 "agingAsOf": "17 Aug 2026",
 "results": {
  "jan": -1012524.78,
  "feb": -1925422.11,
  "mar": -787733.7,
  "apr": -676781.58,
  "may": -1181651.11,
  "jun": -3297542.49,
  "jul": -1122755.79,
  "aug": 26436.22,
  "sep": 141189.22
 },
 "ytdJanJul": -10004411.56,
 "ytdJanAug": -9977975.34,
 "ytdJanSep": -9836786.12,
 "currentYearEarnings": -9868534.03,
 // Current-year earnings on the 15 Oct balance sheet minus the Jan–Sep P&L:
 // what the first fifteen days of October have cost.
 "octMtd": -31747.91,
 // The mid-month trap, measured. Current-year earnings on the 18 Sep balance
 // sheet implied a (602,341) loss for 1–18 September. The closed month came in
 // at +141,189 — so the last twelve days of September moved the result by
 // +743,530. Either an extraordinary final fortnight or late bookings and
 // reversals; it is the same pattern the Restatement tab shows for July.
 "sepMidMonthImplied": -602341.23,
 "sepLateSwing": 743530.45,
 "mgmtFee": {
  "jan": 319838.54,
  "feb": 354855.84,
  "mar": 336289.13,
  "apr": 277937.04,
  "may": 322319.29,
  "jun": 310591.77,
  "jul": 144338.91,
  "aug": 157693.95,
  "sep": 0
 },
 // Advertising & promotions, whole family: 65100120 through August, then the
 // KA/EC sell-out subaccounts net of the Nongshim BTL refund.
 "advertising": {
  "jan": 304251.35,
  "feb": 260569.93,
  "mar": 279519.7,
  "apr": 84166.92,
  "may": 137256.36,
  "jun": 1040763.15,
  "jul": 456323.05,
  "aug": 30530.04,
  "sep": 119770.91
 },
 // What each profitable month owes to credits and omissions that do not recur.
 // Subtract these and August is (77,201); September is (184,527).
 "augCredits": [
  { "c": "65900030", "n": "Allowance for near expiry inventory — release", "v": -33222.42 },
  { "c": "70900000", "n": "Fines and penalties ~ Others — reversal", "v": -28817.98 },
  { "c": "65100090", "n": "Ramadan party expenses — reversal", "v": -21000.0 },
  { "c": "60000032", "n": "Insurance ~ Marine Cargo Open Cover — credit", "v": -12812.49 },
  { "c": "72020000", "n": "Exchange gain", "v": -6655.18 },
  { "c": "61201000", "n": "Travel tickets inside country — reversal", "v": -935.01 },
  { "c": "61202000", "n": "Travel tickets outside country — reversal", "v": -194.34 }
 ],
 "sepCredits": [
  { "c": "63003000", "n": "Management fees — NOT BOOKED (August level)", "v": -157693.95 },
  { "c": "65900030", "n": "Allowance for near expiry inventory — release", "v": -102306.18 },
  { "c": "651001211", "n": "Nongshim BTL refund — credit against advertising", "v": -65716.09 },
  { "c": "65105001", "n": "Other expense — reversal", "v": -69.3 }
 ],
 "sepUnderlying": -184527.0,
 "inventory": {
  "tradingGoods": 6581145.03,
  "delistedSkus": 25974.1,
  "provisionDelisted": -25974.1,
  "provisionNearExpiry": -607918.72,
  "tradingSmall": 200.0,
  "priorTradingGoods": 5718785.12,
  "priorAsOf": "18 Sep 2026"
 },
 "receivables": {
  "domestic": 9196146.55,
  "legalAction": 542044.09,
  "provisionDoubtful": -450304.69,
  "provisionLegal": -542044.09,
  "priorDomestic": 7480166.75,
  "priorLegalAction": 542044.09,
  "priorProvisionDoubtful": -397407.13
 },
 // September cash flow statement, as Zoho classifies it: the working-capital
 // movement (inventory, receivables) sits under Investing, not Operating.
 "cash": {
  "beginSep": 1714238.8,
  "endSep": 1701492.28,
  "operating": -3101183.01,
  "investing": 1088436.49,
  "financing": 2000000.0,
  "netChange": -12746.52,
  "inventoryRelease": 2738341.9,
  "receivablesBuild": -1707731.8,
  "advancesToTradePayables": -3455088.82,
  "payablesMovement": 125301.36,
  "outputVatMovement": 693643.54,
  "shareholderContributionSep": 2000000.0,
  "shareholderContributionCumulative": 17329801.55,
  "bankAtAsOf": 1088097.25,
  "pettyCashAtAsOf": 6976.22,
  // August, kept for the month-on-month comparison
  "priorMonth": {
   "label": "Aug 2026",
   "operating": -12440.59,
   "investing": -1721677.22,
   "financing": 2340484.0,
   "netChange": 606366.19
  }
 },
 "balanceSheet": {
  "accountsPayable": 428359.97,
  "outputVat": 1734763.67,
  "inputVat": 642053.31,
  "kaRebateProvision": 2373106.54,
  "kaSellOutProvision": -455454.87,
  "ecSellOutProvision": 264500.0,
  "endOfServiceProvision": 657205.08,
  "cashDiscountProvision": 54202.76,
  "provisionsAndAccruals": 1098559.99,
  "leaseLiabilityCurrent": 168162.71,
  "paidUpCapital": 5000000.0,
  "retainedEarnings": -30000.01,
  "shareholderContributions": 17329801.55,
  "totalEquity": 12431267.51
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
   "jan": { "cartons": 19096.4, "gross": 2897306.29, "net": 2053683.87, "sarPerCarton": 151.7 },
   "feb": { "cartons": 8242.1, "gross": 1381470.02, "net": 869526.74, "sarPerCarton": 167.6 },
   "mar": { "cartons": 15132.4, "gross": 2462444.22, "net": 2155219.02, "sarPerCarton": 162.7 },
   "apr": { "cartons": 18584.2, "gross": 4420310.17, "net": 3395415.56, "sarPerCarton": 237.9 },
   "may": { "cartons": 23061.5, "gross": 4484641.73, "net": 3578256.1, "sarPerCarton": 194.5 },
   "jun": { "cartons": 17128.6, "gross": 3989368.83, "net": 3060384.8, "sarPerCarton": 232.9 },
   "jul": { "cartons": 14402.2, "gross": 4293340.55, "net": 3261488.77, "sarPerCarton": 298.1 },
   "aug": { "cartons": 15957.56, "gross": 4179656.18, "net": 3615137.33, "sarPerCarton": 261.9 },
   "sep": { "cartons": 18363.01, "gross": 5709616.05, "net": 4594352.85, "sarPerCarton": 310.9 }
  },
  "brandGross": {
   "Al-Ameed": { "jan": 0, "feb": 0, "mar": 0, "apr": 2955162.6, "may": 2548617.47, "jun": 1750421.39, "jul": 2553220.1, "aug": 2089138.26, "sep": 3954443.31 },
   "Antaar": { "jan": 44369.4, "feb": 35462.61, "mar": 29083.29, "apr": 10214.48, "may": 33218.97, "jun": 5315.92, "jul": 2962.37, "aug": 57701.52, "sep": 118647.98 },
   "CN": { "jan": 1167.53, "feb": 0.0, "mar": 0.0, "apr": 6.0, "may": 17294.51, "jun": 57855.31, "jul": 114296.5, "aug": 0.0, "sep": 0.0 },
   "MS_Snacks": { "jan": 0.0, "feb": 6820.28, "mar": 0.0, "apr": 0.0, "may": 0.0, "jun": 0.0, "jul": 0, "aug": 0.0, "sep": 0.0 },
   "Nongshim": { "jan": 2654546.48, "feb": 736656.94, "mar": 2190150.85, "apr": 1001196.88, "may": 1602692.73, "jun": 1456754.46, "jul": 1587961.65, "aug": 1876671.62, "sep": 1481706.33 },
   "Tanza": { "jan": 119860.25, "feb": 19129.01, "mar": 2431.48, "apr": 9229.36, "may": 4620.24, "jun": 4272.0, "jul": 2360.0, "aug": 240.0, "sep": 0.0 },
   "Unitop": { "jan": 77276.36, "feb": 583401.18, "mar": 240778.6, "apr": 263783.25, "may": 148935.31, "jun": 714749.75, "jul": 32539.93, "aug": 155904.78, "sep": 154818.42 },
   "V7_VSS": { "jan": 0.02, "feb": 0.0, "mar": 0.0, "apr": 180635.0, "may": 129262.5, "jun": 0.0, "jul": 0.0, "aug": 0.0, "sep": 0.0 }
  },
  // Ledger gross minus the sales report's gross. July ran 5,005 light, August
  // tied exactly, September runs 4,781 the other way (report above ledger).
  "julReportVsLedgerGap": 5004.56,
  "augReportVsLedgerGap": 0.0,
  "sepReportVsLedgerGap": -4780.99,
  // Not in the ledger's returns accounts: the item report books these separately.
  "augCreditNotesOutsideReturns": 17289.93,
  "sepCreditNotesOutsideReturns": 29177.15
 }
};

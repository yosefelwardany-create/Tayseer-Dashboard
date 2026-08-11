// Tayseer Trading Company — May, June and July 2026
//
//   s    statement section: REV | COGS | OPEX | NOI | NOE
//   g    reporting group
//   n    account name
//   c    account code
//   may  May 2026 balance     <- editable in the app
//   jun  June 2026 balance    <- editable in the app
//   jul  July 2026 balance    <- editable in the app
//   o    treated as one-off / non-cash (our classification, not Tayseer's policy)
//   note why the line is flagged
//
// SOURCES — these differ, and it matters:
//   May 2026        from the audited analysis pack (Supporting Data, section A).
//                   Rebuilt May ties to that pack's own subtotals to the cent.
//   June, July 2026 from the monthly ledger export, which is later than the
//                   audited pack and does not agree with it. On 16 June accounts
//                   the two differ; in total the ledger shows June SAR 189,706
//                   worse than the audited pack. So a May-to-June comparison
//                   carries that basis difference inside it. June-to-July is
//                   clean — both months come from the same export.
//
//   Codes beginning AUD- are accounts that appear in the audited pack with May
//   activity but carry no code there and do not appear in the June/July export.
//
// Edit these figures to change the baseline the app resets to.

// The months held below. Add a key here and a matching field on every row
// to bring a new month into both the Monthly P&L and the control room.
export const MONTHS = [
  { key: "may", label: "May 2026", short: "May" },
  { key: "jun", label: "Jun 2026", short: "Jun" },
  { key: "jul", label: "Jul 2026", short: "Jul" },
];

export const BASELINE = [
  {"s": "REV", "g": "Revenue", "n": "Sales returns ~ Domestic", "c": "41001000", "may": -273171.11, "jun": -117923.86, "jul": -493629.49, "o": false},
  {"s": "REV", "g": "Revenue", "n": "Sales revenue ~ Domestic", "c": "41000000", "may": 4473020.88, "jun": 3989368.83, "jul": 4298345.11, "o": false},
  {"s": "COGS", "g": "Cost of Goods Sold", "n": "Cash Discount, CN or Debit Memo", "c": "61502312", "may": 878.18, "jun": 461.22, "jul": 163.82, "o": false},
  {"s": "COGS", "g": "Cost of Goods Sold", "n": "Cost of sales/change in finished goods", "c": "50300010", "may": 2491422.99, "jun": 2230562.11, "jul": 2263830.07, "o": false},
  {"s": "COGS", "g": "Cost of Goods Sold", "n": "LIQ Discount/Promotion", "c": "61502307", "may": 125038.85, "jun": 212200.0, "jul": 0.0, "o": false},
  {"s": "COGS", "g": "Cost of Goods Sold", "n": "LIQ Discount/Promotion (Nongshim)", "c": "61502306", "may": 17851.0, "jun": 46291.96, "jul": 19003.25, "o": false},
  {"s": "COGS", "g": "Cost of Goods Sold", "n": "Price discounts", "c": "61502310", "may": 8531.44, "jun": 0.0, "jul": 19767.38, "o": false},
  {"s": "COGS", "g": "Cost of Goods Sold", "n": "Price discounts - Al Ameed", "c": "61502309", "may": -41979.58, "jun": 35079.77, "jul": 41241.3, "o": false},
  {"s": "COGS", "g": "Cost of Goods Sold", "n": "Promotion/ QTY Discount", "c": "61502300", "may": -18384.87, "jun": 95076.36, "jul": 358.72, "o": false},
  {"s": "COGS", "g": "Cost of Goods Sold", "n": "Promotion/ QTY Discount (Nongshim)", "c": "61502305", "may": 26905.3, "jun": 10716.21, "jul": 13342.84, "o": false},
  {"s": "COGS", "g": "Cost of Goods Sold", "n": "Promotion/ QTY Discount - Al Ameed", "c": "61502308", "may": 454017.0, "jun": 254500.5, "jul": 404833.23, "o": false},
  {"s": "OPEX", "g": "3PL / Warehousing", "n": "Administrative fees", "c": "65105000", "may": 9200.0, "jun": 1200.0, "jul": 0.0, "o": false},
  {"s": "OPEX", "g": "3PL / Warehousing", "n": "Loading expenses", "c": "65000120", "may": 7000.0, "jun": 20226.8, "jul": 10311.2, "o": false},
  {"s": "OPEX", "g": "3PL / Warehousing", "n": "overtime cost ~ Warehouse", "c": "65000131", "may": 0.0, "jun": 640.0, "jul": 0.0, "o": false},
  {"s": "OPEX", "g": "3PL / Warehousing", "n": "Rent warehouse/store", "c": "63005100", "may": 18000.0, "jun": 29710.0, "jul": 31800.0, "o": false},
  {"s": "OPEX", "g": "3PL / Warehousing", "n": "Sorting Charges", "c": "61730030", "may": 20000.0, "jun": -2359.8, "jul": 3542.7, "o": false},
  {"s": "OPEX", "g": "3PL / Warehousing", "n": "Un-loading expenses", "c": "65000130", "may": 12000.0, "jun": 10162.3, "jul": 10004.2, "o": false},
  {"s": "OPEX", "g": "Advertising & Marketing", "n": "Advertising & Promotions expenses", "c": "65100120", "may": 136854.2, "jun": 1040763.15, "jul": 16136.83, "o": true, "note": "Campaign/promo accrual booked in June, not monthly spend"},
  {"s": "OPEX", "g": "Advertising & Marketing", "n": "Tasting Campaign - Al Ameed", "c": "65900076", "may": 26496.81, "jun": 7704.7, "jul": 3343.53, "o": false},
  {"s": "OPEX", "g": "Advertising & Marketing", "n": "Tasting Campaign - Other product", "c": "65900074", "may": 1496.33, "jun": 628.99, "jul": 85.9, "o": false},
  {"s": "OPEX", "g": "Advertising & Marketing", "n": "Tasting Campaign- Jeddah", "c": "65900072", "may": 4767.81, "jun": 556.34, "jul": 0.0, "o": false},
  {"s": "OPEX", "g": "Advertising & Marketing", "n": "Tasting Campaign- Riyadh", "c": "65900073", "may": 229.3, "jun": 68.16, "jul": 221.96, "o": false},
  {"s": "OPEX", "g": "Depreciation", "n": "Depreciation on Right-of-use assets", "c": "66000002", "may": 12165.0, "jun": 12173.0, "jul": 13564.0, "o": false},
  {"s": "OPEX", "g": "Depreciation", "n": "Depreciation ~ Building", "c": "641000030", "may": 14357.0, "jun": 14357.0, "jul": 14357.0, "o": false},
  {"s": "OPEX", "g": "Depreciation", "n": "Depreciation ~ Computers & Communication", "c": "64200030", "may": 6787.72, "jun": 6582.16, "jul": 6582.16, "o": false},
  {"s": "OPEX", "g": "Depreciation", "n": "Depreciation ~ Furniture, Fixtures and Fittings", "c": "64200040", "may": 550.52, "jun": 550.62, "jul": 706.62, "o": false},
  {"s": "OPEX", "g": "Depreciation", "n": "Depreciation ~ Machines & Equipment", "c": "64200010", "may": 2180.12, "jun": 2180.12, "jul": 2180.12, "o": false},
  {"s": "OPEX", "g": "Depreciation", "n": "Depreciation ~ Vehicle Assets", "c": "64200020", "may": 9206.38, "jun": 8685.54, "jul": 8685.54, "o": false},
  {"s": "OPEX", "g": "Depreciation", "n": "Depreciation ~Offices", "c": "64200050", "may": 1872.72, "jun": 1872.72, "jul": 1872.72, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Bank Charges", "c": "71000000", "may": 950.35, "jun": 3098.76, "jul": 1477.35, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Cleaning expenses", "c": "65100050", "may": 200.0, "jun": 0.0, "jul": 4600.0, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Consumable expenses", "c": "65100060", "may": 0.0, "jun": 0.0, "jul": 334.0, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Doubtful Debts Expense", "c": "65100100", "may": 67662.93, "jun": 422093.49, "jul": 37473.12, "o": true, "note": "Doubtful debt provision — non-cash"},
  {"s": "OPEX", "g": "General & Administration", "n": "Electricity expenses", "c": "65100150", "may": 4821.74, "jun": 5187.38, "jul": 6143.42, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Entertainment expenses", "c": "65100080", "may": 0.0, "jun": 10000.0, "jul": 1140.14, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Fines and penalties ~ Others", "c": "70900000", "may": 750.0, "jun": 71952.0, "jul": 825.0, "o": true, "note": "Fines & penalties — non-recurring"},
  {"s": "OPEX", "g": "General & Administration", "n": "General expenses", "c": "65100140", "may": 0.0, "jun": 6810.12, "jul": 2951.0, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Government Fees", "c": "65100111", "may": 0.0, "jun": 2564.0, "jul": 1532.0, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Interest Expenses on lease liabilities", "c": "66000001", "may": 573.0, "jun": 573.0, "jul": 639.0, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "IT and communication expenses", "c": "65100040", "may": 0.0, "jun": 544.25, "jul": 552.08, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Management Fees", "c": "63003000", "may": 322319.29, "jun": 310591.77, "jul": 0.0, "o": true, "note": "Intercompany management fee — periodic billing cycle"},
  {"s": "OPEX", "g": "General & Administration", "n": "Postage and Courier expenses", "c": "65100020", "may": 358.0, "jun": 558.48, "jul": 472.5, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Printing and Stationery expenses", "c": "65100070", "may": 637.0, "jun": 3094.0, "jul": 3084.0, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Ramadan party expenses", "c": "65100090", "may": 3000.0, "jun": 3000.0, "jul": 0.0, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Subscription and Membership fees", "c": "65100110", "may": 14940.28, "jun": 21665.16, "jul": 0.0, "o": false},
  {"s": "OPEX", "g": "General & Administration", "n": "Telephone, Telex, Internet and Fax expenses", "c": "65100030", "may": 2611.87, "jun": 0.0, "jul": 3401.0, "o": false},
  {"s": "OPEX", "g": "Outsourcing", "n": "Casual labour ~ Salary and Related Employee costs", "c": "61700003", "may": 158779.35, "jun": 128547.63, "jul": 273912.48, "o": false},
  {"s": "OPEX", "g": "Outsourcing", "n": "Services providers ~ Casual labor - Other", "c": "61700000", "may": 2250.0, "jun": 0.0, "jul": 8424.31, "o": false},
  {"s": "OPEX", "g": "Professional Fees", "n": "Audit fees", "c": "65100160", "may": 6807.67, "jun": 6807.67, "jul": 0.0, "o": false},
  {"s": "OPEX", "g": "Professional Fees", "n": "Legal and professional expenses", "c": "65104020", "may": 21394.0, "jun": 3665.0, "jul": 2765.0, "o": false},
  {"s": "OPEX", "g": "Professional Fees", "n": "Technical consultancy expenses", "c": "65104010", "may": 10000.0, "jun": 10000.0, "jul": 11520.0, "o": false},
  {"s": "OPEX", "g": "Rent", "n": "Office rent", "c": "65100210", "may": 4075.75, "jun": 12075.75, "jul": 2608.75, "o": false},
  {"s": "OPEX", "g": "Rent", "n": "Space Rental – Vending Machine", "c": "65100211", "may": 1000.0, "jun": 500.0, "jul": 500.0, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Bonus", "c": "61100100", "may": 0.0, "jun": 9500.0, "jul": 0.0, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Employees lunch expenses", "c": "61100230", "may": 2568.0, "jun": 5080.98, "jul": 1661.0, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "End of Services Benefits / Indemnity", "c": "61100130", "may": 5190.67, "jun": 5248.57, "jul": 6044.7, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "GOSI establishment charges (Employer contribution)", "c": "61100060", "may": 9374.77, "jun": 8816.65, "jul": 8551.55, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Housing allowance", "c": "61000020", "may": 20594.2, "jun": 20726.67, "jul": 22133.71, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Leave fare expenses", "c": "61100050", "may": 1683.34, "jun": 1033.33, "jul": 1937.49, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Medical insurance expenses", "c": "61100000", "may": 11069.32, "jun": 16809.7, "jul": -1902.84, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Notice pay", "c": "61100040", "may": 0.0, "jun": 362905.0, "jul": 0.0, "o": true, "note": "Notice pay on termination (G&A)"},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Other Allowance", "c": "61000100", "may": 5000.0, "jun": 5000.0, "jul": 5800.0, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Ramadan bonus", "c": "61100090", "may": 2041.66, "jun": 2041.66, "jul": 3166.65, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Salaries and wages ~ Basic", "c": "61000000", "may": 82374.77, "jun": 82904.67, "jul": 96532.83, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "School Fees", "c": "61400010", "may": 0.0, "jun": 0.0, "jul": 17213.3, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Telephone allowance", "c": "61000050", "may": 2854.84, "jun": 2800.0, "jul": 2500.0, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Transportation allowance", "c": "61000010", "may": 7497.35, "jun": 7561.33, "jul": 8100.58, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Vacation Pay", "c": "61100110", "may": 10381.33, "jun": 10497.14, "jul": 11889.39, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Visas & iqamas costs", "c": "61100070", "may": 0.0, "jun": 14073.66, "jul": 64419.0, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "End of Services Benefits / Indemnity - S&D", "c": "62000110", "may": 8013.54, "jun": 6003.88, "jul": 5483.21, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "GOSI establishment charges (Employer contribution) - S&D", "c": "62000070", "may": 5729.63, "jun": 5729.63, "jul": 4579.96, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Housing allowance - S&D", "c": "62000030", "may": 35883.88, "jun": 26759.16, "jul": 23578.39, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Leave fare expenses - S&D", "c": "62000060", "may": 3058.34, "jun": 2325.01, "jul": 2728.48, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Medical insurance expenses S&D", "c": "62000160", "may": 6405.89, "jun": 6558.96, "jul": -421.0, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Notice pay - S&D", "c": "61100030", "may": 0.0, "jun": 96058.0, "jul": 63700.0, "o": true, "note": "Notice pay on termination (S&D)"},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Other Allowance - S&D", "c": "62000040", "may": 500.0, "jun": 116.67, "jul": 0.0, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Ramadan bonus - S&D", "c": "62000090", "may": 7249.92, "jun": 2749.99, "jul": 2541.66, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Salaries and wages ~ Basic - S&D", "c": "62000010", "may": 140351.61, "jun": 107232.16, "jul": 94513.55, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Telephone allowance - S&D", "c": "62000050", "may": 3247.42, "jun": 2766.67, "jul": 2529.03, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Transportation allowance - S&D", "c": "62000020", "may": 12974.19, "jun": 9796.66, "jul": 8758.06, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Vacation Pay - S&D", "c": "62000100", "may": 15106.46, "jun": 12263.01, "jul": 10348.45, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Visas & iqamas costs - S&D", "c": "62000080", "may": 1000.0, "jun": 13350.0, "jul": 15402.14, "o": false},
  {"s": "OPEX", "g": "Travel", "n": "Travelling Expenses Business ~ Miscellaneous", "c": "61205000", "may": 0.0, "jun": 0.0, "jul": 25162.04, "o": false},
  {"s": "OPEX", "g": "Travel", "n": "Travelling Expenses ~ Hotel inside coun", "c": "61201020", "may": 7002.94, "jun": 15244.76, "jul": 5106.38, "o": false},
  {"s": "OPEX", "g": "Travel", "n": "Travelling Expenses ~ Taxi Expenses inside country", "c": "61201050", "may": 557.91, "jun": 826.44, "jul": 0.0, "o": false},
  {"s": "OPEX", "g": "Travel", "n": "Travelling Expenses ~ Tickets outside c", "c": "61202000", "may": 5000.0, "jun": 9990.0, "jul": 3550.0, "o": false},
  {"s": "OPEX", "g": "Travel", "n": "Travelling Expenses_Tickets inside coun", "c": "61201000", "may": 1780.0, "jun": 11188.2, "jul": 16153.45, "o": false},
  {"s": "OPEX", "g": "Travel", "n": "Travelling/per diem allowance inside country", "c": "61201010", "may": 3920.0, "jun": 1300.0, "jul": 0.0, "o": false},
  {"s": "OPEX", "g": "Variable Selling", "n": "Allowance for near expiry inventory", "c": "65900030", "may": 42250.0, "jun": 321891.0, "jul": 0.0, "o": true, "note": "Near-expiry inventory allowance — non-cash"},
  {"s": "OPEX", "g": "Variable Selling", "n": "Car rental", "c": "63001500", "may": 63885.0, "jun": 37665.75, "jul": 65058.19, "o": false},
  {"s": "OPEX", "g": "Variable Selling", "n": "Fidelity Insurance", "c": "60000033", "may": 1245.83, "jun": 1432.71, "jul": 1432.71, "o": false},
  {"s": "OPEX", "g": "Variable Selling", "n": "Insurance-Marine Cargo Open Cover", "c": "60000032", "may": 4270.83, "jun": 4270.83, "jul": 4270.83, "o": false},
  {"s": "OPEX", "g": "Variable Selling", "n": "Merchandising Expenses", "c": "61502304", "may": 63840.0, "jun": 203905.0, "jul": 44092.0, "o": false},
  {"s": "OPEX", "g": "Variable Selling", "n": "Other Operating Expenses", "c": "66000000", "may": 2307.33, "jun": 1075.0, "jul": -2902.0, "o": false},
  {"s": "OPEX", "g": "Variable Selling", "n": "Outward freight/transportation (local)", "c": "65400000", "may": 37559.29, "jun": 16035.05, "jul": 24976.0, "o": false},
  {"s": "OPEX", "g": "Variable Selling", "n": "Product Listing & Vendor Registration Fees", "c": "65410000", "may": 0.0, "jun": 53967.77, "jul": -53967.77, "o": true, "note": "Listing fees booked June, reversed July"},
  {"s": "OPEX", "g": "Variable Selling", "n": "Rebate Expense", "c": "61502301", "may": 159671.11, "jun": 159471.66, "jul": 143613.29, "o": false},
  {"s": "OPEX", "g": "Variable Selling", "n": "RTV", "c": "65900011", "may": 17234.51, "jun": 147687.34, "jul": 943.62, "o": true, "note": "RTV (return to vendor) — lumpy"},
  {"s": "OPEX", "g": "Variable Selling", "n": "Sales staffs Commission", "c": "61500000", "may": 60416.67, "jun": 40000.0, "jul": 50000.0, "o": false},
  {"s": "OPEX", "g": "Variable Selling", "n": "Samples from the Market", "c": "66000003", "may": 0.0, "jun": 483.0, "jul": 494.5, "o": false},
  {"s": "OPEX", "g": "Variable Selling", "n": "Supply Logistic Support", "c": "61502303", "may": 22379.17, "jun": 7762.43, "jul": 17164.75, "o": false},
  {"s": "OPEX", "g": "Variable Selling", "n": "Write-off ~ (Expiry/Damage) ~ Finished goods", "c": "65900010", "may": 123946.23, "jun": 91.58, "jul": 351.58, "o": false},
  {"s": "OPEX", "g": "Vehicles", "n": "Car parking fees", "c": "65102040", "may": 477.0, "jun": 632.5, "jul": 32.7, "o": false},
  {"s": "OPEX", "g": "Vehicles", "n": "Cars license fees", "c": "65102020", "may": 0.0, "jun": 0.0, "jul": 1606.0, "o": false},
  {"s": "OPEX", "g": "Vehicles", "n": "Vehicle Insurance", "c": "65102050", "may": 1238.25, "jun": 1009.47, "jul": 579.07, "o": false},
  {"s": "OPEX", "g": "Vehicles", "n": "Vehicles fuels expenses", "c": "65102000", "may": 15510.39, "jun": 15091.45, "jul": 16534.22, "o": false},
  {"s": "OPEX", "g": "Vehicles", "n": "Vehicles repair and maintenance expenses", "c": "65102010", "may": 16007.36, "jun": 8620.5, "jul": 3478.75, "o": false},
  {"s": "NOI", "g": "Non-Operating Income", "n": "Other Gains / Loss", "c": "66000600", "may": 0.0, "jun": 1068.84, "jul": 4347.83, "o": false},
  {"s": "NOE", "g": "Non-Operating Expense", "n": "Exchange Gain or Loss", "c": "72020000", "may": -13.73, "jun": -0.76, "jul": -20.23, "o": false},
  {"s": "NOE", "g": "Non-Operating Expense", "n": "Purchase - Packaging Materials", "c": "68001000", "may": 3400.0, "jun": 3850.0, "jul": 1300.0, "o": false},
  {"s": "NOE", "g": "Non-Operating Expense", "n": "Warehouse maintenance expenses", "c": "63000060", "may": 0.0, "jun": 100.0, "jul": 3619.57, "o": false},
  {"s": "NOE", "g": "Non-Operating Expense", "n": "Zakat Expense", "c": "75002000", "may": 0.0, "jun": 90000.0, "jul": 0.0, "o": true, "note": "Zakat charge — periodic, not monthly"},
  {"s": "OPEX", "g": "General & Administration", "n": "Withholding Tax (WHT)", "c": "AUD-01", "may": 5140.47, "jun": 0, "jul": 0, "o": false},
  {"s": "OPEX", "g": "Payroll — G&A", "n": "Recruitment expenses ~ Fees S&D", "c": "AUD-02", "may": 2787.09, "jun": 0, "jul": 0, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Bonus - S&D", "c": "AUD-03", "may": 10000.0, "jun": 0, "jul": 0, "o": false},
  {"s": "OPEX", "g": "Payroll — Sales & Distribution", "n": "Overtime S&D", "c": "AUD-04", "may": 796.25, "jun": 0, "jul": 0, "o": false},
];

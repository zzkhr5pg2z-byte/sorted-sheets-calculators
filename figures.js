/* Built from site/data/figures.json by site/build.py: change that file, not this one. */
window.SS_FIGURES = {
 "checked": "2026-11-13",
 "checked_label": "November 2026",
 "tax_year": "2026/27",
 "care": {
  "nations": {
   "England": {
    "upper": 23250,
    "lower": 14250,
    "nhs_nursing": 267.68,
    "free_personal_care": 0,
    "sources": [
     "lac_2026",
     "nhs_fnc"
    ]
   },
   "Wales": {
    "upper": 50000,
    "lower": 50000,
    "nhs_nursing": 0,
    "free_personal_care": 0,
    "sources": [
     "wales_charging"
    ]
   },
   "Scotland": {
    "upper": 36750,
    "lower": 22750,
    "nhs_nursing": 117.1,
    "free_personal_care": 260.3,
    "sources": [
     "ssi_2026_42",
     "ssi_2026_157"
    ]
   },
   "Northern Ireland": {
    "upper": 23250,
    "lower": 14250,
    "nhs_nursing": 0,
    "free_personal_care": 0,
    "sources": [
     "nidirect_fees"
    ]
   }
  },
  "tariff_step": 250,
  "sale_costs": 0.1,
  "sale_costs_source": "sale_costs",
  "property_disregard_weeks": 12
 },
 "iht": {
  "nil_rate_band": 325000,
  "annual_exemption": 3000,
  "small_gift": 250,
  "wedding_child": 5000,
  "wedding_grandchild": 2500,
  "wedding_other": 1000,
  "rate": 0.4,
  "taper": [
   {
    "from_years": 3,
    "rate": 0.32
   },
   {
    "from_years": 4,
    "rate": 0.24
   },
   {
    "from_years": 5,
    "rate": 0.16
   },
   {
    "from_years": 6,
    "rate": 0.08
   }
  ],
  "sources": [
   "iht_gifts"
  ]
 },
 "gift_aid": {
  "per_pound": 0.25,
  "tax_cover_multiple": 4,
  "sources": [
   "gift_aid"
  ]
 },
 "mileage": {
  "car_first": 0.55,
  "car_after": 0.25,
  "car_threshold": 10000,
  "motorcycle": 0.24,
  "sources": [
   "simplified_vehicles",
   "amap_rates"
  ]
 },
 "self_assessment": {
  "tax_year": "2025/26",
  "tax_year_long": "6 April 2025 to 5 April 2026",
  "next_tax_year": "2026/27",
  "due_january": "31 January 2027",
  "due_july": "31 July 2027",
  "checked": "2026-11-19",
  "checked_label": "19 November 2026",
  "personal_allowance": 12570,
  "pa_income_limit": 100000,
  "pa_taper": 0.5,
  "pa_zero_at": 125140,
  "ruk_bands": [
   {
    "name": "Basic rate",
    "upto": 37700,
    "rate": 0.2
   },
   {
    "name": "Higher rate",
    "upto": 125140,
    "rate": 0.4
   },
   {
    "name": "Additional rate",
    "upto": null,
    "rate": 0.45
   }
  ],
  "scotland_bands": [
   {
    "name": "Starter rate",
    "upto": 2827,
    "rate": 0.19
   },
   {
    "name": "Basic rate",
    "upto": 14921,
    "rate": 0.2
   },
   {
    "name": "Intermediate rate",
    "upto": 31092,
    "rate": 0.21
   },
   {
    "name": "Higher rate",
    "upto": 62430,
    "rate": 0.42
   },
   {
    "name": "Advanced rate",
    "upto": 125140,
    "rate": 0.45
   },
   {
    "name": "Top rate",
    "upto": null,
    "rate": 0.48
   }
  ],
  "class4_lower": 12570,
  "class4_upper": 50270,
  "class4_main": 0.06,
  "class4_upper_rate": 0.02,
  "class2_threshold": 6845,
  "class2_week": 3.5,
  "trading_allowance": 1000,
  "poa_min": 1000,
  "poa_paye_share": 0.8,
  "poa_share": 0.5,
  "sources": [
   "sa_income_tax",
   "sa_pa_taper",
   "sa_ni",
   "sa_ni_stop",
   "sa_trading_allowance",
   "sa_poa",
   "sa_deadline",
   "sa_refund"
  ]
 },
 "sources": {
  "lac_2026": {
   "title": "Social care: charging for care and support 2026 to 2027 (local authority circular)",
   "url": "https://www.gov.uk/government/publications/social-care-charging-for-local-authorities-2026-to-2027/social-care-charging-for-care-and-support-2026-to-2027-local-authority-circular",
   "site": "gov.uk",
   "says": "England capital limits stay at £23,250 and £14,250 for 2026 to 2027; £1 a week for every £250 between them"
  },
  "nhs_fnc": {
   "title": "NHS-funded nursing care",
   "url": "https://www.nhs.uk/social-care-and-support/money-work-and-benefits/nhs-funded-nursing-care/",
   "site": "nhs.uk",
   "says": "From 1 April 2026 the standard rate is £267.68 a week (England)"
  },
  "wales_charging": {
   "title": "Charging for social care",
   "url": "https://www.gov.wales/charging-social-care",
   "site": "gov.wales",
   "says": "Capital over £50,000: may pay the full cost of residential care"
  },
  "ssi_2026_42": {
   "title": "The National Assistance (Assessment of Resources) Amendment (Scotland) Regulations 2026",
   "url": "https://www.legislation.gov.uk/ssi/2026/42/made",
   "site": "legislation.gov.uk",
   "says": "Scotland: upper capital limit £36,750 and lower £22,750 from 6 April 2026"
  },
  "ssi_2026_157": {
   "title": "The Community Care (Personal Care and Nursing Care) (Scotland) Amendment Regulations 2026",
   "url": "https://www.legislation.gov.uk/ssi/2026/157/made",
   "site": "legislation.gov.uk",
   "says": "Scotland: free personal care £260.30 and nursing care £117.10 a week from 1 April 2026"
  },
  "nidirect_fees": {
   "title": "Paying your care home fees",
   "url": "https://www.nidirect.gov.uk/articles/paying-your-care-home-fees",
   "site": "nidirect.gov.uk",
   "says": "Northern Ireland: over £23,250 pays in full; £1 a week for every £250 between £14,250 and £23,250; home counts 12 weeks after a permanent move"
  },
  "sale_costs": {
   "title": "The Care and Support (Charging and Assessment of Resources) Regulations 2014, regulation 20",
   "url": "https://www.legislation.gov.uk/uksi/2014/2672/regulation/20",
   "site": "legislation.gov.uk",
   "says": "Capital is valued less 10% where there would be expenses of sale, and less any debt secured on it"
  },
  "iht_gifts": {
   "title": "How Inheritance Tax works: thresholds, rules and allowances",
   "url": "https://www.gov.uk/inheritance-tax/gifts",
   "site": "gov.uk",
   "says": "£325,000 threshold, 40% rate, £3,000 annual exemption (one year carry forward), £250 small gifts, wedding gifts £5,000 / £2,500 / £1,000, taper 32% / 24% / 16% / 8%"
  },
  "gift_aid": {
   "title": "Tax relief when you donate to a charity: Gift Aid",
   "url": "https://www.gov.uk/donating-to-charity/gift-aid",
   "site": "gov.uk",
   "says": "Charities can claim an extra 25p for every £1; donations qualify if not more than 4 times the tax you paid that tax year"
  },
  "simplified_vehicles": {
   "title": "Simplified expenses if you're self-employed: vehicles",
   "url": "https://www.gov.uk/simpler-income-tax-simplified-expenses/vehicles-",
   "site": "gov.uk",
   "says": "2026 to 2027: cars and goods vehicles 55p for the first 10,000 miles (45p before 6 April 2026), then 25p; motorcycles 24p"
  },
  "sa_income_tax": {
   "title": "Income Tax rates and allowances for current and previous tax years",
   "url": "https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past",
   "site": "gov.uk",
   "says": "2025 to 2026: Personal Allowance £12,570, income limit £100,000; England, Wales and Northern Ireland 20% up to £37,700, 40% to £125,140, 45% over; Scotland 19% up to £2,827, 20% to £14,921, 21% to £31,092, 42% to £62,430, 45% to £125,140, 48% over (income after allowances)"
  },
  "sa_pa_taper": {
   "title": "Income Tax rates and Personal Allowances",
   "url": "https://www.gov.uk/income-tax-rates",
   "site": "gov.uk",
   "says": "The Personal Allowance goes down by £1 for every £2 of adjusted net income over £100,000, so it's zero at £125,140 or above"
  },
  "sa_ni": {
   "title": "Rates and allowances: National Insurance contributions",
   "url": "https://www.gov.uk/government/publications/rates-and-allowances-national-insurance-contributions/rates-and-allowances-national-insurance-contributions",
   "site": "gov.uk",
   "says": "2025 to 2026: Class 4 6% on profits from £12,570 to £50,270 and 2% above; Class 2 Small Profits Threshold £6,845, £3.50 a week"
  },
  "sa_ni_stop": {
   "title": "National Insurance: introduction",
   "url": "https://www.gov.uk/national-insurance",
   "site": "gov.uk",
   "says": "If you're self-employed you stop paying Class 4 from 6 April (the start of the tax year) after you reach State Pension age"
  },
  "sa_trading_allowance": {
   "title": "Tax-free allowances on property and trading income",
   "url": "https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income",
   "site": "gov.uk",
   "says": "Up to £1,000 a tax year of trading income, used instead of deducting expenses, and never more than the income"
  },
  "sa_poa": {
   "title": "Understand your Self Assessment tax bill: payments on account",
   "url": "https://www.gov.uk/understand-self-assessment-bill/payments-on-account",
   "site": "gov.uk",
   "says": "Two payments, each half of last year's tax (including Class 4), due by 31 January and 31 July; not needed if that tax was under £1,000 or more than 80% of it was paid outside Self Assessment"
  },
  "sa_deadline": {
   "title": "Self Assessment tax returns: deadlines",
   "url": "https://www.gov.uk/self-assessment-tax-returns/deadlines",
   "site": "gov.uk",
   "says": "For 6 April 2025 to 5 April 2026, pay the tax you owe by 11:59pm on 31 January 2027"
  },
  "sa_refund": {
   "title": "Self Assessment tax returns: claiming a tax refund",
   "url": "https://www.gov.uk/self-assessment-tax-returns/claiming-a-tax-refund",
   "site": "gov.uk",
   "says": "You may not get a refund if you have tax due in the next 45 days (for example a payment on account): it's taken off the tax you owe instead"
  },
  "amap_rates": {
   "title": "Travel: mileage and fuel rates and allowances",
   "url": "https://www.gov.uk/government/publications/rates-and-allowances-travel-mileage-and-fuel-allowances/travel-mileage-and-fuel-rates-and-allowances",
   "site": "gov.uk",
   "says": "Approved mileage rates from 2026 to 2027: cars and vans 55p then 25p; motor cycles 24p; bicycles 20p"
  }
 }
};

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
  "amap_rates": {
   "title": "Travel: mileage and fuel rates and allowances",
   "url": "https://www.gov.uk/government/publications/rates-and-allowances-travel-mileage-and-fuel-allowances/travel-mileage-and-fuel-rates-and-allowances",
   "site": "gov.uk",
   "says": "Approved mileage rates from 2026 to 2027: cars and vans 55p then 25p; motor cycles 24p; bicycles 20p"
  }
 }
};

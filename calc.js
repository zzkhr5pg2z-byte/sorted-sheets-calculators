/* Sorted Sheets Calculators.
   Part 1: the sums. Pure functions, no page needed, so the tests can run them under node.
           Each one follows the formulas in the matching Sorted Sheets spreadsheet.
   Part 2: the page wiring (browser only): reads the form, fills in the results.
   Figures (limits, rates) come from figures.js, which is built from site/data/figures.json. */
(function (root) {
  "use strict";

  /* ------------------------------------------------------------------ helpers */
  var DAY = 86400000;

  function norm(x) { return Number(x.toPrecision(15)); }          // Excel works to 15 significant figures
  function round(x, d) {                                            // Excel ROUND: halves away from zero
    var p = Math.pow(10, d || 0);
    return (x < 0 ? -1 : 1) * Math.round(norm(Math.abs(x) * p)) / p;
  }
  function roundUp(x, d) {                                          // Excel ROUNDUP: away from zero
    var p = Math.pow(10, d || 0);
    return (x < 0 ? -1 : 1) * Math.ceil(norm(Math.abs(x) * p)) / p;
  }
  function mod(a, b) { return ((a % b) + b) % b; }                  // Excel MOD: sign of the divisor
  function days(y, m, d) { return Date.UTC(y, m - 1, d) / DAY; }    // whole days since 1 Jan 1970
  function ymd(n) {
    var t = new Date(n * DAY);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
  }
  function edate(n, months) {                                       // Excel EDATE
    var a = ymd(n), total = a.y * 12 + (a.m - 1) + months;
    var y = Math.floor(total / 12), m = mod(total, 12) + 1;
    var last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return days(y, m, Math.min(a.d, last));
  }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim());
    if (!m) return null;
    var n = days(+m[1], +m[2], +m[3]), c = ymd(n);
    return c.m === +m[2] && c.d === +m[3] ? n : null;
  }
  function isoDate(n) {
    var a = ymd(n);
    return a.y + "-" + String(a.m).padStart(2, "0") + "-" + String(a.d).padStart(2, "0");
  }
  function parseNum(s) {                                            // "£1,350.50" -> 1350.5; "" -> 0; junk -> NaN
    var t = String(s == null ? "" : s).replace(/[£,%\s]/g, "");
    if (t === "") return 0;
    return /^-?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : NaN;
  }
  function nperMonths(rate, payment, balance) {                     // ROUNDUP(NPER(rate,-payment,balance),0) or null
    if (!(balance > 0) || !(payment > 0)) return null;
    if (rate === 0) return roundUp(balance / payment, 0);
    if (payment <= balance * rate) return null;                     // Excel gives #NUM! / #DIV/0!
    return roundUp(Math.log(payment / (payment - balance * rate)) / Math.log(1 + rate), 0);
  }

  /* ------------------------------------------------------------------ 1. care home fees runway
     care_home_fees_runway.xlsx: Money!C8, E31, the Runway tab (120 months) and Lists!N2:N5. */
  function careRunway(o, F) {
    var C = F.care, nat = C.nations[o.nation] || C.nations.England;
    var UP = nat.upper, LO = nat.lower, step = C.tariff_step;
    var nhs = (o.homeType === "nursing" ? nat.nhs_nursing : 0) + nat.free_personal_care;
    var fee = o.fee > 0 ? o.fee : 0;
    var feePays = Math.max(0, fee - nhs);
    var weekly = feePays + o.costs - o.income;                         // shortfall per week now
    var homeCounts = Math.max(0, (o.homeValue || 0) * (1 - C.sale_costs) - (o.homeDebt || 0));
    var p = ymd(o.planFrom), start = days(p.y, p.m, 1);
    var offset = o.riseMonth ? mod(p.m - o.riseMonth, 12) : null;
    var rows = [], prev = 0, reach = -1, paidFirst = 0;
    for (var i = 0; i < 120; i++) {
      var B = edate(start, i), next = edate(B, 1);
      var rises = offset === null ? 0 : Math.floor((i + offset) / 12);
      var feeNow = feePays * Math.pow(1 + (o.rise || 0), rises);
      var E = i === 0 ? o.savings : prev, home = 0;
      if (o.homeFrom != null && (i === 0 ? o.homeFrom <= next - 1 : o.homeFrom >= B && o.homeFrom < next)) home = homeCounts;
      var tot = E + home;
      var G = fee > 0 ? (tot > UP ? "self" : tot > LO ? "helps" : "funded") : "";
      var D = G === "self" ? feeNow + o.costs - o.income : null;
      var H = G === "self" ? Math.max(0, Math.min(tot - UP, D * 52 / 12))
        : G === "helps" ? Math.min(tot - LO, roundUp((tot - LO) / step, 0) * 52 / 12) : 0;
      var I = tot - H, K = "";
      if (G === "self") {
        if (D > 0 && I <= UP + 0.005) K = "reaches";
        else if (home > 0) K = "home";
        else if (D > 0 && tot - UP <= D * 52 / 12 * 4) K = "ask";
        paidFirst += H;
      } else if (G) K = G;
      if (K === "reaches" && reach < 0) reach = i;
      rows.push({ month: B, feeWeek: feeNow, shortfallWeek: D, start: E, home: home, who: G, taken: H, end: I, note: K });
      prev = I;
    }
    var councilFrom = null, months = null, text = "";
    if (reach >= 0) {
      var r = rows[reach];
      councilFrom = r.month + round((r.start + r.home - UP) / r.shortfallWeek * 7, 0);
      months = round((councilFrom - o.planFrom) / 30.4375, 0);
      if (months < 1) text = "Under a month";
      else {
        var yr = Math.floor(months / 12), mo = mod(months, 12);
        text = ((yr > 0 ? yr + (yr === 1 ? " year " : " years ") : "") + (mo > 0 ? mo + (mo === 1 ? " month" : " months") : "")).trim();
      }
    }
    var headline = !(fee > 0) ? "Add the fee" : text !== "" ? text
      : rows[0].who !== "self" ? "Council help now" : weekly <= 0 ? "Not running down" : "Over 10 years";
    return {
      upper: UP, lower: LO, nhs: nhs, feePays: feePays, shortfallWeek: weekly, homeCounts: homeCounts,
      councilFrom: councilFrom, months: months, headline: headline,
      askBy: councilFrom === null ? null : Math.max(o.planFrom, councilFrom - 91),
      paidFirst: paidFirst, rows: rows
    };
  }

  /* ------------------------------------------------------------------ 2. inheritance tax gifts
     iht_gift_record.xlsx: Gifts columns I to W, the Allowances tab and the Summary tab.
     type: none | small | wedding_child | wedding_grandchild | wedding_other | spouse | charity | regular */
  function taxYear(n) { var a = ymd(n); return a.y - (n < days(a.y, 4, 6) ? 1 : 0); }
  function ihtGifts(gifts, asAt, F) {
    var T = F.iht;
    var g = gifts.map(function (x, i) {
      return { i: i, date: x.date, name: String(x.name || "").trim(), amount: x.amount, type: x.type || "none",
               active: x.date != null && x.amount > 0 };
    });
    var act = g.filter(function (x) { return x.active; });
    act.forEach(function (x) {
      x.taxYear = taxYear(x.date);
      x.key = x.name ? x.name.toLowerCase() : "#" + x.i;
    });
    var before = function (a, b) { return a.date < b.date || (a.date === b.date && a.i < b.i); };
    act.forEach(function (x) {
      var t = x.type, a = x.amount;
      if (t === "spouse" || t === "charity" || t === "regular") x.exempt = a;
      else if (t === "small") {
        var same = 0;
        act.forEach(function (y) { if (y.key === x.key && y.taxYear === x.taxYear) same += y.amount; });
        x.exempt = same <= T.small_gift ? a : 0;
      } else if (t === "wedding_child") x.exempt = Math.min(a, T.wedding_child);
      else if (t === "wedding_grandchild") x.exempt = Math.min(a, T.wedding_grandchild);
      else if (t === "wedding_other") x.exempt = Math.min(a, T.wedding_other);
      else x.exempt = 0;
      x.left = a - x.exempt;
    });
    // the £3,000 annual exemption, tax year by tax year, with one year's carry forward
    var need = {};
    act.forEach(function (x) { need[x.taxYear] = (need[x.taxYear] || 0) + x.left; });
    var available = function (y) { return T.annual_exemption + Math.max(0, T.annual_exemption - (need[y - 1] || 0)); };
    var years = {};
    act.forEach(function (x) {
      var earlier = 0;
      act.forEach(function (y) { if (y.taxYear === x.taxYear && before(y, x)) earlier += y.left; });
      x.annualUsed = Math.max(0, Math.min(x.left, available(x.taxYear) - earlier));
      x.counts = x.left - x.annualUsed;
      x.sevenYears = x.counts > 0 ? edate(x.date, 84) : null;
      x.inside = x.counts > 0 && x.date <= asAt && x.date > edate(asAt, -84);
      years[x.taxYear] = true;
    });
    var taper = function (yrs) {
      var rate = T.rate;
      T.taper.forEach(function (b) { if (yrs >= b.from_years) rate = b.rate; });
      return rate;
    };
    var out = { totalGiven: 0, exemptNow: 0, inside: 0, outside: 0, tax: 0, nextOut: null, nextOutAmount: 0, annualUsed: 0 };
    act.forEach(function (x) {
      if (x.counts <= 0) x.status = "Exempt";
      else if (x.date > asAt) x.status = "Future date";
      else if (asAt >= x.sevenYears) x.status = "Outside 7 years: no IHT";
      else x.status = "Inside 7 years (" + round((x.sevenYears - asAt) / 365.25, 1) + " yrs to go)";
      x.yearsToGo = x.inside ? round((x.sevenYears - asAt) / 365.25, 1) : null;
      if (x.inside) {
        var earlier = 0;
        act.forEach(function (y) { if (y.inside && before(y, x)) earlier += y.counts; });
        x.taxIfDied = Math.max(0, x.counts - Math.max(0, T.nil_rate_band - earlier)) * taper((asAt - x.date) / 365.25);
        out.inside += x.counts;
        out.tax += x.taxIfDied;
        if (out.nextOut === null || x.sevenYears < out.nextOut) out.nextOut = x.sevenYears;
      } else x.taxIfDied = null;
      out.totalGiven += x.amount;
      out.exemptNow += x.exempt + x.annualUsed;
      out.annualUsed += x.annualUsed;
      if (x.status.indexOf("Outside") === 0) out.outside += x.counts;
    });
    act.forEach(function (x) { if (x.inside && x.sevenYears === out.nextOut) out.nextOutAmount += x.counts; });
    out.nrbLeft = Math.max(0, T.nil_rate_band - out.inside);
    out.gifts = g;
    out.allowances = Object.keys(years).map(Number).sort().map(function (y) {
      var a = available(y), n = need[y] || 0;
      return { taxYear: y, label: y + "/" + String(y + 1).slice(-2), needed: n, available: a,
               used: Math.min(n, a), carriedIn: a - T.annual_exemption, leftOver: Math.max(0, T.annual_exemption - n) };
    });
    return out;
  }

  /* ------------------------------------------------------------------ 3. Christmas savings
     christmas_planner.xlsx: Lists!H2:H5 and the saving plan on Start Here (H34:H41). */
  function nextChristmas(today) {
    var y = ymd(today).y, x = days(y, 12, 25);
    return today <= x ? x : days(y + 1, 12, 25);
  }
  function christmas(o) {
    var stillToPay = Math.max(0, (o.budget || 0) - (o.spent || 0));
    var toFind = Math.max(0, stillToPay - (o.saved || 0));
    var daysTo = Math.max(0, o.deadline - o.asOf);
    var weeks = daysTo <= 0 ? 0 : Math.max(1, Math.floor(daysTo / 7));
    return {
      stillToPay: stillToPay, toFind: toFind, daysTo: daysTo, weeks: weeks,
      perWeek: weeks <= 0 ? 0 : roundUp(toFind / weeks, 2),
      perWeekWithCredit: weeks <= 0 ? 0 : roundUp((toFind + (o.credit || 0)) / weeks, 2),
      weekday: new Date(o.deadline * DAY).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" })
    };
  }

  /* ------------------------------------------------------------------ 4. debt payoff
     debt_payoff_planner_aesthetic.xlsx: snowball / avalanche order (columns I and J, ties by row order)
     and months at the minimum (column K, ROUNDUP(NPER)). The month-by-month plan with the extra
     payment rolled on goes further than the spreadsheet: same monthly interest (APR / 12). */
  function simulate(list, order, extra, rollover) {
    var bal = list.map(function (d) { return d.balance; }), paidOff = list.map(function () { return null; });
    var budget = list.reduce(function (s, d) { return s + d.min; }, 0) + extra;
    var interest = 0, paid = 0;
    for (var m = 1; m <= 1200; m++) {
      var left = rollover ? budget : Infinity, k;
      for (k = 0; k < list.length; k++) if (bal[k] > 0) { var add = bal[k] * list[k].apr / 12; bal[k] += add; interest += add; }
      for (k = 0; k < list.length; k++) if (bal[k] > 0) { var p = Math.min(list[k].min, bal[k], left); bal[k] -= p; left -= p; paid += p; }
      if (rollover) for (var j = 0; j < order.length && left > 1e-9; j++) {
        k = order[j];
        if (bal[k] > 0) { var q = Math.min(left, bal[k]); bal[k] -= q; left -= q; paid += q; }
      }
      var done = true;
      for (k = 0; k < list.length; k++) {
        if (bal[k] < 0.005) { if (paidOff[k] === null) paidOff[k] = m; bal[k] = 0; } else done = false;
      }
      if (done) return { months: m, interest: interest, paid: paid, paidOff: paidOff };
    }
    return { months: null, interest: null, paid: null, paidOff: paidOff };
  }
  function debtPlan(debts, extra) {
    var list = [];
    debts.forEach(function (d, i) {
      if (d.balance > 0) list.push({ row: i, name: String(d.name || "").trim() || "Debt " + (i + 1),
                                     balance: d.balance, apr: d.apr > 0 ? d.apr : 0, min: d.min > 0 ? d.min : 0 });
    });
    var idx = list.map(function (_, i) { return i; });
    var snow = idx.slice().sort(function (a, b) { return list[a].balance - list[b].balance || a - b; });
    var aval = idx.slice().sort(function (a, b) { return list[b].apr - list[a].apr || a - b; });
    list.forEach(function (d, i) {
      d.snowballRank = snow.indexOf(i) + 1;
      d.avalancheRank = aval.indexOf(i) + 1;
      d.minMonths = nperMonths(d.apr / 12, d.min, d.balance);
    });
    extra = extra > 0 ? extra : 0;
    return {
      debts: list, extra: extra,
      total: list.reduce(function (s, d) { return s + d.balance; }, 0),
      monthly: list.reduce(function (s, d) { return s + d.min; }, 0) + extra,
      snowball: list.length ? simulate(list, snow, extra, true) : null,
      avalanche: list.length ? simulate(list, aval, extra, true) : null,
      minimumOnly: list.length ? simulate(list, idx, 0, false) : null
    };
  }

  /* ------------------------------------------------------------------ 5. Gift Aid
     fundraising_gift_aid.xlsx: Donations!K = amount x Gift Aid per £1, only with a declaration. */
  function giftAid(o, F) {
    var G = F.gift_aid, amount = o.amount > 0 ? o.amount : 0;
    var extra = o.eligible ? amount * G.per_pound : 0;
    return { amount: amount, giftAid: extra, total: amount + extra, taxNeeded: amount / G.tax_cover_multiple };
  }

  /* ------------------------------------------------------------------ 6. business mileage
     sole_trader_bookkeeping.xlsx: Mileage!H (cars and vans split at 10,000 miles a tax year). */
  function mileage(o, F) {
    var M = F.mileage, miles = o.miles > 0 ? o.miles : 0, earlier = o.earlier > 0 ? o.earlier : 0;
    if (o.vehicle === "motorcycle") return { first: miles, after: 0, claim: miles * M.motorcycle };
    var first = Math.min(miles, Math.max(0, M.car_threshold - earlier));
    return { first: first, after: miles - first, claim: first * M.car_first + (miles - first) * M.car_after };
  }

  /* ------------------------------------------------------------------ 7. Self Assessment 2025/26
     self_assessment_2025_26.xlsx, Tax Estimate tab: F25-F36 (expenses or the trading allowance), F49-F59 (Income Tax
     by band), F62-F65 (Class 4 and Class 2), F68-F77 (the bill, balancing payment and payments on account).
     o: where, method ("best", "expenses", "allowance"), income (all business income), expenses (all allowable expenses,
     flat rates included), job and paye (P60 pay and the tax taken off it), paidJan and paidJul (payments on account
     already made for 2025/26), weeks (voluntary Class 2), exempt (from Class 4). */
  function selfAssessment(o, F) {
    var S = F.self_assessment;
    var pos = function (x) { return x > 0 ? x : 0; };
    var income = pos(o.income), expenses = pos(o.expenses), job = pos(o.job), paye = pos(o.paye);
    var profitExpenses = income - expenses;                                          // F25
    var allowance = Math.min(S.trading_allowance, income);                           // F26
    var profitAllowance = income - allowance;                                        // F27
    var best = income <= 0 ? "expenses" : (profitAllowance < profitExpenses ? "allowance" : "expenses");   // F28
    var method = o.method === "expenses" || o.method === "allowance" ? o.method : best;                 // F30
    var ta = method === "allowance";
    var profit = ta ? profitAllowance : Math.max(0, profitExpenses);                 // F36 (F33)
    var loss = ta ? 0 : Math.max(0, -profitExpenses);                                // F34
    var totalIncome = profit + job;                                                  // F49
    var personalAllowance = Math.max(0, S.personal_allowance - Math.max(0, totalIncome - S.pa_income_limit) * S.pa_taper);  // F50
    var taxable = Math.max(0, totalIncome - personalAllowance);                      // F51
    var scotland = o.where === "Scotland";
    var lower = 0, incomeTax = 0;
    var bands = (scotland ? S.scotland_bands : S.ruk_bands).map(function (b) {       // rows 53-58
      var inBand = Math.max(0, (b.upto === null ? taxable : Math.min(taxable, b.upto)) - lower);
      var tax = inBand * b.rate;
      lower = b.upto === null ? lower : b.upto;
      incomeTax += tax;
      return { name: b.name, rate: b.rate, upto: b.upto, inBand: inBand, tax: tax };
    });
    var class4Main = o.exempt ? 0 : Math.max(0, Math.min(profit, S.class4_upper) - S.class4_lower) * S.class4_main;  // F62
    var class4Upper = o.exempt ? 0 : Math.max(0, profit - S.class4_upper) * S.class4_upper_rate;                      // F63
    var class4 = class4Main + class4Upper;                                           // F64
    var class2Paid = profit >= S.class2_threshold;
    var class2 = class2Paid ? 0 : pos(o.weeks) * S.class2_week;                      // F65
    var taxAndClass4 = incomeTax + class4;                                           // F68
    var bill = taxAndClass4 - paye + class2;                                         // F71
    var paidOnAccount = pos(o.paidJan) + pos(o.paidJul);
    var balancing = bill - paidOnAccount;                                            // F73
    var owed = taxAndClass4 - paye;                                                  // F68 + F69
    var poaReason = owed < S.poa_min ? "under" : paye > S.poa_paye_share * taxAndClass4 ? "paye" : "yes";   // F74, G74
    var poaNeeded = poaReason === "yes";
    var poa1 = poaNeeded ? round(owed * S.poa_share, 2) : 0;                         // F75
    return {
      income: income, expenses: expenses, profitExpenses: profitExpenses, allowance: allowance,
      profitAllowance: profitAllowance, best: best, method: method, profit: profit, loss: loss, job: job, paye: paye,
      totalIncome: totalIncome, personalAllowance: personalAllowance, taxable: taxable, scotland: scotland,
      bands: bands, incomeTax: incomeTax, class4Main: class4Main, class4Upper: class4Upper, class4: class4,
      class2: class2, class2Paid: class2Paid, taxAndClass4: taxAndClass4, bill: bill, paidOnAccount: paidOnAccount,
      balancing: balancing, poaNeeded: poaNeeded, poaReason: poaReason, poa1: poa1,
      dueJanuary: Math.max(0, balancing + poa1), poa2: poa1                          // F76, F77
    };
  }

  /* ------------------------------------------------------------------ 8. 50/30/20 budget
     budget_50_30_20.xlsx: C8:C10 the targets (take-home pay B4 x 50%, 30%, 20%), D8:D10 what's spent in each part
     (SUMIF of the spending list), E8:E10 "On track", "Over by £x" (needs and wants: over the target) or
     "Short by £x" (savings: under it), D11 the total spent and D12 what's left over. The sheet takes monthly pay,
     so yearly pay is divided by 12 first.
     o: pay, period ("month" or "year"), needs, wants, savings (what's really spent or put by in a month). */
  var SPLIT = [{ key: "needs", share: 0.5 }, { key: "wants", share: 0.3 }, { key: "savings", share: 0.2 }];
  function pounds(x) {                                              // Excel TEXT(x, "£#,##0.00")
    return "£" + round(x, 2).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function budget503020(o) {
    var pos = function (x) { return x > 0 ? x : 0; };
    var monthly = o.period === "year" ? pos(o.pay) / 12 : pos(o.pay);
    var spent = 0;
    var parts = SPLIT.map(function (s) {
      var target = monthly * s.share, actual = pos(o[s.key]), saving = s.key === "savings";
      var onTrack = saving ? actual >= target : actual <= target;
      spent += actual;
      return { key: s.key, share: s.share, target: target, spent: actual, onTrack: onTrack,
               gap: onTrack ? 0 : Math.abs(actual - target),
               status: onTrack ? "On track" : (saving ? "Short by " : "Over by ") + pounds(Math.abs(actual - target)) };
    });
    return { monthly: monthly, parts: parts, spent: spent, left: monthly - spent };
  }

  var Calc = {
    careRunway: careRunway, ihtGifts: ihtGifts, christmas: christmas, nextChristmas: nextChristmas,
    debtPlan: debtPlan, giftAid: giftAid, mileage: mileage, selfAssessment: selfAssessment, taxYear: taxYear,
    budget503020: budget503020, split503020: SPLIT,
    util: { round: round, roundUp: roundUp, days: days, ymd: ymd, edate: edate, parseDate: parseDate,
            isoDate: isoDate, parseNum: parseNum, nperMonths: nperMonths, pounds: pounds }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Calc;
  root.SSCalc = Calc;
  if (typeof document === "undefined") return;

  /* ================================================================== part 2: the pages */
  var FIG = root.SS_FIGURES;
  var gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
  var gbp0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
  function money(x) { return gbp.format(Math.abs(x) < 0.005 ? 0 : x); }
  function money0(x) { return gbp0.format(x); }
  function longDate(n) { return new Date(n * DAY).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); }
  function monthYear(n) { return new Date(n * DAY).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }); }
  function shortMonth(n) { return new Date(n * DAY).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }); }
  function todayDays() { var t = new Date(); return days(t.getFullYear(), t.getMonth() + 1, t.getDate()); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function monthsText(n) {
    var y = Math.floor(n / 12), m = n % 12;
    return [y ? plural(y, "year", "years") : "", m ? plural(m, "month", "months") : ""].join(" ").trim() || "0 months";
  }
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }
  function out(scope, key, text) {
    scope.querySelectorAll('[data-out="' + key + '"]').forEach(function (e) { e.textContent = text; });
  }
  function show(scope, key, on) {
    scope.querySelectorAll('[data-show="' + key + '"]').forEach(function (e) { e.hidden = !on; });
  }
  function readNum(input) {                     // a number from a text box; flags anything it can't read
    var v = parseNum(input.value), bad = isNaN(v) || v < 0;
    input.setAttribute("aria-invalid", bad ? "true" : "false");
    return bad ? 0 : v;
  }
  function field(form, name) { return form.elements.namedItem(name); }
  function num(form, name) { return readNum(field(form, name)); }
  function fillTable(tbody, rows) {
    tbody.textContent = "";
    rows.forEach(function (cells) {
      var tr = el("tr");
      cells.forEach(function (c, i) { tr.appendChild(el(i === 0 ? "th" : "td", i === 0 ? { scope: "row" } : {}, c)); });
      tbody.appendChild(tr);
    });
  }

  /* repeating rows (debts, gifts): built from a <template>, numbered, with add and remove */
  function rowList(form, name, max, fill) {
    var box = form.querySelector('[data-rows="' + name + '"]'), tpl = document.getElementById(name + "-row");
    var addBtn = form.querySelector('[data-add="' + name + '"]');
    function renumber() {
      var rows = box.querySelectorAll("[data-row]");
      rows.forEach(function (r, i) {
        var n = i + 1;
        r.querySelector("[data-num]").textContent = n;
        r.querySelectorAll("[data-f]").forEach(function (inp) {
          var id = name + "-" + n + "-" + inp.getAttribute("data-f");
          var lab = r.querySelector('label[data-for="' + inp.getAttribute("data-f") + '"]');
          inp.id = id; if (lab) lab.htmlFor = id;
        });
        r.querySelector("[data-remove]").setAttribute("aria-label", "Remove row " + n);
      });
      addBtn.hidden = rows.length >= max;
    }
    function add(values) {
      var r = tpl.content.firstElementChild.cloneNode(true);
      Object.keys(values || {}).forEach(function (k) { var f = r.querySelector('[data-f="' + k + '"]'); if (f) f.value = values[k]; });
      r.querySelector("[data-remove]").addEventListener("click", function () {
        r.remove(); renumber(); fill();
        var first = box.querySelector("[data-f]"); (first || addBtn).focus();
      });
      box.appendChild(r);
      renumber();
      return r;
    }
    addBtn.addEventListener("click", function () { var r = add(); fill(); r.querySelector("[data-f]").focus(); });
    return { add: add, rows: function () { return Array.prototype.slice.call(box.querySelectorAll("[data-row]")); } };
  }

  /* ---- care home fees */
  function careUI(form) {
    var res = document.querySelector('[data-results="care"]');
    var tbody = res.querySelector("tbody");
    var monthSel = field(form, "riseMonth");
    function fill() {
      var homeFrom = field(form, "homeFrom").value ? parseDate(field(form, "homeFrom").value) : null;
      var o = {
        nation: field(form, "nation").value, homeType: field(form, "homeType").value,
        fee: num(form, "fee"), income: num(form, "income"), costs: num(form, "costs"), savings: num(form, "savings"),
        rise: num(form, "rise") / 100, riseMonth: +monthSel.value || null, planFrom: todayDays(),
        homeValue: num(form, "homeValue"), homeDebt: num(form, "homeDebt"), homeFrom: homeFrom
      };
      var r = careRunway(o, FIG);
      out(res, "headline", r.headline);
      out(res, "councilFrom", r.councilFrom === null ? "-" : longDate(r.councilFrom));
      out(res, "askBy", r.askBy === null ? "-" : longDate(r.askBy));
      out(res, "nhs", money(r.nhs));
      out(res, "feePays", money(r.feePays));
      out(res, "shortfall", money(r.shortfallWeek));
      out(res, "paidFirst", money(r.paidFirst));
      out(res, "upper", money0(r.upper));
      out(res, "lower", money0(r.lower));
      out(res, "homeCounts", money(r.homeCounts));
      var sentence;
      if (r.headline === "Add the fee") sentence = "Type the weekly care home fee to see how long the savings last.";
      else if (r.councilFrom !== null) sentence = "Savings should reach the " + money0(r.upper) + " upper limit around " +
        longDate(r.councilFrom) + ". Ask the council for a financial assessment by " + longDate(r.askBy) + ".";
      else if (r.headline === "Council help now") sentence = "Savings are already at or below the " + money0(r.upper) +
        " upper limit, so ask the council for a financial assessment now.";
      else if (r.headline === "Not running down") sentence = "Their income covers the fee and costs, so savings are not running down.";
      else sentence = "At these figures, savings stay above the upper limit for the full 10 years the calculator looks ahead.";
      out(res, "sentence", sentence);
      show(res, "wales", o.nation === "Wales");
      show(res, "tariff", o.nation !== "Wales");
      // once a year while they pay in full, the month the council starts to help, then stop
      var rows = [], helpFrom = -1;
      r.rows.forEach(function (x, i) {
        if (r.headline === "Add the fee" || (helpFrom >= 0 && i > helpFrom)) return;
        var first = x.who !== "self";
        if (i % 12 === 0 || first) rows.push([shortMonth(x.month),
          x.who === "self" ? "In full" : x.who === "helps" ? "Council pays part" : "Council pays",
          money0(x.start + x.home)]);
        if (first) helpFrom = i;
      });
      fillTable(tbody, rows);
      show(res, "table", rows.length > 0);
    }
    form.addEventListener("input", fill);
    form.addEventListener("change", fill);
    fill();
  }

  /* ---- inheritance tax gifts */
  var IHT_TYPES = [["none", "None: counts for 7 years"], ["small", "Small gift (up to £250 a person)"],
    ["wedding_child", "Wedding gift to a child"], ["wedding_grandchild", "Wedding gift to a grandchild"],
    ["wedding_other", "Wedding gift to anyone else"], ["spouse", "Husband, wife or civil partner"],
    ["charity", "Charity"], ["regular", "Regular gift from surplus income"]];
  var EXEMPT_AS = { small: "a small gift", wedding_child: "a wedding gift", wedding_grandchild: "a wedding gift",
    wedding_other: "a wedding gift", spouse: "a gift to a husband, wife or civil partner", charity: "a gift to charity",
    regular: "a regular gift from income" };
  function ihtUI(form) {
    var res = document.querySelector('[data-results="iht"]');
    var list;
    function fill() {
      var asAt = parseDate(field(form, "asAt").value);
      if (asAt === null) asAt = todayDays();
      var gifts = list.rows().map(function (r) {
        var f = function (k) { return r.querySelector('[data-f="' + k + '"]'); };
        return { date: parseDate(f("date").value), name: f("name").value, amount: readNum(f("amount")), type: f("type").value };
      });
      var r = ihtGifts(gifts, asAt, FIG);
      out(res, "asAt", longDate(asAt));
      out(res, "totalGiven", money(r.totalGiven));
      out(res, "exemptNow", money(r.exemptNow));
      out(res, "inside", money(r.inside));
      out(res, "nrbLeft", money(r.nrbLeft));
      out(res, "tax", money(r.tax));
      out(res, "nextOut", r.nextOut === null ? "-" : longDate(r.nextOut) + " (" + money(r.nextOutAmount) + ")");
      list.rows().forEach(function (row, i) {
        var g = r.gifts[i], st = row.querySelector("[data-status]");
        if (!g.active) { st.textContent = g.amount > 0 || g.date !== null ? "Add the date and the amount." : ""; return; }
        var bits = [g.status + "."];
        if (g.exempt > 0) bits.push(money(g.exempt) + " exempt as " + EXEMPT_AS[g.type] + ".");
        if (g.type === "small" && g.exempt === 0) bits.push("Over £" + FIG.iht.small_gift + " to " + (g.name || "this person") + " this tax year, so it isn't a small gift.");
        if (g.annualUsed > 0) bits.push(money(g.annualUsed) + " covered by the annual exemption.");
        if (g.counts > 0) bits.push(money(g.counts) + " counts for 7 years, until " + longDate(g.sevenYears) + ".");
        if (g.taxIfDied > 0) bits.push("Tax on it if they died on " + longDate(asAt) + ": " + money(g.taxIfDied) + ".");
        st.textContent = bits.join(" ");
      });
      fillTable(res.querySelector("tbody"), r.allowances.map(function (a) {
        return [a.label, money(a.needed), money(a.available), money(a.used), money(a.leftOver)];
      }));
      show(res, "allowances", r.allowances.length > 0);
    }
    var tpl = document.getElementById("gifts-row");
    var sel = tpl.content.querySelector('[data-f="type"]');
    IHT_TYPES.forEach(function (t) { sel.appendChild(el("option", { value: t[0] }, t[1])); });
    list = rowList(form, "gifts", 15, fill);
    [{ date: "2020-06-15", name: "James", amount: "6000", type: "wedding_child" },
     { date: "2022-09-10", name: "Emma", amount: "50000", type: "none" },
     { date: "2025-12-18", name: "Noah", amount: "250", type: "small" },
     { date: "2026-07-14", name: "Emma", amount: "3000", type: "none" },
     { date: "2026-08-01", name: "James", amount: "20000", type: "none" }].forEach(list.add);
    field(form, "asAt").value = isoDate(todayDays());
    form.addEventListener("input", fill);
    form.addEventListener("change", fill);
    fill();
  }

  /* ---- Christmas savings */
  function christmasUI(form) {
    var res = document.querySelector('[data-results="christmas"]');
    var dl = field(form, "deadline"), asOf = field(form, "asOf");
    asOf.value = isoDate(todayDays());
    dl.value = isoDate(nextChristmas(todayDays()));
    function fill() {
      var a = parseDate(asOf.value), d = parseDate(dl.value);
      if (a === null) a = todayDays();
      if (d === null) d = nextChristmas(a);
      var r = christmas({ budget: num(form, "budget"), spent: num(form, "spent"), saved: num(form, "saved"),
                          credit: num(form, "credit"), asOf: a, deadline: d });
      out(res, "perWeek", money(r.perWeek));
      out(res, "toFind", money(r.toFind));
      out(res, "stillToPay", money(r.stillToPay));
      out(res, "weeks", plural(r.weeks, "whole week", "whole weeks"));
      out(res, "daysTo", plural(r.daysTo, "day", "days"));
      out(res, "deadline", longDate(d) + " (a " + r.weekday + ")");
      out(res, "perWeekCredit", money(r.perWeekWithCredit));
      show(res, "credit", num(form, "credit") > 0);
      var s;
      if (r.weeks === 0) s = "That date has passed or is today, so there are no weeks left to save.";
      else if (r.toFind === 0) s = "You've already got enough put aside for what's left to buy.";
      else s = "Save " + money(r.perWeek) + " a week for " + plural(r.weeks, "week", "weeks") + " to find the " + money(r.toFind) + " still to come.";
      out(res, "sentence", s);
    }
    form.addEventListener("input", fill);
    form.addEventListener("change", fill);
    fill();
  }

  /* ---- debt payoff */
  function debtUI(form) {
    var res = document.querySelector('[data-results="debt"]');
    var list;
    function plan(name, p, debts, start) {
      var box = res.querySelector('[data-plan="' + name + '"]');
      if (!p || p.months === null) {
        out(box, "months", p ? "Not at this payment" : "-");
        out(box, "date", p ? "The payments don't cover the interest. Pay more each month." : "");
        out(box, "interest", "-");
        box.querySelector("ol").textContent = "";
        return;
      }
      out(box, "months", monthsText(p.months));
      out(box, "date", "Debt-free by " + monthYear(edate(start, p.months - 1)));
      out(box, "interest", money(p.interest));
      var ol = box.querySelector("ol"), order = debts.slice().sort(function (a, b) {
        return (name === "snowball" ? a.snowballRank - b.snowballRank : a.avalancheRank - b.avalancheRank);
      });
      ol.textContent = "";
      order.forEach(function (d) {
        var k = debts.indexOf(d);
        ol.appendChild(el("li", {}, d.name + ": cleared in month " + p.paidOff[k]));
      });
    }
    function fill() {
      var debts = list.rows().map(function (r) {
        var f = function (k) { return r.querySelector('[data-f="' + k + '"]'); };
        return { name: f("name").value, balance: readNum(f("balance")), apr: readNum(f("apr")) / 100, min: readNum(f("min")) };
      });
      var r = debtPlan(debts, num(form, "extra"));
      var t = todayDays(), a = ymd(t), start = days(a.y, a.m, 1);
      out(res, "total", money(r.total));
      out(res, "monthly", money(r.monthly));
      plan("snowball", r.snowball, r.debts, start);
      plan("avalanche", r.avalanche, r.debts, start);
      var s = "";
      if (!r.debts.length) s = "Add a debt with a balance to see a plan.";
      else if (r.snowball.months === null) s = "At " + money(r.monthly) + " a month the payments don't keep up with the interest.";
      else {
        var diff = r.snowball.interest - r.avalanche.interest;
        if (Math.abs(diff) < 0.5) s = "Both orders cost about the same in interest here.";
        else if (diff > 0) s = "Avalanche saves about " + money(diff) + " in interest compared with snowball.";
        else s = "Snowball costs about " + money(-diff) + " less in interest here.";
        if (r.snowball.months !== r.avalanche.months) s += " Snowball takes " + monthsText(r.snowball.months) + ", avalanche " + monthsText(r.avalanche.months) + ".";
        else s += " Both clear everything in " + monthsText(r.snowball.months) + ".";
      }
      out(res, "sentence", s);
      var m = r.minimumOnly;
      out(res, "minimumOnly", !m ? "-" : m.months === null ? "Some debts never clear at their minimum payment." :
        monthsText(m.months) + ", with " + money(m.interest) + " interest.");
      fillTable(res.querySelector("tbody"), r.debts.map(function (d) {
        return [d.name, money(d.balance), String(d.snowballRank), String(d.avalancheRank),
                d.minMonths === null ? "Payment too low" : plural(d.minMonths, "month", "months")];
      }));
      show(res, "table", r.debts.length > 0);
    }
    list = rowList(form, "debts", 10, fill);
    [{ name: "Credit card", balance: "3,800", apr: "27.9", min: "95" },
     { name: "Car loan", balance: "6,500", apr: "7.5", min: "180" },
     { name: "Store card", balance: "450", apr: "19.9", min: "20" },
     { name: "Personal loan", balance: "1,500", apr: "12.9", min: "60" }].forEach(list.add);
    form.addEventListener("input", fill);
    form.addEventListener("change", fill);
    fill();
  }

  /* ---- Gift Aid */
  function giftAidUI(form) {
    var res = document.querySelector('[data-results="giftaid"]');
    function fill() {
      var eligible = field(form, "eligible").value === "yes";
      var r = giftAid({ amount: num(form, "amount"), eligible: eligible }, FIG);
      out(res, "giftAid", money(r.giftAid));
      out(res, "total", money(r.total));
      out(res, "amount", money(r.amount));
      out(res, "taxNeeded", money(r.taxNeeded));
      show(res, "yes", eligible);
      show(res, "no", !eligible);
    }
    form.addEventListener("input", fill);
    form.addEventListener("change", fill);
    fill();
  }

  /* ---- business mileage */
  function mileageUI(form) {
    var res = document.querySelector('[data-results="mileage"]');
    function fill() {
      var vehicle = field(form, "vehicle").value;
      var r = mileage({ vehicle: vehicle, earlier: num(form, "earlier"), miles: num(form, "miles") }, FIG);
      var M = FIG.mileage, nf = new Intl.NumberFormat("en-GB");
      out(res, "claim", money(r.claim));
      out(res, "split", vehicle === "motorcycle"
        ? nf.format(r.first) + " miles at " + Math.round(M.motorcycle * 100) + "p"
        : nf.format(r.first) + " miles at " + Math.round(M.car_first * 100) + "p and " + nf.format(r.after) + " miles at " + Math.round(M.car_after * 100) + "p");
      show(res, "earlier", vehicle !== "motorcycle");
    }
    form.addEventListener("input", fill);
    form.addEventListener("change", fill);
    fill();
  }

  /* ---- Self Assessment 2025/26 */
  function saUI(form) {
    var res = document.querySelector('[data-results="sa"]'), S = FIG.self_assessment;
    function pct(x) { return Math.round(x * 1000) / 10 + "%"; }
    function fill() {
      var r = selfAssessment({
        where: field(form, "where").value, method: field(form, "method").value,
        income: num(form, "income"), expenses: num(form, "expenses"), job: num(form, "job"), paye: num(form, "paye"),
        paidJan: num(form, "paidJan"), paidJul: num(form, "paidJul"), weeks: num(form, "weeks"),
        exempt: field(form, "exempt").value === "yes"
      }, FIG);
      out(res, "dueJanuary", money(r.dueJanuary));
      out(res, "balancing", money(r.balancing));
      out(res, "poa1", money(r.poa1));
      out(res, "poa2", money(r.poa2));
      out(res, "bill", money(r.bill));
      out(res, "profit", money(r.profit));
      out(res, "job", money(r.job));
      out(res, "totalIncome", money(r.totalIncome));
      out(res, "personalAllowance", money(r.personalAllowance));
      out(res, "taxable", money(r.taxable));
      out(res, "incomeTax", money(r.incomeTax));
      out(res, "class4", money(r.class4));
      out(res, "class2", r.class2Paid ? "Treated as paid" : money(r.class2));
      out(res, "paye", money(-r.paye));
      out(res, "paidOnAccount", money(-r.paidOnAccount));
      out(res, "rates", r.scotland ? "Scottish rates" : "Rates for England, Wales and Northern Ireland");
      var other = r.method === "allowance" ? r.profitExpenses : r.profitAllowance;
      out(res, "method", r.income <= 0 ? "No business income typed in yet." :
        (r.method === "allowance" ? "Profit using the " + money0(S.trading_allowance) + " trading allowance: " + money(r.profitAllowance) +
          ". With your actual expenses it would be " + money(other) + "."
          : "Profit using your actual expenses: " + money(r.profitExpenses) +
          ". With the " + money0(S.trading_allowance) + " trading allowance instead it would be " + money(other) + "."));
      show(res, "loss", r.loss > 0);
      out(res, "loss", money(r.loss));
      var sentence;
      if (r.poaNeeded) {
        sentence = "Your bill for " + S.tax_year + " is " + money(r.bill) + (r.paidOnAccount > 0 ? ", and you've paid " +
          money(r.paidOnAccount) + " on account already" : "") + ". The Income Tax and Class 4 you owe is " + money0(S.poa_min) + " or more, and no more than " +
          pct(S.poa_paye_share) + " of your tax was taken off your pay, so HMRC also asks for 2 payments on account towards " +
          S.next_tax_year + ": " + money(r.poa1) + " by " + S.due_january + " and " + money(r.poa2) + " by " + S.due_july + ".";
      } else {
        sentence = "Your bill for " + S.tax_year + " is " + money(r.bill) + (r.paidOnAccount > 0 ? ", and you've paid " +
          money(r.paidOnAccount) + " on account already" : "") + ". No payments on account for " + S.next_tax_year + ": " +
          (r.poaReason === "under" ? "the Income Tax and Class 4 you owe, after the tax taken off your pay, is under " + money0(S.poa_min) + "."
            : "more than " + pct(S.poa_paye_share) + " of your tax was taken off your pay through PAYE.");
      }
      out(res, "sentence", sentence);
      out(res, "poaNeeded", r.poaNeeded ? "Yes" : "No");
      show(res, "overpaid", r.balancing < -0.005);
      out(res, "overpaid", "You've paid " + money(-r.balancing) + " more than you owe for " + S.tax_year +
        ". If you have tax due in the next 45 days, such as a payment on account, HMRC may take it off that instead of refunding it" +
        (r.poaNeeded ? ", so it's taken off the January total above." : "."));
      fillTable(res.querySelector("tbody[data-out-rows='bands']"), r.bands.map(function (b) {
        return [b.name, pct(b.rate), money(b.inBand), money(b.tax)];
      }));
    }
    form.addEventListener("input", fill);
    form.addEventListener("change", fill);
    fill();
  }

  /* ---- 50/30/20 budget: the split, two bars on the same £ scale (the split, and what's really spent), and each
     part's status once its spending is typed in. Empty spending boxes count as nothing, as in the spreadsheet. */
  function budgetUI(form) {
    var res = document.querySelector('[data-results="budget"]');
    var NAME = { needs: "Needs", wants: "Wants", savings: "Savings and debt" };
    function typed(name) { return field(form, name).value.trim() !== ""; }
    function width(e, x) { e.style.width = (Math.round(x * 10000) / 100) + "%"; }
    function fill() {
      var year = field(form, "period").value === "year";
      var r = budget503020({ pay: num(form, "pay"), period: year ? "year" : "month",
                             needs: num(form, "needs"), wants: num(form, "wants"), savings: num(form, "savings") });
      var any = r.parts.some(function (p) { return typed(p.key); });
      out(res, "monthly", money(r.monthly));
      show(res, "yearly", year);
      out(res, "yearly", money(num(form, "pay")) + " a year, divided by 12");
      var scale = Math.max(r.monthly, any ? r.spent : 0);
      width(res.querySelector("[data-bar='plan']"), scale > 0 ? r.monthly / scale : 1);
      show(res, "spent", any && (r.spent > 0 || r.monthly > 0));
      var said = [];
      r.parts.forEach(function (p) {
        out(res, p.key, money(p.target));
        var t = typed(p.key);
        show(res, p.key + "Spent", t);
        out(res, p.key + "Spent", money(p.spent));
        out(res, p.key + "Status", p.status);
        res.querySelector("[data-out='" + p.key + "Status']").setAttribute("data-ok", p.onTrack ? "true" : "false");
        var s = res.querySelector("[data-seg='" + p.key + "']");
        width(s, scale > 0 ? p.spent / scale : 0);
        s.hidden = !(p.spent > 0);
        if (t) said.push(NAME[p.key] + ": " + p.status.charAt(0).toLowerCase() + p.status.slice(1) + ".");
      });
      var left = res.querySelector("[data-seg='left']");
      width(left, scale > 0 ? Math.max(0, r.left) / scale : 0);
      left.hidden = !(r.left > 0.005);
      out(res, "spentTotal", money(r.spent));
      out(res, "left", money(r.left));
      var n = r.parts, sentence;
      if (r.monthly <= 0) sentence = "Type your take-home pay to see your split.";
      else if (!any) {
        sentence = "Of " + money(r.monthly) + " a month: up to " + money(n[0].target) + " on needs, up to " + money(n[1].target) +
          " on wants, and at least " + money(n[2].target) + " for savings or paying off debt.";
      } else {
        sentence = said.join(" ") + " " + (r.left > 0.005 ? money(r.left) + " of your pay isn't in any part yet."
          : r.left < -0.005 ? "That's " + money(-r.left) + " more than you take home."
          : "Every pound of your pay is in a part.");
      }
      out(res, "sentence", sentence);
    }
    form.addEventListener("input", fill);
    form.addEventListener("change", fill);
    fill();
  }

  var UI = { care: careUI, iht: ihtUI, christmas: christmasUI, debt: debtUI, giftaid: giftAidUI, mileage: mileageUI,
             sa: saUI, budget: budgetUI };
  function start() {
    document.querySelectorAll("form[data-calc]").forEach(function (form) {
      form.addEventListener("submit", function (e) { e.preventDefault(); });
      var f = UI[form.getAttribute("data-calc")];
      if (f && FIG) f(form);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})(typeof window !== "undefined" ? window : globalThis);

/* Sorted Sheets: the page behaviour that isn't a calculator (calc.js does those).
   - The deck of featured sheets on the home page: swipe or drag the top sheet away, or use the arrow buttons or the
     arrow keys; the sheet goes to the back of the pile.
   - The shop browser: sheet tabs switch section at once, Find filters as you type, sort by price or name, rows or
     cards, and a status bar with the count, sum and average of what's shown. The address keeps the state
     (?tab=small-business&q=rota&sort=price-asc&view=cards), so it can be shared and Back works.
   - The home page's small browser (tabs over the featured templates) and its one live cell (the Christmas savings
     sum from calc.js).
   - Home page colour blocks that slide over each other as you scroll.
   - Cookies (every page): a banner asks once, Accept or No thanks, and "Cookie settings" in the footer asks again.
     The choice is kept in this browser's localStorage ("ss-cookies": "yes" or "no"). Only after Accept does the page
     load the Pinterest Tag (Pinterest's standard base code and its core.js) and report: pagevisit on every
     page (with the listing on product pages), addtocart when a link to an Etsy listing is clicked (its name and price,
     in pounds) and search when the shop's Find box is used. Clicks are never held up: the event is handed to the tag
     and the browser goes straight on to Etsy. No thanks after Accept clears the tag's cookies and reloads the page.
   With JavaScript off every page still works: the tabs are links to each section and every template is listed, and
   nothing from Pinterest loads. Without Accept nothing is stored but the choice, and nothing is sent anywhere. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 });
  var pad = function (n) { return String(n).padStart(2, "0"); };

  /* ---------------------------------------------------------------- cookies: the Pinterest Tag, only after Accept */
  var PIN_TAG = "2612904316124";
  var LISTINGS = /*listings*/{"4608558491": ["Club Subs & Membership", 10.0], "4619689783": ["Christmas & New Year Bundle", 12.0], "4619697530": ["Small Business Kit", 29.0], "4619697350": ["Family & Care Kit", 29.0], "4619689235": ["Budget Starter Bundle", 14.0], "4619685899": ["Staff Rota & Wages", 10.0], "4619685757": ["Daily Till Cash-Up", 10.0], "4619693306": ["Childminder Hours & Invoices", 8.0], "4619679355": ["Executor & Estate Record", 12.0], "4619679203": ["Self Assessment Helper 2025/26", 8.0], "4616355104": ["2027 Digital Planner UK, hyperlinked PDF", 5.0], "4616355002": ["2027 Printable Planner UK, A4 + A5 PDF", 4.0], "4616309895": ["GCSE & A-level Revision Planner", 6.0], "4608845140": ["Christmas Budget & Gift Planner", 6.0], "4608558341": ["Landlord Rent & Arrears", 12.0], "4608579782": ["Holiday Let Booking Tracker", 14.0], "4608558115": ["Recipe Costing & Menu Pricing", 12.0], "4608557913": ["Quotes & Invoices", 12.0], "4589833979": ["Inheritance Tax Gift Record", 15.0], "4594127658": ["Custom spreadsheet: Premium", 110.0], "4594126784": ["Custom spreadsheet: Standard", 75.0], "4594107929": ["Custom spreadsheet: Simple", 40.0], "4589829859": ["Care Home Fees Runway Calculator", 9.0], "4589835548": ["UK Power of Attorney Record Keeper", 12.0], "4589299225": ["Everything Bundle", 60.0], "4589306920": ["Meal Planner & Grocery List", 9.0], "4589295301": ["Client Onboarding Dashboard", 9.0], "4589293505": ["Wedding Budget Planner", 9.0], "4589301590": ["UK Sole Trader Bookkeeping Kit", 15.0], "4589290093": ["Complete Money System", 19.0], "4589298112": ["Yearly Budget Planner", 6.0], "4589286503": ["Small Business Income & Expense", 9.0], "4589284259": ["Reseller Inventory & Profit Tracker", 9.0], "4589282773": ["50/30/20 Budget Calculator", 4.0], "4589290620": ["Savings Goals & 52-Week Challenge", 5.0], "4589278091": ["Social Media Content Calendar", 4.0], "4589285480": ["Weekly Student Planner", 4.0], "4589283194": ["Workout & Progress Log", 4.0], "4589280586": ["30-Day Habit Tracker", 3.0], "4589278810": ["Monthly Budget Tracker", 6.0], "4589267529": ["Debt Payoff Planner", 6.0], "4589265223": ["Freelancer Invoice & Client Tracker", 9.0], "4589267014": ["Personal Finance Dashboard", 9.0]}/*/listings*/;   // id -> [name, price in £], filled in by build.py from data/etsy.json
  var CHOICE = "ss-cookies", pinOn = false;
  var PIN_KEYS = /^(_pin|_epik|_derived_epik)/;   // the tag's own cookies and stored ids on this site
  function choice() { try { return localStorage.getItem(CHOICE); } catch (e) { return null; } }
  function remember(v) { try { localStorage.setItem(CHOICE, v); } catch (e) { /* private window: asks again next page */ } }
  function track(event, data) {             // fire and forget: never waits for Pinterest, never holds up the page
    if (!pinOn) return;
    try { window.pintrk("track", event, data); } catch (e) { /* ignore */ }
  }
  function item(id) {
    var x = LISTINGS[id];
    return x ? { product_id: id, product_name: x[0], product_price: x[1] } : null;
  }
  function startPinterest() {
    if (pinOn) return;
    pinOn = true;
    /* Pinterest's standard base code */
    !function (e) { if (!window.pintrk) { window.pintrk = function () { window.pintrk.queue.push(Array.prototype.slice.call(arguments)); };
      var n = window.pintrk; n.queue = [], n.version = "3.0"; var t = document.createElement("script"); t.async = !0, t.src = e;
      var r = document.getElementsByTagName("script")[0]; r.parentNode.insertBefore(t, r); } }("https://s.pinimg.com/ct/core.js");
    window.pintrk("load", PIN_TAG);
    window.pintrk("page");
    var main = $("main[data-listing]"), it = main && item(main.getAttribute("data-listing"));
    track("pagevisit", it ? { currency: "GBP", line_items: [it] } : {});
  }
  function etsyClick(e) {                   // any link to an Etsy listing: Buy buttons, shop rows, buy strips, text links
    if (!pinOn || (e.type === "auxclick" && e.button !== 1)) return;
    var a = e.target.closest && e.target.closest('a[href^="https://sortedsheetsshopuk.etsy.com/listing/"]');
    var m = a && /\/listing\/(\d+)/.exec(a.getAttribute("href")), it = m && item(m[1]);
    if (!it) return;
    track("addtocart", { value: it.product_price, currency: "GBP", order_quantity: 1,
      line_items: [{ product_id: it.product_id, product_name: it.product_name, product_price: it.product_price, product_quantity: 1 }] });
  }
  function forget() {                       // No thanks after Accept: expire the tag's cookies, drop its stored ids
    var parts = location.hostname.split("."), gone = "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (!PIN_KEYS.test(name)) return;
      document.cookie = name + gone;
      for (var i = 0; i < parts.length - 1; i++) document.cookie = name + gone + "; domain=." + parts.slice(i).join(".");
    });
    try {
      Object.keys(localStorage).filter(function (k) { return PIN_KEYS.test(k); }).forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* ignore */ }
  }
  function banner(opener) {
    var old = $("[data-cookies]");
    if (old) old.remove();
    var brand = $(".brand"), root = brand ? brand.getAttribute("href") : "./", now = choice();
    var box = document.createElement("section");
    box.className = "cookies";
    box.setAttribute("data-cookies", "");
    box.setAttribute("aria-labelledby", "ck-h");
    box.innerHTML = '<p class="ck-title" id="ck-h">Cookies?</p>' +
      "<p>Sorted Sheets advertises on Pinterest. If you accept, the Pinterest Tag sets cookies so Pinterest can tell us " +
      "which ads bring people here and when they go on to Etsy to buy. Nothing from Pinterest loads unless you accept. " +
      '<a href="' + root + 'privacy/">How it works</a></p>' +
      (now ? '<p class="ck-now">Your choice now: <b>' + (now === "yes" ? "Accept" : "No thanks") + "</b></p>" : "") +
      '<div class="ck-btns"><button type="button" class="btn" data-consent="yes">Accept</button>' +
      '<button type="button" class="btn" data-consent="no">No thanks</button></div>';
    var skip = $(".skip");
    if (skip) skip.after(box); else document.body.prepend(box);
    $$("[data-consent]", box).forEach(function (b) {
      b.addEventListener("click", function () {
        var was = choice(), v = b.getAttribute("data-consent");
        remember(v);
        box.remove();
        if (opener) opener.focus();
        if (v === "yes") startPinterest();
        else if (was === "yes" || pinOn) { forget(); location.reload(); }
      });
    });
    if (opener) $("button", box).focus();
  }
  function cookies() {
    var now = choice();
    if (now === "yes") startPinterest();
    else if (now !== "no") banner(null);
    $$("[data-cookie-settings]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); banner(a); });
    });
    document.addEventListener("click", etsyClick, true);
    document.addEventListener("auxclick", etsyClick, true);
  }

  /* ---------------------------------------------------------------- status bar: count, sum, average */
  function status(bar, prices) {
    if (!bar) return;
    var sum = prices.reduce(function (a, b) { return a + b; }, 0);
    $("[data-count]", bar).textContent = prices.length;
    $("[data-sum]", bar).textContent = gbp.format(sum);
    $("[data-avg]", bar).textContent = gbp.format(prices.length ? sum / prices.length : 0);
  }

  /* ---------------------------------------------------------------- the shop browser */
  function shop(root) {
    var tabs = $$(".tab", root), find = $("#find", root), sort = $("#sort", root), viewbtn = $("[data-viewtoggle]", root);
    var empty = $("[data-empty]", root), emptyQ = $("[data-empty-q]", root), announce = $("[data-announce]", root);
    var list = $(".b-list", root), bar = $("[data-status]", root), tools = $("[data-tools]", root);
    var names = {};
    tabs.forEach(function (t) { names[t.dataset.tab] = $("span", t).textContent; });
    // one list of every template (the sections are for people without JavaScript)
    var ul = document.createElement("ul");
    ul.className = "prows";
    ul.setAttribute("aria-label", "Templates");
    var rows = $$(".prow", root).map(function (el) {
      var name = $("h3", el).textContent.trim();
      return { el: el, group: el.dataset.group, price: +el.dataset.price, order: +el.dataset.order, name: name,
        text: (name + " " + $(".etsy-title", el).textContent + " " + (names[el.dataset.group] || "")).toLowerCase().replace(/&/g, "and") };
    });
    rows.forEach(function (r) { ul.appendChild(r.el); });
    $$(".b-sec", root).forEach(function (s) { s.hidden = true; });
    var h = document.createElement("h2");          // keeps the headings in order: h1, then this, then each template's h3
    h.className = "vh";
    h.textContent = "Templates";
    list.appendChild(h);
    list.appendChild(ul);
    root.dataset.ready = "";

    var state = read(), sortedAs = null, timer = null;
    function read() {
      var p = new URLSearchParams(location.search), tab = p.get("tab") || "all";
      if (!tabs.some(function (t) { return t.dataset.tab === tab; })) tab = "all";
      var s = p.get("sort") || "";
      return { tab: tab, q: p.get("q") || "", sort: /^(price-asc|price-desc|az)$/.test(s) ? s : "", view: p.get("view") === "cards" ? "cards" : "rows" };
    }
    function write(push) {
      var p = new URLSearchParams();
      if (state.tab !== "all") p.set("tab", state.tab);
      if (state.q) p.set("q", state.q);
      if (state.sort) p.set("sort", state.sort);
      if (state.view !== "rows") p.set("view", state.view);
      var url = location.pathname + (p.toString() ? "?" + p.toString() : "");
      if (url === location.pathname + location.search) return;
      history[push ? "pushState" : "replaceState"](null, "", url);
    }
    function apply() {
      // sort (only re-order the list when the sort changes)
      if (sortedAs !== state.sort) {
        var by = {
          "": function (a, b) { return a.order - b.order; },
          "price-asc": function (a, b) { return a.price - b.price || a.order - b.order; },
          "price-desc": function (a, b) { return b.price - a.price || a.order - b.order; },
          "az": function (a, b) { return a.name.localeCompare(b.name, "en-GB"); }
        }[state.sort];
        rows.slice().sort(by).forEach(function (r) { ul.appendChild(r.el); });
        sortedAs = state.sort;
      }
      // filter
      var words = state.q.toLowerCase().replace(/&/g, "and").split(/\s+/).filter(Boolean), shown = [];
      rows.forEach(function (r) {
        var ok = (state.tab === "all" || r.group === state.tab) && words.every(function (w) { return r.text.indexOf(w) >= 0; });
        r.el.hidden = !ok;
        if (ok) shown.push(r.price);
      });
      tabs.forEach(function (t) { if (t.dataset.tab === state.tab) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current"); });
      if (find.value !== state.q) find.value = state.q;
      sort.value = state.sort;
      root.dataset.view = state.view;
      viewbtn.setAttribute("aria-pressed", state.view === "cards" ? "true" : "false");
      $$(".pthumb", root).forEach(function (img) {
        img.sizes = state.view === "cards" ? "(min-width: 1000px) 260px, (min-width: 700px) 30vw, 46vw" : "(min-width: 700px) 96px, 72px";
      });
      empty.hidden = shown.length > 0;
      if (!shown.length) {
        emptyQ.textContent = state.q ? "“" + state.q + "”" : "";
        $("[data-clear]", root).textContent = state.tab !== "all" && state.q ? "Search every section" : "Show every template";
      }
      status(bar, shown);
      clearTimeout(timer);
      timer = setTimeout(function () {
        announce.textContent = shown.length + (shown.length === 1 ? " template" : " templates") + " shown" +
          (state.tab !== "all" ? " in " + names[state.tab] : "") + (state.q ? " for " + state.q : "") + ".";
      }, 500);
    }
    function top() {   // after switching, start at the top of the list if we'd scrolled past it
      var y = root.getBoundingClientRect().top + window.scrollY - 4;
      if (window.scrollY > y) window.scrollTo(0, y);
    }

    tabs.forEach(function (t) {
      t.addEventListener("click", function (e) {
        e.preventDefault();
        state.tab = t.dataset.tab;
        apply(); write(true); top();
        t.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    });
    var typing = null, searching = null, searched = "";
    find.addEventListener("input", function () {
      state.q = find.value.trim();
      apply();
      clearTimeout(typing);
      typing = setTimeout(function () { write(false); }, 400);
      clearTimeout(searching);              // after Accept: tell Pinterest what was searched, once typing stops
      searching = setTimeout(function () {
        if (state.q && state.q !== searched) { searched = state.q; track("search", { search_query: state.q }); }
      }, 1200);
    });
    find.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && find.value) { e.preventDefault(); state.q = ""; find.value = ""; apply(); write(false); }
      if (e.key === "Enter") { e.preventDefault(); find.blur(); }
    });
    sort.addEventListener("change", function () { state.sort = sort.value; apply(); write(false); });
    viewbtn.addEventListener("click", function () { state.view = state.view === "cards" ? "rows" : "cards"; apply(); write(false); });
    $("[data-clear]", root).addEventListener("click", function () {
      if (state.tab !== "all" && state.q) state.tab = "all"; else { state.tab = "all"; state.q = ""; }
      apply(); write(true); find.focus();
    });
    window.addEventListener("popstate", function () { state = read(); apply(); });
    document.addEventListener("keydown", function (e) {   // "/" jumps to Find, as on many sites
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      var a = document.activeElement;
      if (a && (a.tagName === "INPUT" || a.tagName === "SELECT" || a.tagName === "TEXTAREA" || a.isContentEditable)) return;
      e.preventDefault(); find.focus(); find.select();
    });
    apply();
    var cur = $(".tab[aria-current]", root);
    if (cur && cur.dataset.tab !== "all") cur.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  /* ---------------------------------------------------------------- the home page's small browser */
  function mini(root) {
    var tabs = $$(".tab", root), panels = $$("[data-panel]", root), bar = $("[data-status]", root);
    function show(key) {
      panels.forEach(function (p) { p.hidden = p.dataset.panel !== key; });
      tabs.forEach(function (t) { if (t.dataset.tab === key) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current"); });
      var p = panels.filter(function (x) { return x.dataset.panel === key; })[0];
      status(bar, $$(".prow", p).map(function (r) { return +r.dataset.price; }));
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function (e) {
        e.preventDefault();
        show(t.dataset.tab);
        t.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    });
    show("all");
  }

  /* ---------------------------------------------------------------- the deck */
  function deck(root) {
    var cards = $$(".card", root), order = cards.map(function (_, i) { return i; });
    var count = $("[data-count]", root), say = $("[data-deck-announce]", root), busy = false, touched = false;
    var n = cards.length;
    function sheet(i) { return $(".sheet", cards[i]); }
    function apply(announce) {
      order.forEach(function (ci, p) {
        var li = cards[ci];
        li.style.setProperty("--k", p);
        li.classList.toggle("top", p === 0);
        $("a", li).tabIndex = p === 0 ? 0 : -1;
        if (p === 0) li.removeAttribute("aria-hidden"); else li.setAttribute("aria-hidden", "true");
      });
      var top = cards[order[0]];
      count.innerHTML = "<b>" + pad(order[0] + 1) + "</b>/" + pad(n) + " <span>" +
        (announce ? top.dataset.name + ", " + top.dataset.price : "Swipe the sheets") + "</span>";
      if (announce) say.textContent = top.dataset.name + ", " + top.dataset.price + ". " + (order[0] + 1) + " of " + n + ".";
    }
    function move(el, x, y, r, ms, ease) {
      el.style.transition = ms ? "transform " + ms + "ms " + ease : "none";
      el.style.transform = "translate(" + x + "px," + y + "px) rotate(" + r + "deg)";
    }
    function next(dir, fromX) {
      if (busy) return;
      touched = true;
      var s = sheet(order[0]);
      if (reduce) { order.push(order.shift()); apply(true); return; }
      busy = true;
      var w = s.offsetWidth;
      if (fromX == null) move(s, 0, 0, 0, 0);
      s.offsetWidth;
      move(s, dir * w * 1.15, -20, dir * 16, 300, "cubic-bezier(.5,0,.75,0)");
      setTimeout(function () {
        order.push(order.shift()); apply(true);
        move(s, dir * w * 0.55, 0, dir * 8, 0);
        s.offsetWidth;
        move(s, 0, 0, 0, 560, "cubic-bezier(.34,1.4,.5,1)");
        setTimeout(function () { s.style.transition = ""; s.style.transform = ""; busy = false; }, 580);
      }, 310);
    }
    function prev() {
      if (busy) return;
      touched = true;
      order.unshift(order.pop());
      var s = sheet(order[0]);
      apply(true);
      if (reduce) return;
      busy = true;
      move(s, s.offsetWidth * 1.1, -30, 14, 0);
      s.offsetWidth;
      move(s, 0, 0, 0, 600, "cubic-bezier(.34,1.3,.5,1)");
      setTimeout(function () { s.style.transition = ""; s.style.transform = ""; busy = false; }, 620);
    }
    $("[data-next]", root).addEventListener("click", function () { next(-1); });
    $("[data-prev]", root).addEventListener("click", prev);
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); next(-1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    });
    apply(false);
    if (reduce) return;

    // drag or swipe the top sheet: a short drag springs back, a long or quick one throws it to the back
    var drag = null;
    cards.forEach(function (li, i) {
      var s = sheet(i);
      s.addEventListener("pointerdown", function (e) {
        if (busy || order[0] !== i || (e.pointerType === "mouse" && e.button !== 0)) return;
        drag = { s: s, x0: e.clientX, y0: e.clientY, dx: 0, moved: false, t: performance.now(), vx: 0, id: e.pointerId };
      });
      s.addEventListener("pointermove", function (e) {
        if (!drag || drag.s !== s) return;
        var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
        if (!drag.moved) {
          if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }   // it's a scroll
          if (Math.abs(dx) < 6) return;
          drag.moved = true;
          s.classList.add("dragging");
          try { s.setPointerCapture(drag.id); } catch (err) { /* ignore */ }
        }
        var t = performance.now();
        drag.vx = 0.7 * drag.vx + 0.3 * ((dx - drag.dx) / Math.max(1, t - drag.t));
        drag.dx = dx; drag.t = t;
        move(s, dx, -Math.abs(dx) / 18, dx / 14, 0);
      });
      function end() {
        if (!drag || drag.s !== s) return;
        var d = drag;
        drag = null;
        s.classList.remove("dragging");
        if (!d.moved) return;
        touched = true;
        s.dataset.dragged = "1";
        setTimeout(function () { delete s.dataset.dragged; }, 50);
        if (Math.abs(d.dx) > s.offsetWidth * 0.28 || Math.abs(d.vx) > 0.6) next(d.dx < 0 ? -1 : 1, d.dx);
        else {
          move(s, 0, 0, 0, 520, "cubic-bezier(.34,1.6,.5,1)");
          setTimeout(function () { s.style.transition = ""; s.style.transform = ""; }, 540);
        }
      }
      s.addEventListener("pointerup", end);
      s.addEventListener("pointercancel", end);
      s.addEventListener("click", function (e) { if (s.dataset.dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
    });
    // a small nudge, once, so people see the sheets can be moved
    setTimeout(function () {
      if (touched || window.scrollY > 200) return;
      var s = sheet(order[0]);
      move(s, -26, 0, -3.5, 380, "cubic-bezier(.2,.8,.2,1)");
      setTimeout(function () { move(s, 0, 0, 0, 700, "cubic-bezier(.34,1.6,.5,1)"); }, 400);
      setTimeout(function () { if (!busy) { s.style.transition = ""; s.style.transform = ""; } }, 1150);
    }, 2600);
  }

  /* ---------------------------------------------------------------- the live cell: Christmas savings (calc.js sums) */
  function live(form) {
    var C = window.SSCalc;
    if (!C) return;
    var budget = $("#lc-budget", form), saved = $("#lc-saved", form);
    var weeks = $("[data-lc-weeks]", form), per = $("[data-lc-perweek]", form), sentence = $("[data-lc-sentence]", form);
    function today() { var t = new Date(); return C.util.days(t.getFullYear(), t.getMonth() + 1, t.getDate()); }
    function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
    function run() {
      var b = C.util.parseNum(budget.value), s = C.util.parseNum(saved.value);
      budget.setAttribute("aria-invalid", isNaN(b) ? "true" : "false");
      saved.setAttribute("aria-invalid", isNaN(s) ? "true" : "false");
      if (isNaN(b) || isNaN(s)) { sentence.textContent = "Type a number in each yellow cell, like 600 or £1,200."; return; }
      var t = today(), r = C.christmas({ budget: b, spent: 0, saved: s, credit: 0, asOf: t, deadline: C.nextChristmas(t) });
      weeks.textContent = r.weeks;
      per.textContent = gbp.format(r.perWeek);
      if (!reduce) { per.classList.remove("pop"); per.offsetWidth; per.classList.add("pop"); }
      sentence.textContent = r.weeks === 0 ? "Christmas is today, so there are no weeks left to save."
        : r.toFind === 0 ? "You've already got enough put aside for what's left to buy."
        : "Save " + gbp.format(r.perWeek) + " a week for " + plural(r.weeks, "week", "weeks") + " to find the " + gbp.format(r.toFind) + " still to come.";
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    form.addEventListener("input", run);
    form.addEventListener("keydown", function (e) {   // Enter moves down, as in a spreadsheet
      if (e.key === "Enter" && e.target === budget) { e.preventDefault(); saved.focus(); saved.select(); }
    });
    run();
  }

  /* ---------------------------------------------------------------- home blocks slide over each other */
  function stack(blocks) {
    if (reduce) return;
    function set() {
      blocks.forEach(function (b, i) {
        b.style.position = "sticky";
        b.style.zIndex = i + 1;
        b.style.top = Math.min(0, window.innerHeight - b.offsetHeight) + "px";
      });
    }
    set();
    window.addEventListener("resize", set);
    if (document.fonts) document.fonts.ready.then(set);
    if ("ResizeObserver" in window) { var ro = new ResizeObserver(set); blocks.forEach(function (b) { ro.observe(b); }); }
  }

  /* ---------------------------------------------------------------- product pages: the buy strip shows once the main Buy has scrolled away */
  function buystrip(strip) {
    var main = $(".buybox .btn");
    if (!main || !("IntersectionObserver" in window)) { strip.classList.add("on"); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { strip.classList.toggle("on", !e.isIntersecting && e.boundingClientRect.top < 0); });
    }).observe(main);
  }

  function start() {
    cookies();
    $$("[data-browser=shop]").forEach(shop);
    $$("[data-browser=home]").forEach(mini);
    $$("[data-deck]").forEach(deck);
    var lc = $("form.livecell");
    if (lc) live(lc);
    var strip = $("[data-buystrip]");
    if (strip) buystrip(strip);
    var blocks = $$(".home > .block");
    if (blocks.length) stack(blocks);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

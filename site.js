/* Sorted Sheets: the page behaviour that isn't a calculator (calc.js does those).
   - The deck of featured sheets on the home page: swipe or drag the top sheet away, or use the arrow buttons or the
     arrow keys; the sheet goes to the back of the pile.
   - The shop browser: sheet tabs switch section at once, Find filters as you type, sort by price or name, rows or
     cards, and a status bar with the count, sum and average of what's shown. The address keeps the state
     (?tab=small-business&q=rota&sort=price-asc&view=cards), so it can be shared and Back works.
   - The home page's small browser (tabs over the featured templates) and its one live cell (the Christmas savings
     sum from calc.js).
   - Home page colour blocks that slide over each other as you scroll.
   With JavaScript off every page still works: the tabs are links to each section and every template is listed.
   Nothing is stored and nothing is sent anywhere. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 });
  var pad = function (n) { return String(n).padStart(2, "0"); };

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
    var typing = null;
    find.addEventListener("input", function () {
      state.q = find.value.trim();
      apply();
      clearTimeout(typing);
      typing = setTimeout(function () { write(false); }, 400);
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

/* Outperform X - bendras puslapio elgesys: navigacija, įkrovimo seka, scroll reveal, skaitikliai */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  window.OX = { reducedMotion: RM };

  /* ---- navigacija ---- */
  var nav = document.querySelector('nav.top');
  if (nav) {
    var ticking = false;
    var updateNav = function () { nav.classList.toggle('scrolled', window.scrollY > 8); ticking = false; };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateNav); }
    }, { passive: true });
    updateNav();
  }
  var burger = document.querySelector('.hamburger');
  var links = document.querySelector('.nav-links');
  var mobileNav = window.matchMedia ? window.matchMedia('(max-width: 1100px)') : null;
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    links.classList.toggle('open', open);
    if ('inert' in links) links.inert = !open && !!(mobileNav && mobileNav.matches);
  }
  if (burger && links) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    Array.prototype.forEach.call(links.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
    });
    var syncMenu = function () { setMenu(false); };
    syncMenu();
    if (mobileNav) { if (mobileNav.addEventListener) mobileNav.addEventListener('change', syncMenu); else mobileNav.addListener(syncMenu); }
  }

  /* ---- skaitikliai [data-count] ---- */
  var NBSP = ' ';
  function fmtNum(v, decimals) {
    var parts = v.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    return parts.join('.');
  }
  function startCounters() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-count]'), function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      var finalText = prefix + fmtNum(target, decimals) + suffix;
      if (RM || isNaN(target)) { el.textContent = finalText; return; }
      var dur = 1200, start = null;
      function step(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = prefix + fmtNum(target * eased, decimals) + suffix;
        if (t < 1) requestAnimationFrame(step); else el.textContent = finalText;
      }
      setTimeout(function () { requestAnimationFrame(step); }, 700 + delay);
    });
  }

  /* ---- hero įkrovimo seka: laukiam šriftų, bet ne ilgiau nei 600ms ---- */
  var loadedDone = false;
  function markLoaded() {
    if (loadedDone) return;
    loadedDone = true;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.add('is-loaded');
        startCounters();
      });
    });
  }
  if (RM) {
    markLoaded();
  } else {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(markLoaded);
    setTimeout(markLoaded, 600);
  }

  /* ---- scroll reveal ---- */
  var targets = Array.prototype.slice.call(document.querySelectorAll('.rv, .rv-stagger'));
  Array.prototype.forEach.call(document.querySelectorAll('.rv-stagger'), function (parent) {
    Array.prototype.forEach.call(parent.children, function (child, i) {
      child.style.setProperty('--i', Math.min(i, 6));
    });
  });
  function show(t) {
    if (t.classList.contains('in')) return;
    t.classList.add('in');
    try { t.dispatchEvent(new CustomEvent('ox:reveal')); } catch (e) { /* senos naršyklės */ }
  }
  if (RM || !('IntersectionObserver' in window)) {
    targets.forEach(show);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { io.observe(t); });

    /* apsauginis tinklas: kas jau matoma, bet observer'io nepagauta - parodom */
    var net = function () {
      var vh = window.innerHeight || root.clientHeight;
      targets.forEach(function (t) {
        if (t.classList.contains('in')) return;
        var r = t.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) { show(t); io.unobserve(t); }
      });
    };
    setTimeout(net, 1500);
    window.addEventListener('resize', net);
    window.addEventListener('load', function () { setTimeout(net, 300); });
  }
})();

/* Atelier Brown - interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  /* ---------- CONFIG: edit these before launch ---------- */
  const CONFIG = {
    // WhatsApp number that should receive enquiries: digits only, with country code, no + or spaces.
    // Example for India: '919812345678'. While empty, WhatsApp opens and lets the visitor pick the chat.
    whatsappNumber: '',
    // Add real profile URLs to switch the footer icons on. Empty = icon stays inactive.
    social: { instagram: '', facebook: '', pinterest: '', linkedin: '' }
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- image fallback: failed photos reveal the brown panel behind them ---------- */
  $$('img').forEach((img) => {
    const fail = () => img.classList.add('img-failed');
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
  });

  /* ---------- floating WhatsApp button ---------- */
  const waFloat = $('#wa-float');
  const waNumber = String(CONFIG.whatsappNumber).replace(/\D/g, '');
  waFloat.href = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent('Hello Atelier Brown, I would like to know more about your interior design services.');

  /* ---------- footer year + social links ---------- */
  $('#year').textContent = new Date().getFullYear();
  $$('[data-social]').forEach((a) => {
    const url = CONFIG.social[a.dataset.social];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  });

  /* ---------- header: scrolled state, mobile menu ---------- */
  const header = $('#site-header');
  const toggle = $('#nav-toggle');
  const navPanel = $('#primary-nav');
  const mqMobile = window.matchMedia('(max-width: 900px)');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    header.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    // keep off-screen links out of the tab order on mobile
    if (mqMobile.matches) navPanel.toggleAttribute('inert', !open); else navPanel.removeAttribute('inert');
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  navPanel.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
  mqMobile.addEventListener('change', () => setMenu(false));
  setMenu(false);

  /* ---------- active nav link ---------- */
  const navLinks = $$('[data-nav]');
  const ids = navLinks.map((a) => a.getAttribute('href').slice(1));
  const sections = ids.map((id) => document.getElementById(id));
  function setActive() {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = ids[0];
    sections.forEach((s) => { if (s && s.offsetTop <= y) current = s.id; });
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + current));
  }

  /* ---------- scroll handling: header, back-to-top, parallax (one rAF loop) ---------- */
  const toTop = $('#to-top');
  const progress = $('#progress');
  const heroMedia = $('.hero__media');
  const stmt = $('.statement');
  const stmtImg = $('.statement__img');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    toTop.classList.toggle('is-visible', y > 700);
    waFloat.classList.toggle('is-visible', y > 600);
    setActive();
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0).toFixed(4) + ')';
    if (!reduced) {
      if (y < window.innerHeight * 1.2) heroMedia.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0)';
      const r = stmt.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        stmtImg.style.transform = 'translate3d(0,' + (p * -60).toFixed(1) + 'px,0)';
      }
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* ---------- scroll reveal (stagger siblings) ---------- */
  const revealEls = $$('.reveal');
  revealEls.forEach((el) => {
    const fig = el.closest('.proj');
    const idx = fig ? $$('.proj').indexOf(fig) % 3 : $$(':scope > .reveal', el.parentElement).indexOf(el);
    el.style.setProperty('--d', Math.min(idx, 5) * 0.09 + 's');
  });
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- cursor spotlight on cards ---------- */
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    $$('.svc, .why__list li').forEach((el) => el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
  }

  /* ---------- services -> preselect the contact dropdown ---------- */
  $$('[data-service]').forEach((a) => a.addEventListener('click', () => {
    $('#service').value = a.dataset.service;
  }));

  /* ---------- gallery filters ---------- */
  const filters = $$('.filter');
  const projects = $$('.proj');
  const status = $('#filter-status');
  const grid = $('#gallery-grid');
  let filterTimer;
  filters.forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filters.forEach((b) => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
    clearTimeout(filterTimer);
    const matches = (p) => f === 'all' || p.dataset.category === f;
    projects.forEach((p) => { if (!matches(p) && !p.hidden) p.classList.add('is-leaving'); });
    filterTimer = setTimeout(() => {
      let count = 0;
      grid.classList.toggle('is-filtered', f !== 'all');
      projects.forEach((p) => {
        p.classList.remove('is-leaving');
        const show = matches(p);
        p.hidden = !show;
        if (show) {
          count++;
          p.classList.add('is-entering');
          requestAnimationFrame(() => requestAnimationFrame(() => p.classList.remove('is-entering')));
        }
      });
      status.textContent = 'Showing ' + count + (count === 1 ? ' project' : ' projects') + (f === 'all' ? '' : ' in ' + f);
    }, reduced ? 0 : 320);
  }));

  /* ---------- lightbox (view project) ---------- */
  const box = $('#lightbox');
  const boxImg = $('#lightbox-img');
  const boxCap = $('#lightbox-cap');
  let lastTrigger = null;
  $$('.proj__btn').forEach((btn) => btn.addEventListener('click', () => {
    lastTrigger = btn;
    const src = $('img', btn);
    boxImg.src = btn.dataset.full;
    boxImg.onerror = () => { boxImg.onerror = null; boxImg.src = src.currentSrc || src.src; };
    boxImg.alt = src.alt;
    boxCap.textContent = $('.proj__title', btn).textContent;
    if (typeof box.showModal === 'function') box.showModal(); else box.setAttribute('open', '');
  }));
  function closeBox() { if (box.open) box.close(); }
  $('#lightbox-close').addEventListener('click', closeBox);
  box.addEventListener('click', (e) => { if (e.target === box) closeBox(); });
  box.addEventListener('close', () => { if (lastTrigger) lastTrigger.focus(); });

  /* ---------- contact form ---------- */
  const form = $('#contact-form');
  const formStatus = $('#form-status');
  const messages = {
    name: 'Please enter your full name.',
    email: 'Please enter a valid email address, for example name@example.com.',
    phone: 'Please enter a phone number with at least 7 digits.',
    service: 'Please choose a service.',
    message: 'Please tell us a little about your project (at least 10 characters).'
  };
  function validateField(el) {
    const v = el.value.trim();
    let ok = true;
    if (el.name === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    else if (el.name === 'phone') ok = /^[+()\-.\s\d]+$/.test(v) && v.replace(/\D/g, '').length >= 7;
    else if (el.name === 'message') ok = v.length >= 10;
    else ok = v.length > 0;
    const wrap = el.closest('.field');
    wrap.classList.toggle('has-error', !ok);
    el.setAttribute('aria-invalid', String(!ok));
    $('.field__err', wrap).textContent = ok ? '' : messages[el.name];
    return ok;
  }
  const controls = $$('input, select, textarea', form);
  controls.forEach((el) => {
    el.addEventListener('blur', () => validateField(el));
    el.addEventListener('input', () => { if (el.closest('.field').classList.contains('has-error')) validateField(el); });
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    formStatus.className = 'form__status';
    formStatus.textContent = '';
    const results = controls.map(validateField);
    const firstBad = controls[results.indexOf(false)];
    if (firstBad) {
      formStatus.textContent = 'Please correct the highlighted fields and try again.';
      formStatus.classList.add('is-err');
      firstBad.focus();
      return;
    }
    // Build the WhatsApp message from the validated form and open it.
    const d = Object.fromEntries(new FormData(form));
    const text = [
      'Hello Atelier Brown, I would like to request a consultation.',
      '',
      'Name: ' + d.name.trim(),
      'Email: ' + d.email.trim(),
      'Phone: ' + d.phone.trim(),
      'Service: ' + d.service,
      'Project details: ' + d.message.trim()
    ].join('\n');
    const number = String(CONFIG.whatsappNumber).replace(/\D/g, '');
    const url = 'https://wa.me/' + number + '?text=' + encodeURIComponent(text);
    const open = document.createElement('a');
    open.href = url; open.target = '_blank'; open.rel = 'noopener noreferrer';
    document.body.appendChild(open); open.click(); open.remove();

    formStatus.classList.add('is-ok');
    formStatus.textContent = 'Opening WhatsApp with your enquiry. Press Send there to deliver it.';
    const again = document.createElement('a');
    again.href = url; again.target = '_blank'; again.rel = 'noopener noreferrer';
    again.className = 'form__retry'; again.textContent = 'Open WhatsApp again';
    formStatus.appendChild(again);
    form.reset();
    controls.forEach((c) => c.removeAttribute('aria-invalid'));
  });
})();

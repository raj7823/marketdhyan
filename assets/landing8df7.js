// marketdhyan landing: language switch, TradingView strips, join form -> Razorpay -> thank-you + WhatsApp.
(function () {
  var KEY = 'md-lang-v2';
  var hi = function () { return document.documentElement.lang === 'hi'; };

  // ---------- English / Hindi (Hindi text lives in data-hi) ----------
  function setLang(lang, save) {
    document.querySelectorAll('[data-hi]').forEach(function (el) {
      if (!el.hasAttribute('data-en')) el.setAttribute('data-en', el.innerHTML);
      el.innerHTML = lang === 'hi' ? el.getAttribute('data-hi') : el.getAttribute('data-en');
    });
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-set-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.setLang === lang ? 'true' : 'false'); });
    if (save) try { localStorage.setItem(KEY, lang); } catch (e) {}
    updateAmount();
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-set-lang]'); if (b) setLang(b.dataset.setLang, true); });

  // ---------- TradingView strips (free widgets; logo must stay; NSE data not available, BSE works) ----------
  var STOCKS = [['BSE:RELIANCE', 'Reliance'], ['BSE:TCS', 'TCS'], ['BSE:HDFCBANK', 'HDFC Bank'], ['BSE:INFY', 'Infosys'],
    ['BSE:ICICIBANK', 'ICICI Bank'], ['BSE:SBIN', 'SBI'], ['BSE:ITC', 'ITC'], ['BSE:LT', 'L&T']];
  var TOP = [['BSE:SENSEX', 'Sensex'], ['BSE:BSE100', 'BSE 100'], ['BSE:BSE500', 'BSE 500'], ['FX_IDC:USDINR', 'USD / INR'],
    ['TVC:GOLD', 'Gold (US$)'], ['TVC:USOIL', 'Crude oil (US$)']].concat(STOCKS.slice(0, 4));
  var sym = function (l) { return l.map(function (x) { return { proName: x[0], title: x[1] }; }); };
  var TV = { ticker: [sym(TOP), 'light'], stocks: [sym(STOCKS), 'dark'] };
  // load the price strips after the page itself has loaded, so they don't slow the first paint (strip height is reserved in CSS)
  var startTV = function () { document.querySelectorAll('[data-tv]').forEach(function (box) {
    var t = TV[box.dataset.tv]; if (!t) return;
    var s = document.createElement('script');
    s.src = '../s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    s.async = true;
    s.text = JSON.stringify({ symbols: t[0], colorTheme: t[1], isTransparent: true, showSymbolLogo: true, displayMode: 'adaptive', locale: 'en' });
    box.appendChild(s);
  }); };
  if (document.readyState === 'complete') startTV(); else window.addEventListener('load', startTV);

  // ---------- Join form ----------
  var form = document.getElementById('payForm');
  var amtEl = document.getElementById('payAmt');
  var inr = function (n) { return '₹' + Number(n).toLocaleString('en-IN'); };
  function updateAmount() {
    if (!form || !amtEl) return;
    var p = form.plan && window.MD_PLANS[form.plan.value];
    amtEl.textContent = p && p.price ? '· ' + inr(p.price) : '';
  }
  // field rules + messages [English, Hindi]
  var MSG = {
    name: { empty: ['Please enter your full name', 'कृपया अपना पूरा नाम लिखें'], bad: ['Please enter at least 2 letters', 'कम से कम 2 अक्षर लिखें'] },
    mobile: { empty: ['Please enter your mobile number', 'कृपया अपना मोबाइल नंबर लिखें'], bad: ['Enter a 10-digit number starting with 6, 7, 8 or 9', '6, 7, 8 या 9 से शुरू होने वाला 10 अंकों का नंबर लिखें'] },
    email: { empty: ['Please enter your email (your receipt comes here)', 'कृपया ईमेल लिखें (रसीद इसी पर आएगी)'], bad: ['Enter a valid email, like name@gmail.com', 'सही ईमेल लिखें, जैसे name@gmail.com'] },
    agree_terms: { empty: ['Please tick this box to agree before paying', 'पेमेंट से पहले इस बॉक्स पर टिक करें'] }
  };
  // +91, leading 0, spaces and dashes removed: "+91 98765-43210" -> "9876543210"
  var cleanMobile = function (v) {
    v = String(v).replace(/\D/g, '');
    if (v.length > 10 && v.indexOf('91') === 0) v = v.slice(2);
    if (v.length > 10 && v.charAt(0) === '0') v = v.slice(1);
    return v.slice(0, 10);
  };
  var TYPO = { 'gmial.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gnail.com': 'gmail.com',
    'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.in': 'gmail.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com',
    'yahoo.co': 'yahoo.com', 'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.co': 'outlook.com',
    'redifmail.com': 'rediffmail.com', 'rediffmail.co': 'rediffmail.com', 'icloud.co': 'icloud.com' };
  function rule(f, name) {
    var el = f.elements[name];
    if (el.type === 'checkbox') return el.checked ? '' : 'empty';
    var v = el.value.trim();
    if (!v) return 'empty';
    if (name === 'name') return (v.match(/\p{L}/gu) || []).length >= 2 ? '' : 'bad';
    if (name === 'mobile') return /^[6-9]\d{9}$/.test(cleanMobile(v)) ? '' : 'bad';
    if (name === 'email') return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? '' : 'bad';
    return '';
  }
  function markField(f, name, key) {
    var el = f.elements[name], box = el.closest('.field') || el.closest('.tick'), err = document.getElementById('err-' + name);
    var m = key && MSG[name] && (MSG[name][key] || MSG[name].empty);
    (el.type === 'checkbox' ? box : el).classList.toggle('bad', !!key);
    if (box) box.classList.toggle('ok', !key && el.type !== 'checkbox' && !!el.value.trim());
    el.setAttribute('aria-invalid', key ? 'true' : 'false');
    if (err) err.textContent = m ? (hi() ? m[1] : m[0]) : '';
    return !key;
  }

  if (form) {
    var FIELDS = ['name', 'mobile', 'email', 'agree_terms'];
    var errEl = document.getElementById('payErr'), btn = document.getElementById('payBtn'), btnLabel = btn.innerHTML;
    var S = window.MD_SITE || {};
    var say = function (en, h) { errEl.textContent = hi() ? h : en; };
    var busy = function (on) {
      btn.disabled = on; btn.classList.toggle('is-busy', on);
      if (on) btn.textContent = hi() ? 'प्रोसेस हो रहा है…' : 'Processing…'; else { btn.innerHTML = btnLabel; updateAmount(); }
    };
    // details survive a reload or a closed payment window (this tab only, never sent anywhere else)
    var save = function () { try { sessionStorage.setItem('md-form', JSON.stringify({ name: form.elements.name.value, mobile: form.elements.mobile.value, email: form.elements.email.value })); } catch (e) {} };
    try { var keep = JSON.parse(sessionStorage.getItem('md-form') || 'null'); if (keep) ['name', 'mobile', 'email'].forEach(function (n) { if (keep[n]) form.elements[n].value = keep[n]; }); } catch (e) {}

    // "gmial.com" -> offer "gmail.com"
    var hint = document.getElementById('emailHint');
    var suggestEmail = function () {
      var v = form.elements.email.value, at = v.lastIndexOf('@'), fix = at > 0 && TYPO[v.slice(at + 1).toLowerCase()];
      if (!hint) return;
      hint.hidden = !fix;
      if (fix) { hint.dataset.fix = v.slice(0, at + 1) + fix; hint.textContent = (hi() ? 'क्या आपका मतलब ' : 'Did you mean ') + hint.dataset.fix + '?'; }
    };
    if (hint) hint.addEventListener('click', function () { form.elements.email.value = hint.dataset.fix; hint.hidden = true; markField(form, 'email', rule(form, 'email')); save(); });

    // check each field when the person leaves it; once marked, re-check while typing so the red goes away as soon as it is right
    var touched = {};
    FIELDS.forEach(function (n) {
      var el = form.elements[n];
      el.addEventListener('blur', function () {
        if (n === 'mobile' && el.value) el.value = cleanMobile(el.value);
        if (n === 'email') { el.value = el.value.trim(); suggestEmail(); }
        if (el.type !== 'checkbox' && (el.value || touched[n])) { touched[n] = true; markField(form, n, rule(form, n)); }
      });
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () {
        if (n === 'mobile') { var d = el.value.replace(/\D/g, ''); el.value = d.length > 10 ? cleanMobile(d) : d; }
        if (touched[n] || el.type === 'checkbox') { touched[n] = true; markField(form, n, rule(form, n)); }
        save();
      });
    });

    // batch full / closed (plans.json "open": false)
    var plan0 = window.MD_PLANS[form.plan.value] || {};
    if (plan0.open === false) { btn.disabled = true; btn.textContent = hi() ? 'बैच फ़ुल — अगला बैच जल्द' : 'Batch full — next batch soon'; }

    // Cloudflare Turnstile "are you human" check — only when a site key is set in site.json
    var tsId = null;
    if (S.turnstile) {
      window.mdTurnstile = function () {
        var box = document.getElementById('cfBox'); box.hidden = false;
        tsId = window.turnstile.render(box, { sitekey: S.turnstile, theme: 'light', size: 'flexible' });
      };
      var ts = document.createElement('script');
      ts.src = '../challenges.cloudflare.com/turnstile/v0/b/f8df4d4a0cd6/api.js?render=explicit&amp;onload=mdTurnstile'; ts.async = true;
      document.head.appendChild(ts);
    }
    var tsToken = function () { return tsId !== null && window.turnstile ? window.turnstile.getResponse(tsId) || '' : ''; };
    var tsReset = function () { if (tsId !== null && window.turnstile) window.turnstile.reset(tsId); };

    var SERVER = {
      already_paid: ['This mobile number has already paid for this batch. Please message us on WhatsApp — we will add you.', 'इस मोबाइल नंबर से इस बैच का पेमेंट पहले ही हो चुका है। कृपया व्हाट्सऐप पर मैसेज करें — हम आपको जोड़ देंगे।'],
      batch_closed: ['This batch is full. The next batch will be announced soon.', 'यह बैच फ़ुल है। अगला बैच जल्द घोषित होगा।'],
      too_many: ['Too many tries. Please wait 10 minutes and try again.', 'बहुत बार कोशिश हुई। 10 मिनट बाद फिर कोशिश करें।'],
      human_check: ['Please complete the security check above the button.', 'कृपया बटन के ऊपर वाली सुरक्षा जाँच पूरी करें।'],
      offline: ['No internet connection. Please check your internet and try again.', 'इंटरनेट नहीं है। इंटरनेट जाँचकर फिर कोशिश करें।'],
      slow: ['The payment window did not open. Please check your internet and press the button again.', 'पेमेंट विंडो नहीं खुली। इंटरनेट जाँचकर फिर बटन दबाएँ।'],
      generic: ['Payment could not start right now. Please try again in a few minutes.', 'अभी पेमेंट शुरू नहीं हो सका। कृपया कुछ मिनट बाद फिर कोशिश करें।']
    };
    var sayKey = function (k) { var m = SERVER[k] || SERVER.generic; say(m[0], m[1]); };
    var fixRed = function () { say('Please correct the field marked in red.', 'कृपया लाल रंग वाली जानकारी ठीक करें।'); };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      say('', '');
      form.elements.mobile.value = cleanMobile(form.elements.mobile.value);
      var first = null;
      FIELDS.forEach(function (n) { touched[n] = true; if (!markField(form, n, rule(form, n)) && !first) first = form.elements[n]; });
      if (first) {
        fixRed();
        first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus({ preventScroll: true });
        return;
      }
      var planId = form.plan.value, plan = window.MD_PLANS[planId];
      if (!plan || plan.open === false) { sayKey('batch_closed'); return; }
      if (!plan.price) { say('Prices are not announced yet — payments open soon.', 'कीमतें अभी घोषित नहीं हुईं — पेमेंट जल्द शुरू होगा।'); return; }
      if (!S.payments_live) { say('Online payment is opening very soon. Please check back shortly.', 'ऑनलाइन पेमेंट बहुत जल्द शुरू होगा। कृपया थोड़ी देर बाद फिर देखें।'); return; }
      if (!navigator.onLine) { sayKey('offline'); return; }
      if (S.turnstile && !tsToken()) { sayKey('human_check'); return; }
      var data = { plan: planId, name: form.elements.name.value.trim(), mobile: form.elements.mobile.value, email: form.elements.email.value.trim(),
        agree_terms: form.elements.agree_terms.checked, cf_token: tsToken() };

      if (window.gtag) window.gtag('event', 'begin_checkout', { currency: 'INR', value: plan.price, items: [{ item_id: planId, item_name: plan.name }] });
      busy(true);
      fetch('https://marketdhyan.com/api/create-order.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            return r.ok && j.ok ? j : Promise.reject(j.error || (r.status === 429 ? 'too_many' : 'generic'));
          });
        })
        .then(function (o) { return loadCheckout().then(function () { openCheckout(o, data); }, function () { return Promise.reject('slow'); }); })
        .catch(function (code) {
          busy(false); tsReset();
          if (MSG[code]) { markField(form, code, 'bad'); form.elements[code].focus(); fixRed(); return; }
          sayKey(navigator.onLine ? code : 'offline');
        });
    });

    // Razorpay checkout script, with a 10-second limit so a slow network gets a clear message
    var loadCheckout = function () {
      return window.Razorpay ? Promise.resolve() : new Promise(function (ok, fail) {
        var s = document.createElement('script'), t = setTimeout(fail, 10000);
        s.src = '../checkout.razorpay.com/v1/checkout.js';
        s.onload = function () { clearTimeout(t); ok(); }; s.onerror = function () { clearTimeout(t); fail(); };
        document.head.appendChild(s);
      });
    };

    var openCheckout = function (o, data) {
      var rzp = new window.Razorpay({
        key: o.key_id, order_id: o.order_id, amount: o.amount, currency: 'INR',
        name: 'marketdhyan', description: o.plan_name + ' membership (education)',
        prefill: { name: data.name, email: data.email, contact: '+91' + data.mobile },
        notes: { plan: data.plan },
        theme: { color: '#12b76a' },
        modal: { ondismiss: function () { busy(false); say('Payment window closed. Your details are saved — press the button to try again.', 'पेमेंट विंडो बंद हो गई। आपकी जानकारी सेव है — फिर से बटन दबाएँ।'); } },
        handler: function (resp) {
          fetch('https://marketdhyan.com/api/verify.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resp) })
            .then(function (r) { return r.json(); })
            .then(function (v) {
              if (!v.ok) throw 0;
              // details for the thank-you page stay in this browser tab (never in the URL)
              try {
                sessionStorage.setItem('md-paid', JSON.stringify({ pid: resp.razorpay_payment_id, name: data.name, plan: o.plan_name, batch: (window.MD_PLANS[data.plan] || {}).batch || '', amount: o.amount / 100 }));
                sessionStorage.removeItem('md-form');
              } catch (e) {}
              location.href = 'thank-you.html';
            })
            .catch(function () { busy(false); say('Payment received but not confirmed yet. Please send your payment ID on WhatsApp: ' + resp.razorpay_payment_id, 'पेमेंट मिला पर पुष्टि नहीं हुई। कृपया यह पेमेंट ID व्हाट्सऐप पर भेजें: ' + resp.razorpay_payment_id); });
        }
      });
      rzp.on('payment.failed', function () { busy(false); say('Payment failed. No money was taken — please try again.', 'पेमेंट फ़ेल हुआ। कोई पैसा नहीं कटा — कृपया फिर कोशिश करें।'); });
      rzp.open();
    };
  }

  // ---------- Thank-you page: show payment ID, WhatsApp button with the message ready ----------
  var tk = document.getElementById('thanks');
  if (tk) {
    var paid = null;
    try { paid = JSON.parse(sessionStorage.getItem('md-paid')); } catch (e) {}
    var pidEl = document.getElementById('tkPid');
    var msg = function () {
      return paid
        ? 'Hello marketdhyan, I have paid ' + inr(paid.amount) + ' for ' + paid.plan + ' (' + paid.batch + ').\nName: ' + paid.name + '\nPayment ID: ' + paid.pid + '\nI am sending my payment screenshot. Please add me to the Telegram group.'
        : 'Hello marketdhyan, I have paid for the Inner Circle.\nName: \nPayment ID (from the Razorpay receipt): \nI am sending my payment screenshot.';
    };
    // GA4 counts each payment ID once, so a reload of this page is not a second sale
    if (paid && window.gtag) window.gtag('event', 'purchase', { transaction_id: paid.pid, currency: 'INR', value: paid.amount });
    if (paid) { pidEl.textContent = paid.pid; document.getElementById('tkHas').hidden = false; }
    else document.getElementById('tkNo').hidden = false;
    // wa.me opens the WhatsApp app on phones and WhatsApp Web on computers, straight into our chat
    var link = function (el, num, text, missing) {
      if (num) el.href = 'https://wa.me/' + num + (text ? '?text=' + encodeURIComponent(text) : '');
      else { el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); el.title = missing; }
    };
    var S = window.MD_SITE || {};
    link(document.getElementById('tkWa'), S.whatsapp, msg(), 'WhatsApp number will be added');
    link(document.getElementById('tkHelp'), S.helpline || S.whatsapp, 'Hello marketdhyan, I need help with my Inner Circle payment.', 'Helpline number will be added');
  }

  // ---------- Contact page: WhatsApp helpline + email buttons, message form -> api/contact.php ----------
  var SITE = window.MD_SITE || {};
  document.querySelectorAll('[data-wa]').forEach(function (el) {
    var num = SITE.helpline || SITE.whatsapp;
    if (num) el.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent('Hello marketdhyan, I need help with my Inner Circle payment.');
    else el.removeAttribute('target'); // no number yet: keep the plain link to the contact page
  });
  document.querySelectorAll('[data-mail]').forEach(function (el) {
    if (SITE.email) { el.href = 'mailto:' + SITE.email; el.removeAttribute('target'); }
    // no email yet: keeps its link to the contact page / form
  });
  var cf = document.getElementById('contactForm');
  if (cf) {
    var cfMsg = document.getElementById('cfMsg'), cfBtn = document.getElementById('cfBtn');
    var cfSay = function (en, h, good) { cfMsg.textContent = hi() ? h : en; cfMsg.classList.toggle('is-ok', !!good); };
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      cf.querySelectorAll('.bad').forEach(function (x) { x.classList.remove('bad'); });
      var bad = null;
      ['name', 'mobile', 'email', 'message'].forEach(function (n) { var el = cf.elements[n]; if (!el.checkValidity()) { el.classList.add('bad'); bad = bad || el; } });
      if (bad) { cfSay('Please fill in all fields correctly.', 'कृपया सभी जानकारी सही भरें।'); bad.focus(); return; }
      var data = {};
      ['name', 'mobile', 'email', 'topic', 'message', 'website'].forEach(function (n) { data[n] = cf.elements[n].value.trim(); });
      cfBtn.disabled = true; cfSay('Sending…', 'भेजा जा रहा है…');
      fetch('https://marketdhyan.com/api/contact.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function () { cf.reset(); cfSay('Thank you! Your message has reached us. We will reply soon.', 'धन्यवाद! आपका मैसेज हमें मिल गया है। हम जल्द जवाब देंगे।', true); })
        .catch(function (code) {
          cfSay(code === 429 ? 'Too many messages. Please try again later or use WhatsApp.' : 'Message could not be sent. Please use the WhatsApp helpline.',
            code === 429 ? 'बहुत सारे मैसेज। थोड़ी देर बाद कोशिश करें या व्हाट्सऐप करें।' : 'मैसेज नहीं भेजा जा सका। कृपया व्हाट्सऐप हेल्पलाइन इस्तेमाल करें।');
        })
        .then(function () { cfBtn.disabled = false; });
    });
  }

  // ---------- Hero heading: good word / bad word pairs rotate (page HTML keeps "focus / emotion" for Google) ----------
  var ROT = {
    en: [['focus', 'emotion'], ['patience', 'greed'], ['discipline', 'impulse'], ['logic', 'fear']],
    hi: [['ध्यान', 'भावना'], ['धैर्य', 'लालच'], ['अनुशासन', 'जल्दबाज़ी'], ['समझ', 'डर']]
  };
  var rotH = document.querySelector('.rot-h');
  if (rotH && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var rotI = 0;
    var swap = function (el, word, delay) {
      setTimeout(function () {
        el.classList.add('is-out');
        setTimeout(function () {
          el.textContent = word;
          el.classList.remove('is-out'); el.classList.add('is-in');
          void el.offsetWidth; // restart the slide-in from below
          el.classList.remove('is-in');
        }, 320);
      }, delay);
    };
    // reserve the height of the tallest pair so the text below never jumps
    var fitHeight = function () {
      var lang = hi() ? 'hi' : 'en', g = rotH.querySelector('.rot--good'), b = rotH.querySelector('.rot--bad');
      if (!g || !b) return;
      var keep = [g.textContent, b.textContent], max = 0;
      rotH.style.minHeight = '';
      ROT[lang].forEach(function (p) { g.textContent = p[0]; b.textContent = p[1]; max = Math.max(max, rotH.offsetHeight); });
      g.textContent = keep[0]; b.textContent = keep[1];
      rotH.style.minHeight = max + 'px';
    };
    var tick = function () {
      if (document.hidden) return;
      var lang = hi() ? 'hi' : 'en', g = rotH.querySelector('.rot--good'), b = rotH.querySelector('.rot--bad');
      if (!g || !b) return;
      rotI = (rotI + 1) % ROT[lang].length;
      swap(g, ROT[lang][rotI][0], 0);
      swap(b, ROT[lang][rotI][1], 140);
    };
    // start soon even if web fonts are slow; re-measure once they arrive (font size changes the height)
    var started = false, startRot = function () { fitHeight(); if (!started) { started = true; setInterval(tick, 2800); } };
    setTimeout(startRot, 1500);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(startRot);
    window.addEventListener('resize', fitHeight);
    // language switch rewrites the heading: start the new language from its first pair
    document.addEventListener('click', function (e) { if (e.target.closest('[data-set-lang]')) { rotI = 0; setTimeout(fitHeight, 0); } });
  }

  // ---------- Footer: big wordmark rises in when the footer comes into view ----------
  var mark = document.querySelector('.foot__mark');
  if (mark && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en, ob) { en.forEach(function (x) { if (x.isIntersecting) { mark.classList.add('is-in'); ob.disconnect(); } }); }, { threshold: 0.2 }).observe(mark);
  } else if (mark) mark.classList.add('is-in');

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  setLang(saved === 'hi' ? 'hi' : 'en');
})();

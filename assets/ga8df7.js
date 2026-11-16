// Google Analytics 4. Loaded only when site.json has "ga4_id" (the build adds <script src="assets/ga.js" data-id="G-…">).
// Kept in a file, not inline, because the site's CSP allows no inline scripts. No name/email/mobile is ever sent.
(function () {
  var id = document.currentScript && document.currentScript.dataset.id;
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
})();

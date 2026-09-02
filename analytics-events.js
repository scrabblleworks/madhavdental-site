// Madhav Dental Clinic — lightweight CTA event tracking
// Safe when Google Analytics / GTM is not installed.
(function () {
  'use strict';

  function track(name, link) {
    var detail = {
      event: name,
      page: window.location.pathname,
      href: link && link.href ? link.href : ''
    };

    // Google Analytics 4, when gtag is present.
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, {
        page_location: window.location.href,
        link_url: detail.href
      });
    }

    // Also expose the event to GTM/dataLayer if it is installed later.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(detail);
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[data-track]');
    if (!link) return;
    var name = link.getAttribute('data-track');
    if (name) track(name, link);
  }, false);
})();

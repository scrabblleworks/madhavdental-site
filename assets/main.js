document.addEventListener('DOMContentLoaded', () => {

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    const closeMenu = () => {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 850) closeMenu();
    });
  }

  // Treatments dropdown (desktop hover + click/keyboard, mobile accordion)
  const dropdownItems = [...document.querySelectorAll('.nav-item.has-dropdown')];
  const closeAllDropdowns = () => {
    dropdownItems.forEach(item => {
      item.classList.remove('open');
      const t = item.querySelector('.nav-dropdown-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  };
  dropdownItems.forEach(item => {
    const dToggle = item.querySelector('.nav-dropdown-toggle');
    if (!dToggle) return;
    let closeTimer;
    const openDrop = () => {
      clearTimeout(closeTimer);
      item.classList.add('open');
      dToggle.setAttribute('aria-expanded', 'true');
    };
    const closeDrop = () => {
      item.classList.remove('open');
      dToggle.setAttribute('aria-expanded', 'false');
    };
    const scheduleClose = () => { closeTimer = setTimeout(closeDrop, 220); };

    dToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const navLinksEl = document.querySelector('.nav-links');
      let visualOffset = 0;
      if (navLinksEl) visualOffset = item.offsetTop - navLinksEl.scrollTop;
      const wasOpen = item.classList.contains('open');
      wasOpen ? closeDrop() : openDrop();
      // Some mobile browsers auto-scroll the focused/tapped element into view,
      // which can shove the trigger itself off-screen once the panel grows taller,
      // making the dropdown look like it opened upward. Re-pin its visual position.
      if (navLinksEl && !wasOpen) {
        const rePin = () => { navLinksEl.scrollTop = item.offsetTop - visualOffset; };
        requestAnimationFrame(() => requestAnimationFrame(rePin));
        setTimeout(rePin, 80);
      }
    });
    item.addEventListener('mouseenter', () => { if (window.innerWidth > 850) openDrop(); });
    item.addEventListener('mouseleave', () => { if (window.innerWidth > 850) scheduleClose(); });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeDrop(); dToggle.focus(); }
    });
  });
  document.addEventListener('click', (e) => {
    dropdownItems.forEach(item => {
      if (!item.contains(e.target)) {
        item.classList.remove('open');
        const t = item.querySelector('.nav-dropdown-toggle');
        if (t) t.setAttribute('aria-expanded', 'false');
      }
    });
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 850) closeAllDropdowns(); });

  // Hero image carousel (crossfade, dots, autoplay, swipe)
  const heroEl = document.querySelector('.hero');
  const heroSlides = [...document.querySelectorAll('.hero-slide')];
  const heroDotsWrap = document.querySelector('.hero-dots');
  if (heroEl && heroSlides.length > 1 && heroDotsWrap) {
    let hi = 0;
    let heroTimer;

    heroSlides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show photo ' + (i + 1));
      b.addEventListener('click', () => { hi = i; renderHero(); restartHero(); });
      heroDotsWrap.appendChild(b);
    });

    const renderHero = () => {
      heroSlides.forEach((s, i) => s.classList.toggle('active', i === hi));
      [...heroDotsWrap.children].forEach((b, i) => b.classList.toggle('active', i === hi));
    };
    const goHero = d => { hi = (hi + d + heroSlides.length) % heroSlides.length; renderHero(); };
    const restartHero = () => { clearInterval(heroTimer); heroTimer = setInterval(() => goHero(1), 5000); };

    renderHero();
    restartHero();

    heroEl.addEventListener('mouseenter', () => clearInterval(heroTimer));
    heroEl.addEventListener('mouseleave', restartHero);

    let touchX = null;
    heroEl.addEventListener('touchstart', e => {
      touchX = e.touches[0].clientX;
      clearInterval(heroTimer);
    }, { passive: true });
    heroEl.addEventListener('touchend', e => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) goHero(dx < 0 ? 1 : -1);
      touchX = null;
      restartHero();
    }, { passive: true });
  }

});

document.addEventListener('DOMContentLoaded', () => {

  // Quick Help panel
  const qhLauncher = document.getElementById('qh-launcher');
  const qhPanel = document.getElementById('qh-panel');
  const qhBackdrop = document.getElementById('qh-backdrop');
  const qhClose = document.getElementById('qh-close');

  if (qhLauncher && qhPanel) {
    const openQH = () => {
      document.body.classList.add('qh-open');
      qhLauncher.setAttribute('aria-expanded', 'true');
    };
    const closeQH = () => {
      document.body.classList.remove('qh-open');
      qhLauncher.setAttribute('aria-expanded', 'false');
      qhPanel.querySelectorAll('.qh-item.open').forEach(item => item.classList.remove('open'));
    };
    qhLauncher.addEventListener('click', () => {
      document.body.classList.contains('qh-open') ? closeQH() : openQH();
    });
    if (qhClose) qhClose.addEventListener('click', closeQH);
    if (qhBackdrop) qhBackdrop.addEventListener('click', closeQH);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('qh-open')) closeQH();
    });
    document.addEventListener('click', (e) => {
      if (!document.body.classList.contains('qh-open')) return;
      if (qhPanel.contains(e.target) || qhLauncher.contains(e.target)) return;
      closeQH();
    });

    // Accordion rows (Treatments, Common Questions)
    qhPanel.querySelectorAll('.qh-item.qh-accordion > .qh-row').forEach(row => {
      row.addEventListener('click', () => {
        row.closest('.qh-item').classList.toggle('open');
      });
    });

    // Swipe-down to dismiss (mobile bottom sheet)
    let qhTouchY = null;
    qhPanel.addEventListener('touchstart', (e) => {
      qhTouchY = e.touches[0].clientY;
    }, { passive: true });
    qhPanel.addEventListener('touchend', (e) => {
      if (qhTouchY === null) return;
      const dy = e.changedTouches[0].clientY - qhTouchY;
      if (dy > 70) closeQH();
      qhTouchY = null;
    }, { passive: true });
  }

});

document.addEventListener('DOMContentLoaded', () => {

  // Quick Help: Ask Dr. Priti a Question (free-text -> WhatsApp)
  const qhAskText = document.getElementById('qh-ask-text');
  const qhAskSend = document.getElementById('qh-ask-send');
  const qhAskWarn = document.getElementById('qh-ask-warn');

  if (qhAskText && qhAskSend) {
    qhAskSend.addEventListener('click', (e) => {
      const val = qhAskText.value.trim();
      if (!val) {
        e.preventDefault();
        if (qhAskWarn) qhAskWarn.hidden = false;
        qhAskText.focus();
        return;
      }
      if (qhAskWarn) qhAskWarn.hidden = true;
      const msg = "Hi, I have a question for Dr. Priti at Madhav Dental Clinic: " + val;
      qhAskSend.href = 'https://wa.me/918527367666?text=' + encodeURIComponent(msg);
      // href is set synchronously before the browser follows the link, so navigation opens with this message.
    });
    qhAskText.addEventListener('input', () => {
      if (qhAskWarn && !qhAskWarn.hidden && qhAskText.value.trim()) qhAskWarn.hidden = true;
    });
  }

});

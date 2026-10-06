(() => {
  const menu = document.querySelector('.mobile-nav');
  const toggle = document.querySelector('.menu-icon');

  if (!menu || !toggle) {
    return;
  }

  const closeLink = menu.querySelector('.mobile-close');

  function setMenuOpen(isOpen) {
    menu.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('mobile-menu-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));

    if (!isOpen && window.location.hash === `#${menu.id}`) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  }

  toggle.setAttribute('aria-controls', menu.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', (event) => {
    event.preventDefault();
    setMenuOpen(!menu.classList.contains('is-open'));
  });

  if (closeLink) {
    closeLink.addEventListener('click', (event) => {
      event.preventDefault();
      setMenuOpen(false);
    });
  }

  menu.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link && link !== closeLink) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      setMenuOpen(false);
    }
  });
})();

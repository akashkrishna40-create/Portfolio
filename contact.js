(() => {
  const form = document.getElementById('contact-form');
  const toggle = document.getElementById('contact-form-toggle');
  if (!form) return;

  const status = document.getElementById('contact-status');
  const submit = form.querySelector('[type="submit"]');
  const name = form.elements.namedItem('name');
  const message = form.elements.namedItem('message');

  // Keep the existing contact layout until the visitor chooses Email me.
  if (toggle) {
    form.hidden = location.hash !== '#contact-form';
    toggle.setAttribute('aria-expanded', String(!form.hidden));
    toggle.addEventListener('click', event => {
      event.preventDefault();
      form.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      form.scrollIntoView({ behavior: 'instant', block: 'start' });
      name.focus({ preventScroll: true });
    });
    window.addEventListener('hashchange', () => {
      if (location.hash === '#contact-form') {
        form.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  }

  for (const field of [name, message]) {
    field.addEventListener('input', () => field.setCustomValidity(''));
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    status.textContent = '';
    for (const field of [name, message]) {
      field.setCustomValidity(field.value.trim() ? '' : 'Please fill out this field.');
    }
    if (!form.reportValidity()) return;

    const endpoint = new URL(form.action);
    if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'formspree.io' ||
        !/^\/f\/[a-zA-Z0-9]+$/.test(endpoint.pathname)) {
      status.textContent = 'The contact form is not available yet. Please connect through LinkedIn.';
      return;
    }

    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your message…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint.href, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Submission failed');
      form.reset();
      status.textContent = 'Thank you! Your message has been sent.';
    } catch {
      status.textContent = 'Your message could not be sent. Please try again or connect through LinkedIn.';
    } finally {
      clearTimeout(timeout);
      submit.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
})();

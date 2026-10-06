(() => {
  'use strict';

  const cartStorageKey = 'rx-cloths-cart';
  const pendingStorageKey = 'rx-pending-payment';
  const sdkPromises = new Map();
  let quoteIsReady = false;

  const overlay = document.createElement('section');
  overlay.className = 'checkout-overlay';
  overlay.hidden = true;
  overlay.setAttribute('aria-label', 'Checkout');
  overlay.innerHTML = `
    <div class="checkout-panel" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div class="checkout-heading">
        <h2 id="checkout-title">Checkout</h2>
        <button class="checkout-close" type="button" aria-label="Close checkout">×</button>
      </div>
      <form class="checkout-form" novalidate>
        <section>
          <h3>Customer Details</h3>
          <div class="checkout-fields">
            <label>Name<input name="name" autocomplete="name" maxlength="100" required></label>
            <label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required></label>
            <label>Phone<input name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" pattern="[0-9+() -]{10,16}" required></label>
            <label>Delivery Address<input name="address" autocomplete="street-address" maxlength="200" required></label>
            <label>City<input name="city" autocomplete="address-level2" maxlength="80" required></label>
            <label>State<input name="state" autocomplete="address-level1" maxlength="80" required></label>
            <label>PIN Code<input name="pincode" inputmode="numeric" autocomplete="postal-code" pattern="[0-9]{6}" maxlength="6" required></label>
          </div>
        </section>
        <section class="checkout-summary" aria-live="polite">
          <h3>Order Summary</h3>
          <div class="checkout-summary-items" data-checkout-items></div>
          <div class="checkout-totals">
            <div class="checkout-total-row"><span>Subtotal</span><strong data-checkout-subtotal>Checking prices...</strong></div>
            <div class="checkout-total-row"><span>Shipping</span><strong data-checkout-shipping>--</strong></div>
            <div class="checkout-total-row"><span>Total</span><strong data-checkout-total>--</strong></div>
          </div>
        </section>
        <fieldset class="checkout-gateways">
          <legend>Payment Gateway</legend>
          <label><input type="radio" name="gateway" value="cashfree" checked> Cashfree</label>
          <label><input type="radio" name="gateway" value="razorpay"> Razorpay</label>
        </fieldset>
        <p class="checkout-status" role="status" aria-live="polite"></p>
        <div class="checkout-actions">
          <button class="btn btn-blue" type="submit">Continue to Payment</button>
          <button class="outline-btn" data-check-payment type="button" hidden>Check Payment Status</button>
        </div>
      </form>
      <section class="checkout-confirmation" data-checkout-confirmation hidden>
        <p class="checkout-confirmation-mark">✓ Order Confirmed</p>
        <div class="checkout-confirmation-details" data-confirmation-details></div>
        <button class="btn btn-blue" data-confirmation-close type="button">Continue Shopping</button>
      </section>
    </div>`;
  document.body.appendChild(overlay);

  const form = overlay.querySelector('.checkout-form');
  const status = overlay.querySelector('.checkout-status');
  const submitButton = form.querySelector('button[type="submit"]');
  const checkPaymentButton = overlay.querySelector('[data-check-payment]');
  const confirmation = overlay.querySelector('[data-checkout-confirmation]');

  function formatPaise(value) {
    return `₹${(value / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function getCartItems() {
    let cart;
    try {
      cart = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
    } catch (error) {
      cart = [];
    }
    if (!Array.isArray(cart)) {
      return [];
    }
    return cart.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      size: item.size
    }));
  }

  async function callPaymentApi(payload) {
    const endpoints = {
      quote: '/api/quote-order',
      create: {
        cashfree: '/api/create-cashfree-order',
        razorpay: '/api/create-razorpay-order'
      },
      verify: {
        cashfree: '/api/verify-cashfree-payment',
        razorpay: '/api/verify-razorpay-payment'
      }
    };
    const endpoint = payload.action === 'quote'
      ? endpoints.quote
      : endpoints[payload.action] && endpoints[payload.action][payload.gateway];
    if (!endpoint) {
      throw new Error('Choose a valid payment option and retry.');
    }

    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('RX CLOTHS payment API network failure:', endpoint, error);
      throw new Error('Could not reach checkout. Please use the Vercel app or run it with Vercel Dev.');
    }
    const contentType = response.headers.get('content-type') || '';
    let result;
    try {
      result = await response.json();
    } catch (error) {
      console.error('RX CLOTHS payment API returned a non-JSON response:', {
        endpoint,
        status: response.status,
        contentType
      });
      if (response.status === 404) {
        throw new Error('Payment API route not found. Deploy the Vercel API routes and open the Vercel site; VS Code Live Server cannot run checkout APIs.');
      }
      throw new Error(`Checkout API returned HTTP ${response.status} without JSON. Check the Vercel function deployment and logs.`);
    }
    if (response.status === 404) {
      console.error('RX CLOTHS payment API route was not found:', endpoint);
      throw new Error('Payment API route not found. Deploy the Vercel API routes and open the Vercel site; VS Code Live Server cannot run checkout APIs.');
    }
    if (!response.ok) {
      console.error('RX CLOTHS payment API request failed:', endpoint, response.status, result.error || 'No safe error detail returned');
      throw new Error(result.error || `Checkout API returned HTTP ${response.status}. Check the Vercel function logs.`);
    }
    return result;
  }

  function setStatus(message, state) {
    status.textContent = message || '';
    status.dataset.state = state || 'error';
  }

  function setBusy(isBusy) {
    submitButton.disabled = isBusy;
    submitButton.textContent = isBusy ? 'Please wait...' : 'Continue to Payment';
  }

  function addSummaryLine(container, text, amount) {
    const row = document.createElement('div');
    row.className = 'checkout-summary-item';
    const description = document.createElement('span');
    description.textContent = text;
    const price = document.createElement('strong');
    price.textContent = formatPaise(amount);
    row.append(description, price);
    container.appendChild(row);
  }

  function renderQuote(quote) {
    const items = overlay.querySelector('[data-checkout-items]');
    items.replaceChildren();
    quote.items.forEach((item) => {
      addSummaryLine(items, `${item.name} · ${item.size} · Qty ${item.quantity}`, item.line_total_paise);
    });
    overlay.querySelector('[data-checkout-subtotal]').textContent = formatPaise(quote.subtotalPaise);
    overlay.querySelector('[data-checkout-shipping]').textContent = quote.shippingPaise === 0
      ? 'Free'
      : formatPaise(quote.shippingPaise);
    overlay.querySelector('[data-checkout-total]').textContent = formatPaise(quote.totalPaise);
    quoteIsReady = true;
  }

  async function refreshQuote() {
    quoteIsReady = false;
    overlay.querySelector('[data-checkout-items]').replaceChildren();
    overlay.querySelector('[data-checkout-subtotal]').textContent = 'Checking prices...';
    overlay.querySelector('[data-checkout-shipping]').textContent = '--';
    overlay.querySelector('[data-checkout-total]').textContent = '--';
    try {
      const result = await callPaymentApi({ action: 'quote', items: getCartItems() });
      renderQuote(result.quote);
      setStatus('', '');
    } catch (error) {
      setStatus(error.message);
      overlay.querySelector('[data-checkout-subtotal]').textContent = '--';
    }
  }

  function openCheckout() {
    if (window.location.hash === '#cart-drawer') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
    overlay.hidden = false;
    document.body.classList.add('checkout-open');
    confirmation.hidden = true;
    form.hidden = false;
    overlay.querySelector('#checkout-title').textContent = 'Checkout';
    checkPaymentButton.hidden = true;
    setStatus('', '');
    refreshQuote();
  }

  function closeCheckout() {
    overlay.hidden = true;
    document.body.classList.remove('checkout-open');
  }

  function ensureSdk(url, globalName) {
    if (window[globalName]) {
      return Promise.resolve(window[globalName]);
    }
    if (sdkPromises.has(globalName)) {
      return sdkPromises.get(globalName);
    }
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => window[globalName]
        ? resolve(window[globalName])
        : reject(new Error('The payment checkout library did not initialize.'));
      script.onerror = () => reject(new Error('Could not load the payment checkout. Check your connection and retry.'));
      document.head.appendChild(script);
    });
    sdkPromises.set(globalName, promise);
    return promise;
  }

  function savePendingPayment(value) {
    sessionStorage.setItem(pendingStorageKey, JSON.stringify(value));
  }

  function readPendingPayment() {
    try {
      return JSON.parse(sessionStorage.getItem(pendingStorageKey) || 'null');
    } catch (error) {
      return null;
    }
  }

  function customerDetails() {
    const values = new FormData(form);
    return {
      name: values.get('name').trim(),
      email: values.get('email').trim(),
      phone: values.get('phone').trim(),
      address: values.get('address').trim(),
      city: values.get('city').trim(),
      state: values.get('state').trim(),
      pincode: values.get('pincode').trim()
    };
  }

  function renderConfirmation(order) {
    const details = overlay.querySelector('[data-confirmation-details]');
    details.replaceChildren();
    const addDetail = (label, value) => {
      const paragraph = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = `${label}: `;
      paragraph.append(strong, document.createTextNode(value));
      details.appendChild(paragraph);
    };

    addDetail('Order ID', order.orderId);
    addDetail('Customer Name', order.customerName);
    const itemsHeading = document.createElement('h3');
    itemsHeading.textContent = 'Items';
    details.appendChild(itemsHeading);
    const items = document.createElement('ul');
    order.items.forEach((item) => {
      const line = document.createElement('li');
      line.textContent = `${item.name} · ${item.size} · Qty ${item.quantity}`;
      items.appendChild(line);
    });
    details.appendChild(items);
    addDetail('Total Paid', formatPaise(order.totalPaidPaise));
    addDetail('Payment Gateway', order.gateway === 'cashfree' ? 'Cashfree' : 'Razorpay');
    addDetail('Payment Status', 'Paid');

    localStorage.removeItem(cartStorageKey);
    document.querySelectorAll('.cart-link b, .bag-circle').forEach((element) => {
      element.textContent = '0';
    });
    window.dispatchEvent(new Event('rx-cart-clear'));
    sessionStorage.removeItem(pendingStorageKey);
    form.hidden = true;
    confirmation.hidden = false;
    overlay.querySelector('#checkout-title').textContent = 'Order Confirmed';
    setStatus('', 'success');
  }

  async function verifyPendingPayment() {
    const pending = readPendingPayment();
    if (!pending || !pending.confirmationToken || !pending.gateway) {
      setStatus('No verifiable payment session was found in this browser. Please contact Support if you completed a payment.');
      return;
    }
    checkPaymentButton.disabled = true;
    checkPaymentButton.textContent = 'Checking...';
    try {
      const result = await callPaymentApi({
        action: 'verify',
        gateway: pending.gateway,
        confirmationToken: pending.confirmationToken,
        ...(pending.providerPayload || {})
      });
      if (result.status === 'PAID' && result.order) {
        renderConfirmation(result.order);
        return;
      }
      if (result.status === 'FAILED') {
        setStatus('Payment failed. Your order is not marked paid. You can retry with either gateway.');
        checkPaymentButton.hidden = true;
      } else if (result.status === 'CANCELLED') {
        setStatus('Payment was cancelled. Your order is not marked paid. You can retry with either gateway.');
        checkPaymentButton.hidden = true;
      } else {
        setStatus('Payment is still pending with the gateway. Check again shortly; the order is not marked paid.');
        checkPaymentButton.hidden = false;
      }
    } catch (error) {
      setStatus(error.message);
      checkPaymentButton.hidden = false;
    } finally {
      checkPaymentButton.disabled = false;
      checkPaymentButton.textContent = 'Check Payment Status';
    }
  }

  async function startCashfreePayment(order) {
    savePendingPayment({
      gateway: 'cashfree',
      confirmationToken: order.confirmationToken
    });
    const Cashfree = await ensureSdk('https://sdk.cashfree.com/js/v3/cashfree.js', 'Cashfree');
    const cashfree = Cashfree({ mode: order.environment });
    const result = await cashfree.checkout({
      paymentSessionId: order.paymentSessionId,
      redirectTarget: '_self'
    });
    if (result && result.error) {
      setStatus('Cashfree checkout closed or could not start. Verify the status or retry payment.');
      checkPaymentButton.hidden = false;
    }
  }

  async function startRazorpayPayment(order, customer) {
    const Razorpay = await ensureSdk('https://checkout.razorpay.com/v1/checkout.js', 'Razorpay');
    const pending = {
      gateway: 'razorpay',
      confirmationToken: order.confirmationToken,
      providerPayload: null
    };
    savePendingPayment(pending);

    const checkout = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'RX CLOTHS',
      description: 'RX CLOTHS order',
      order_id: order.orderId,
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: `+91${customer.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')}`
      },
      theme: { color: '#2864e8' },
      modal: {
        ondismiss: () => {
          setStatus('Payment checkout was closed. Your order remains unpaid; you can retry with either gateway.');
          checkPaymentButton.hidden = false;
        }
      },
      handler: async (response) => {
        pending.providerPayload = {
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature
        };
        savePendingPayment(pending);
        await verifyPendingPayment();
      }
    });

    checkout.on('payment.failed', async (event) => {
      const paymentId = event && event.error && event.error.metadata && event.error.metadata.payment_id;
      pending.providerPayload = paymentId ? { paymentId } : null;
      savePendingPayment(pending);
      if (paymentId) {
        await verifyPendingPayment();
      } else {
        setStatus('Payment failed. Your order is not marked paid. You can retry with either gateway.');
        checkPaymentButton.hidden = false;
      }
    });
    checkout.open();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('', '');
    checkPaymentButton.hidden = true;

    if (!form.reportValidity()) {
      return;
    }
    if (!quoteIsReady) {
      await refreshQuote();
      if (!quoteIsReady) {
        return;
      }
    }

    setBusy(true);
    try {
      const gateway = new FormData(form).get('gateway');
      const customer = customerDetails();
      const order = await callPaymentApi({
        action: 'create',
        gateway,
        items: getCartItems(),
        customer
      });
      if (gateway === 'cashfree') {
        await startCashfreePayment(order);
      } else {
        await startRazorpayPayment(order, customer);
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('.checkout-start')) {
      openCheckout();
    }
  });

  overlay.querySelector('.checkout-close').addEventListener('click', closeCheckout);
  overlay.querySelector('[data-confirmation-close]').addEventListener('click', closeCheckout);
  checkPaymentButton.addEventListener('click', verifyPendingPayment);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeCheckout();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !overlay.hidden) {
      closeCheckout();
    }
  });

  const returnUrl = new URL(window.location.href);
  if (returnUrl.searchParams.get('payment_return') === 'cashfree') {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
    openCheckout();
    const pending = readPendingPayment();
    if (pending && pending.gateway === 'cashfree') {
      setStatus('Checking Cashfree payment status...', 'success');
      verifyPendingPayment();
    } else {
      setStatus('Cashfree returned to the site, but this browser has no matching checkout session. Contact Support before retrying.');
    }
  }
})();

'use strict';

const crypto = require('node:crypto');

const CASHFREE_API_VERSION = '2025-01-01';
const FREE_SHIPPING_THRESHOLD_PAISE = 200000;
const PAYMENT_TOKEN_LIFETIME_MS = 6 * 60 * 60 * 1000;
const PRODUCTS = {
  'image-men-20cloth-abstract-shirt-png': { name: 'Abstract Shirt', image: 'image/men%20cloth/Abstract Shirt.png', pricePaise: 18000 },
  'image-men-20cloth-black-pullover-hoodie-png': { name: 'Black Pullover Hoodie', image: 'image/men%20cloth/Black Pullover Hoodie.png', pricePaise: 22000 },
  'image-men-20cloth-cargo-pants-png': { name: 'Cargo Pants', image: 'image/men%20cloth/Cargo Pants.png', pricePaise: 32000 },
  'image-men-20cloth-cream-hoodie-png': { name: 'Cream Hoodie', image: 'image/men%20cloth/Cream Hoodie.png', pricePaise: 20000 },
  'image-men-20cloth-knit-sweater-png': { name: 'Knit Sweater', image: 'image/men%20cloth/Knit Sweater.png', pricePaise: 23000 },
  'image-men-20cloth-oversized-t-shirt-png': { name: 'Oversized T-Shirt', image: 'image/men%20cloth/Oversized T-Shirt.png', pricePaise: 11000 },
  'image-men-20cloth-puffer-jacket-png': { name: 'Puffer Jacket', image: 'image/men%20cloth/Puffer Jacket.png', pricePaise: 42000 },
  'image-men-20cloth-straight-jeans-png': { name: 'Straight Jeans', image: 'image/men%20cloth/Straight Jeans.png', pricePaise: 24000 },
  'image-men-20cloth-utility-overshirt-png': { name: 'Utility Overshirt', image: 'image/men%20cloth/Utility Overshirt.png', pricePaise: 19000 },
  'image-men-20cloth-varsity-jacket-png': { name: 'Varsity Jacket', image: 'image/men%20cloth/Varsity Jacket.png', pricePaise: 36000 },
  'image-women-20cloths-beige-tailored-blazer-jpeg': { name: 'Beige Tailored Blazer', image: 'image/women%20cloths/Beige Tailored Blazer.jpeg', pricePaise: 25000 },
  'image-women-20cloths-black-ruched-mesh-sleeve-top-jpeg': { name: 'Black Ruched Mesh-Sleeve Top', image: 'image/women%20cloths/Black Ruched Mesh-Sleeve Top.jpeg', pricePaise: 18000 },
  'image-women-20cloths-black-satin-cowl-neck-slip-dress-jpeg': { name: 'Black Satin Cowl-Neck Slip Dress', image: 'image/women%20cloths/Black Satin Cowl-Neck Slip Dress.jpeg', pricePaise: 22000 },
  'image-women-20cloths-brown-pleated-buckle-mini-skirt-jpeg': { name: 'Brown Pleated Buckle Mini Skirt', image: 'image/women%20cloths/Brown Pleated Buckle Mini Skirt.jpeg', pricePaise: 16000 },
  'image-women-20cloths-cream-black-striped-quarter-zip-sweater-jpeg': { name: 'Cream & Black Striped Quarter-Zip Sweater', image: 'image/women%20cloths/Cream & Black Striped Quarter-Zip Sweater.jpeg', pricePaise: 21000 },
  'image-women-20cloths-cream-floral-tiered-sundress-jpeg': { name: 'Cream Floral Tiered Sundress', image: 'image/women%20cloths/Cream Floral Tiered Sundress.jpeg', pricePaise: 19000 },
  'image-women-20cloths-cream-ribbed-square-neck-bell-sleeve-top-jpeg': { name: 'Cream Ribbed Square-Neck Bell-Sleeve Top', image: 'image/women%20cloths/Cream Ribbed Square-Neck Bell-Sleeve Top.jpeg', pricePaise: 17000 },
  'image-women-20cloths-dusty-rose-oversized-hoodie-jpeg': { name: 'Dusty Rose Oversized Hoodie', image: 'image/women%20cloths/Dusty Rose Oversized Hoodie.jpeg', pricePaise: 20000 },
  'image-women-20cloths-ivory-wrap-ruched-long-sleeve-top-jpeg': { name: 'Ivory Wrap-Ruched Long-Sleeve Top', image: 'image/women%20cloths/Ivory Wrap-Ruched Long-Sleeve Top.jpeg', pricePaise: 17500 },
  'image-women-20cloths-light-wash-wide-leg-jeans-jpeg': { name: 'Light-Wash Wide-Leg Jeans', image: 'image/women%20cloths/Light-Wash Wide-Leg Jeans.jpeg', pricePaise: 24000 },
  'image-kids-20cloths-bear-graphic-hooded-sweatshirt-jpeg': { name: 'Bear Graphic Hooded Sweatshirt', image: 'image/kids%20cloths/Bear Graphic Hooded Sweatshirt.jpeg', pricePaise: 12000 },
  'image-kids-20cloths-color-block-hooded-sweatshirt-hoodie-jpeg': { name: 'Color-Block Hooded Sweatshirt Hoodie', image: 'image/kids%20cloths/Color-Block Hooded Sweatshirt  Hoodie.jpeg', pricePaise: 14000 },
  'image-kids-20cloths-corduroy-button-up-shirt-jpeg': { name: 'Corduroy Button-Up Shirt', image: 'image/kids%20cloths/Corduroy Button-Up Shirt.jpeg', pricePaise: 11000 },
  'image-kids-20cloths-denim-dungaree-overalls-jpeg': { name: 'Denim Dungaree Overalls', image: 'image/kids%20cloths/Denim Dungaree  Overalls.jpeg', pricePaise: 16000 },
  'image-kids-20cloths-floral-ruffle-sleeve-dress-jpeg': { name: 'Floral Ruffle-Sleeve Dress', image: 'image/kids%20cloths/Floral Ruffle-Sleeve Dress.jpeg', pricePaise: 15000 },
  'image-kids-20cloths-heart-graphic-crewneck-sweatshirt-jpeg': { name: 'Heart Graphic Crewneck Sweatshirt', image: 'image/kids%20cloths/Heart Graphic Crewneck Sweatshirt.jpeg', pricePaise: 12500 },
  'image-kids-20cloths-kids-cargo-jogger-pants-jpeg': { name: 'Kids Cargo Jogger Pants', image: 'image/kids%20cloths/Kids Cargo Jogger Pants.jpeg', pricePaise: 13000 },
  'image-kids-20cloths-kids-hooded-tracksuit-set-jpeg': { name: 'Kids Hooded Tracksuit Set', image: 'image/kids%20cloths/Kids Hooded Tracksuit Set.jpeg', pricePaise: 18000 },
  'image-kids-20cloths-striped-full-sleeve-t-shirt-jpeg': { name: 'Striped Full-Sleeve T-Shirt', image: 'image/kids%20cloths/Striped Full-Sleeve T-Shirt.jpeg', pricePaise: 9000 },
  'image-kids-20cloths-teddy-fleece-hooded-jacket-jpeg': { name: 'Teddy Fleece Hooded Jacket', image: 'image/kids%20cloths/Teddy Fleece Hooded Jacket.jpeg', pricePaise: 17000 }
};

class PaymentError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new PaymentError(503, `Payment service is not configured (${name}).`);
  }
  return value.trim();
}

function readBody(request) {
  try {
    if (request.body && typeof request.body === 'object') {
      return request.body;
    }
    if (typeof request.body === 'string') {
      return JSON.parse(request.body);
    }
  } catch (error) {
    throw new PaymentError(400, 'Request body must be valid JSON.');
  }
  throw new PaymentError(400, 'Request body is required.');
}

function cleanText(value, label, minimum, maximum) {
  if (typeof value !== 'string') {
    throw new PaymentError(400, `${label} is required.`);
  }
  const clean = value.trim();
  if (clean.length < minimum || clean.length > maximum) {
    throw new PaymentError(400, `${label} is invalid.`);
  }
  return clean;
}

function normalizeCustomer(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PaymentError(400, 'Customer details are required.');
  }

  const name = cleanText(value.name, 'Name', 2, 100);
  const email = cleanText(value.email, 'Email', 5, 254).toLowerCase();
  const phone = String(value.phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  const address = cleanText(value.address, 'Address', 5, 200);
  const city = cleanText(value.city, 'City', 2, 80);
  const state = cleanText(value.state, 'State', 2, 80);
  const pincode = String(value.pincode || '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new PaymentError(400, 'Enter a valid email address.');
  }
  if (!/^\d{10}$/.test(phone)) {
    throw new PaymentError(400, 'Enter a valid 10-digit phone number.');
  }
  if (!/^\d{6}$/.test(pincode)) {
    throw new PaymentError(400, 'Enter a valid 6-digit PIN code.');
  }

  return { name, email, phone, address, city, state, pincode };
}

function calculateOrder(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 30) {
    throw new PaymentError(400, 'Your cart is empty or contains too many items.');
  }

  const lines = new Map();
  for (const item of input) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string') {
      throw new PaymentError(400, 'A cart item is invalid.');
    }
    const product = PRODUCTS[item.id];
    if (!product) {
      throw new PaymentError(400, 'A product in your cart is not available. Refresh the cart and try again.');
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      throw new PaymentError(400, `Quantity for ${product.name} must be between 1 and 10.`);
    }
    if (!['S', 'M', 'L', 'XL'].includes(item.size)) {
      throw new PaymentError(400, `Select a valid size for ${product.name}.`);
    }

    const key = `${item.id}:${item.size}`;
    const existing = lines.get(key);
    const quantity = item.quantity + (existing ? existing.quantity : 0);
    if (quantity > 10) {
      throw new PaymentError(400, `Quantity for ${product.name} cannot exceed 10.`);
    }
    lines.set(key, { id: item.id, size: item.size, quantity, product });
  }

  const items = Array.from(lines.values()).map((line) => ({
    product_id: line.id,
    name: line.product.name,
    image: line.product.image,
    size: line.size,
    quantity: line.quantity,
    unit_price_paise: line.product.pricePaise,
    line_total_paise: line.product.pricePaise * line.quantity
  }));
  const subtotalPaise = items.reduce((total, item) => total + item.line_total_paise, 0);
  let shippingPaise = 0;
  if (subtotalPaise <= FREE_SHIPPING_THRESHOLD_PAISE) {
    const configuredFee = requiredEnv('SHIPPING_FEE_PAISE');
    if (!/^\d+$/.test(configuredFee) || !Number.isSafeInteger(Number(configuredFee))) {
      throw new PaymentError(503, 'SHIPPING_FEE_PAISE must be configured as an integer amount in paise.');
    }
    shippingPaise = Number(configuredFee);
  }

  return {
    items,
    currency: 'INR',
    subtotalPaise,
    shippingPaise,
    totalPaise: subtotalPaise + shippingPaise
  };
}

function signPaymentToken(gateway, orderId) {
  const secret = requiredEnv('PAYMENT_ORDER_SIGNING_SECRET');
  if (secret.length < 32) {
    throw new PaymentError(503, 'Payment signing secret must be at least 32 characters.');
  }
  const payload = Buffer.from(JSON.stringify({
    gateway,
    orderId,
    expiresAt: Date.now() + PAYMENT_TOKEN_LIFETIME_MS
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyPaymentToken(token, gateway) {
  if (typeof token !== 'string' || token.length > 2048) {
    throw new PaymentError(400, 'Payment verification token is missing or invalid.');
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new PaymentError(400, 'Payment verification token is invalid.');
  }
  const secret = requiredEnv('PAYMENT_ORDER_SIGNING_SECRET');
  const expected = crypto.createHmac('sha256', secret).update(parts[0]).digest();
  let received;
  try {
    received = Buffer.from(parts[1], 'base64url');
  } catch (error) {
    throw new PaymentError(400, 'Payment verification token is invalid.');
  }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw new PaymentError(400, 'Payment verification token is invalid.');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  } catch (error) {
    throw new PaymentError(400, 'Payment verification token is invalid.');
  }
  if (payload.gateway !== gateway || typeof payload.orderId !== 'string' || payload.expiresAt < Date.now()) {
    throw new PaymentError(400, 'Payment verification token has expired or does not match this gateway.');
  }
  return payload.orderId;
}

function supabaseConfig() {
  const url = requiredEnv('SUPABASE_URL').replace(/\/$/, '');
  return {
    url,
    key: requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  };
}

async function databaseRequest(path, options) {
  const config = supabaseConfig();
  let response;
  try {
    response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
        ...(options && options.headers)
      }
    });
  } catch (error) {
    throw new PaymentError(502, 'Order storage is temporarily unavailable. Please retry.');
  }
  if (!response.ok) {
    console.error('Order storage request failed:', response.status);
    throw new PaymentError(502, 'Order storage is temporarily unavailable. Please retry.');
  }
  const responseText = await response.text();
  if (!responseText) {
    return null;
  }
  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new PaymentError(502, 'Order storage returned an invalid response.');
  }
}

function assertOrderStorageReady() {
  supabaseConfig();
  const signingSecret = requiredEnv('PAYMENT_ORDER_SIGNING_SECRET');
  if (signingSecret.length < 32) {
    throw new PaymentError(503, 'Payment signing secret must be at least 32 characters.');
  }
}

function databaseOrder(gateway, orderId, customer, calculated) {
  return {
    provider_order_id: orderId,
    gateway,
    status: 'PENDING',
    currency: calculated.currency,
    subtotal_paise: calculated.subtotalPaise,
    shipping_paise: calculated.shippingPaise,
    total_paise: calculated.totalPaise,
    customer_details: customer,
    items: calculated.items
  };
}

async function insertOrder(order) {
  await databaseRequest('rx_orders', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(order)
  });
}

async function getOrder(orderId) {
  const query = new URLSearchParams({
    select: '*',
    provider_order_id: `eq.${orderId}`,
    limit: '1'
  });
  const rows = await databaseRequest(`rx_orders?${query}`, { method: 'GET' });
  if (!Array.isArray(rows) || !rows[0]) {
    throw new PaymentError(404, 'Order was not found.');
  }
  return rows[0];
}

async function updateOrderStatus(orderId, status, paymentId) {
  const query = new URLSearchParams({
    provider_order_id: `eq.${orderId}`,
    status: status === 'PAID' ? 'neq.PAID' : 'eq.PENDING'
  });
  const body = { status, updated_at: new Date().toISOString() };
  if (paymentId) {
    body.provider_payment_id = paymentId;
  }
  const rows = await databaseRequest(`rx_orders?${query}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(body)
  });
  if (Array.isArray(rows) && rows[0]) {
    return rows[0];
  }
  return getOrder(orderId);
}

function publicOrderSummary(order) {
  return {
    orderId: order.provider_order_id,
    customerName: order.customer_details.name,
    items: order.items,
    subtotalPaise: order.subtotal_paise,
    shippingPaise: order.shipping_paise,
    totalPaidPaise: order.total_paise,
    currency: order.currency,
    gateway: order.gateway,
    paymentStatus: order.status
  };
}

function publicOrigin(request) {
  const forwardedHost = request.headers['x-forwarded-host'] || request.headers.host;
  const host = String(forwardedHost || '').split(',')[0].trim();
  const forwardedProtocol = String(request.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  if (!host || !/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(host) || !['http', 'https'].includes(forwardedProtocol)) {
    throw new PaymentError(400, 'The checkout host is invalid.');
  }
  return `${forwardedProtocol}://${host}`;
}

async function cashfreeRequest(path, method, body, config) {
  const baseUrl = config.environment === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-api-version': CASHFREE_API_VERSION,
        'x-client-id': config.appId,
        'x-client-secret': config.secretKey
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch (error) {
    throw new PaymentError(502, 'Cashfree is temporarily unavailable. Please try again.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Cashfree request failed:', response.status);
    throw new PaymentError(502, 'Cashfree could not process this request. Check the server configuration and try again.');
  }
  return result;
}

function cashfreeConfig() {
  const environment = (process.env.CASHFREE_ENVIRONMENT || 'sandbox').trim().toLowerCase();
  if (!['sandbox', 'production'].includes(environment)) {
    throw new PaymentError(503, 'CASHFREE_ENVIRONMENT must be sandbox or production.');
  }
  return {
    environment,
    appId: requiredEnv('CASHFREE_APP_ID'),
    secretKey: requiredEnv('CASHFREE_SECRET_KEY')
  };
}

async function createCashfreeOrder(request, calculated, customer) {
  assertOrderStorageReady();
  const config = cashfreeConfig();
  const orderId = `rx_cf_${crypto.randomUUID().replace(/-/g, '')}`;
  const returnUrl = `${publicOrigin(request)}/index.html?payment_return=cashfree`;
  const providerOrder = await cashfreeRequest('/orders', 'POST', {
    order_id: orderId,
    order_amount: calculated.totalPaise / 100,
    order_currency: calculated.currency,
    customer_details: {
      customer_id: `rx${customer.phone}${crypto.randomBytes(6).toString('hex')}`,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone
    },
    order_meta: { return_url },
    order_note: 'RX CLOTHS website order'
  }, config);

  if (providerOrder.order_id !== orderId || !providerOrder.payment_session_id) {
    throw new PaymentError(502, 'Cashfree returned an incomplete checkout session.');
  }
  await insertOrder(databaseOrder('cashfree', orderId, customer, calculated));
  return {
    gateway: 'cashfree',
    environment: config.environment,
    orderId,
    paymentSessionId: providerOrder.payment_session_id,
    confirmationToken: signPaymentToken('cashfree', orderId),
    quote: calculated
  };
}

function razorpayConfig() {
  const environment = (process.env.RAZORPAY_ENVIRONMENT || 'test').trim().toLowerCase();
  if (!['test', 'production'].includes(environment)) {
    throw new PaymentError(503, 'RAZORPAY_ENVIRONMENT must be test or production.');
  }
  const keyId = requiredEnv('RAZORPAY_KEY_ID');
  const keySecret = requiredEnv('RAZORPAY_KEY_SECRET');
  if (environment === 'test' && !keyId.startsWith('rzp_test_')) {
    throw new PaymentError(503, 'Razorpay test mode requires a Test Mode Key ID.');
  }
  if (environment === 'production' && !keyId.startsWith('rzp_live_')) {
    throw new PaymentError(503, 'Razorpay production mode requires a Live Mode Key ID.');
  }
  return { environment, keyId, keySecret };
}

async function razorpayRequest(path, method, body, config) {
  let response;
  try {
    response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch (error) {
    throw new PaymentError(502, 'Razorpay is temporarily unavailable. Please try again.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Razorpay request failed:', response.status);
    throw new PaymentError(502, 'Razorpay could not process this request. Check the server configuration and try again.');
  }
  return result;
}

async function createRazorpayOrder(calculated, customer) {
  assertOrderStorageReady();
  const config = razorpayConfig();
  const providerOrder = await razorpayRequest('/orders', 'POST', {
    amount: calculated.totalPaise,
    currency: calculated.currency,
    receipt: `rx${crypto.randomUUID().replace(/-/g, '')}`,
    notes: { store: 'RX CLOTHS' }
  }, config);

  if (!providerOrder.id || providerOrder.amount !== calculated.totalPaise || providerOrder.currency !== calculated.currency) {
    throw new PaymentError(502, 'Razorpay returned an incomplete checkout order.');
  }
  await insertOrder(databaseOrder('razorpay', providerOrder.id, customer, calculated));
  return {
    gateway: 'razorpay',
    environment: config.environment,
    keyId: config.keyId,
    orderId: providerOrder.id,
    amount: providerOrder.amount,
    currency: providerOrder.currency,
    confirmationToken: signPaymentToken('razorpay', providerOrder.id),
    quote: calculated
  };
}

function cashfreePaymentStatus(payment) {
  switch (payment && payment.payment_status) {
    case 'FAILED': return 'FAILED';
    case 'CANCELLED':
    case 'USER_DROPPED':
    case 'VOID': return 'CANCELLED';
    default: return 'PENDING';
  }
}

async function verifyCashfree(order) {
  const config = cashfreeConfig();
  const providerOrder = await cashfreeRequest(`/orders/${encodeURIComponent(order.provider_order_id)}`, 'GET', null, config);
  if (providerOrder.order_id !== order.provider_order_id || providerOrder.order_currency !== 'INR') {
    throw new PaymentError(409, 'Cashfree order details do not match this checkout.');
  }
  if (Math.round(Number(providerOrder.order_amount) * 100) !== order.total_paise) {
    throw new PaymentError(409, 'Cashfree order amount does not match the server-calculated total.');
  }

  if (providerOrder.order_status === 'PAID') {
    return { status: 'PAID', paymentId: null };
  }
  if (['EXPIRED', 'TERMINATED'].includes(providerOrder.order_status)) {
    return { status: 'CANCELLED', paymentId: null };
  }

  try {
    const payments = await cashfreeRequest(`/orders/${encodeURIComponent(order.provider_order_id)}/payments`, 'GET', null, config);
    const paymentList = Array.isArray(payments) ? payments : (Array.isArray(payments.data) ? payments.data : []);
    const latest = paymentList.slice().sort((left, right) => {
      return new Date(right.payment_time || 0).getTime() - new Date(left.payment_time || 0).getTime();
    })[0];
    return { status: cashfreePaymentStatus(latest), paymentId: latest && latest.cf_payment_id || null };
  } catch (error) {
    if (error instanceof PaymentError) {
      return { status: 'PENDING', paymentId: null };
    }
    throw error;
  }
}

function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

async function verifyRazorpay(order, input) {
  const config = razorpayConfig();
  const paymentId = typeof input.paymentId === 'string' ? input.paymentId : '';
  const hasPaymentId = /^pay_[A-Za-z0-9]+$/.test(paymentId);
  const signature = input.signature;
  if (hasPaymentId && signature && !verifyRazorpaySignature(order.provider_order_id, paymentId, signature, config.keySecret)) {
    throw new PaymentError(400, 'Razorpay payment signature verification failed.');
  }
  let payment;
  if (hasPaymentId) {
    payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`, 'GET', null, config);
  } else {
    const paymentList = await razorpayRequest(`/orders/${encodeURIComponent(order.provider_order_id)}/payments`, 'GET', null, config);
    const payments = Array.isArray(paymentList.items) ? paymentList.items : [];
    payment = payments.slice().sort((left, right) => (right.created_at || 0) - (left.created_at || 0))[0];
    if (!payment) {
      return { status: 'PENDING', paymentId: null };
    }
  }
  if (payment.order_id !== order.provider_order_id || payment.currency !== 'INR') {
    throw new PaymentError(409, 'Razorpay payment does not belong to this checkout.');
  }
  if (Number(payment.amount) !== order.total_paise) {
    throw new PaymentError(409, 'Razorpay payment amount does not match the server-calculated total.');
  }

  if (payment.status === 'captured') {
    if (hasPaymentId && !verifyRazorpaySignature(order.provider_order_id, payment.id, signature, config.keySecret)) {
      throw new PaymentError(400, 'Razorpay signature is required before confirming a captured payment.');
    }
    return { status: 'PAID', paymentId: payment.id };
  }
  if (payment.status === 'failed') {
    return { status: 'FAILED', paymentId: payment.id };
  }
  return { status: 'PENDING', paymentId: payment.id };
}

async function handleVerification(body) {
  const gateway = body.gateway;
  if (!['cashfree', 'razorpay'].includes(gateway)) {
    throw new PaymentError(400, 'Choose a valid payment gateway.');
  }
  const orderId = verifyPaymentToken(body.confirmationToken, gateway);
  let order = await getOrder(orderId);
  if (order.gateway !== gateway) {
    throw new PaymentError(409, 'Payment gateway does not match this order.');
  }
  if (order.status === 'PAID') {
    return { status: 'PAID', order: publicOrderSummary(order) };
  }

  const result = gateway === 'cashfree'
    ? await verifyCashfree(order)
    : await verifyRazorpay(order, body);
  if (result.status !== 'PENDING') {
    order = await updateOrderStatus(orderId, result.status, result.paymentId);
  }
  if (order.status === 'PAID') {
    return { status: 'PAID', order: publicOrderSummary(order) };
  }
  return { status: order.status === 'PENDING' ? result.status : order.status };
}

module.exports = async function paymentsHandler(request, response, routeDefaults = {}) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Use POST for payment requests.' });
  }

  try {
    const body = readBody(request);
    const action = routeDefaults.action || body.action;
    const gateway = routeDefaults.gateway || body.gateway;
    switch (action) {
      case 'quote':
        return response.status(200).json({ quote: calculateOrder(body.items) });
      case 'create': {
        const calculated = calculateOrder(body.items);
        const customer = normalizeCustomer(body.customer);
        if (gateway === 'cashfree') {
          return response.status(200).json(await createCashfreeOrder(request, calculated, customer));
        }
        if (gateway === 'razorpay') {
          return response.status(200).json(await createRazorpayOrder(calculated, customer));
        }
        throw new PaymentError(400, 'Choose Cashfree or Razorpay.');
      }
      case 'verify':
        return response.status(200).json(await handleVerification({ ...body, gateway }));
      default:
        throw new PaymentError(400, 'Payment action is invalid.');
    }
  } catch (error) {
    const statusCode = error instanceof PaymentError ? error.statusCode : 500;
    if (error instanceof PaymentError && statusCode >= 500) {
      console.error(`Payment integration configuration/provider failure (${statusCode}):`, error.message);
    } else if (!(error instanceof PaymentError)) {
      console.error('Payment API failed:', error && error.message ? error.message : 'Unknown error');
    }
    return response.status(statusCode).json({
      error: error instanceof PaymentError ? error.message : 'Payment could not be processed. Please retry.'
    });
  }
};

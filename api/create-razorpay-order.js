'use strict';

const paymentsHandler = require('./payments');

module.exports = (request, response) => paymentsHandler(request, response, {
  action: 'create',
  gateway: 'razorpay'
});

# RX CLOTHS Payments

## What the checkout does

The storefront sends only product IDs, sizes, quantities, and customer details to `/api/payments`. The Vercel Node.js function ignores browser-supplied names and prices, validates each product against its server catalog, limits quantities to 1-10 per product/size, and calculates INR totals in paise. The existing promotion says shipping is free above ₹2,000; set the actual below-threshold shipping charge in `SHIPPING_FEE_PAISE` as integer paise (for example, `9900` means ₹99). Orders over ₹2,000 are charged zero shipping.

The API creates a `PENDING` record in Supabase before returning a payment session. Cashfree is verified by fetching its order from the server. Razorpay is verified by checking the Checkout HMAC signature and fetching the payment from Razorpay; only a captured payment with the exact order and amount is marked `PAID`. Failed, cancelled, and pending results remain non-paid. Card data is entered only in the gateway-hosted checkout and is never stored by RX CLOTHS.

Run `supabase/schema.sql` once in the Supabase SQL Editor. The `rx_orders` table has row-level security enabled and no public policies; the API accesses it with the server-only service-role key.

## Environment variables

Copy `.env.example` to `.env.local` for local Vercel development and fill values locally. Do not commit `.env.local` or put these values in HTML or browser JavaScript.

- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key. Server-only; never use the publishable/anon key here.
- `CASHFREE_APP_ID`: Cashfree Sandbox App ID while testing.
- `CASHFREE_SECRET_KEY`: Cashfree Sandbox Secret Key while testing.
- `CASHFREE_ENVIRONMENT`: `SANDBOX` for test mode; `production` only after go-live.
- `RAZORPAY_KEY_ID`: Razorpay Test Mode Key ID while testing.
- `RAZORPAY_KEY_SECRET`: Razorpay Test Mode Key Secret while testing.
- `RAZORPAY_ENVIRONMENT`: `TEST` for test mode; `production` only after go-live.
- `PAYMENT_ORDER_SIGNING_SECRET`: Random server-only secret of at least 32 characters used to protect order verification references. Generate one locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
- `SHIPPING_FEE_PAISE`: Your below-threshold shipping rate in integer paise. Required for subtotals at or below ₹2,000; it is not required when the order qualifies for the advertised free shipping.

## Local testing

1. Run the SQL setup in Supabase and configure the variables in `.env.local`.
2. Use `npx vercel dev` from the project root. The VS Code Live Server extension only serves static files and does not execute `/api/payments`.
3. Open the URL printed by Vercel Dev, add an item and size to the bag, open the bag, and choose **Proceed to Checkout**.
4. Enter valid customer and delivery details. The order summary is returned by the server, not calculated from the displayed browser prices.
5. Select Cashfree and complete a Sandbox checkout. The browser calls `/api/create-cashfree-order`, opens Cashfree with its payment session, then calls `/api/verify-cashfree-payment` after Cashfree returns.
6. Repeat with Razorpay and complete a Test Mode payment. The browser calls `/api/create-razorpay-order`, opens Standard Checkout with the server-created order, then calls `/api/verify-razorpay-payment` with the Checkout response. The server validates the signature and confirms the captured payment with Razorpay.
7. Confirm that the page displays **Order Confirmed** only when the API returns `PAID`. Test a failed/cancelled/pending attempt too; none should show a paid confirmation.

Use the current test instruments in the official provider docs: [Cashfree Web Integration](https://www.cashfree.com/docs/payments/online/web/redirect) and [Razorpay Standard Checkout testing](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/).

## Vercel setup

1. In the Vercel project, open **Settings → Environment Variables** and add the variables above as server-side variables. Do not prefix secrets with `NEXT_PUBLIC_` or any public/client prefix.
2. For the initial rollout, set `CASHFREE_ENVIRONMENT=SANDBOX` and `RAZORPAY_ENVIRONMENT=TEST`, and use only Sandbox/Test credentials. Add them to the Vercel environments where you intend to test, including Preview or Production as appropriate.
3. Set the Vercel **Root Directory** to the folder that contains `index.html` and the `api/` directory. Deploy the latest commit; the deployment must include both `checkout.js` and the `/api` functions, not just the static HTML.
4. Confirm the Cashfree Sandbox site/domain configuration in the Cashfree dashboard. The API functions are automatically discovered under `/api` when this project is deployed from its root.
5. Redeploy after changing environment variables. The Vercel API routes are `/api/quote-order`, `/api/create-cashfree-order`, `/api/verify-cashfree-payment`, `/api/create-razorpay-order`, and `/api/verify-razorpay-payment`.

## Production later

After completing successful and failed test scenarios, use the providers' production approval and domain-whitelisting steps. Replace Sandbox/Test credentials with the corresponding production credentials in Vercel, set `CASHFREE_ENVIRONMENT=production` and `RAZORPAY_ENVIRONMENT=production`, then redeploy. Razorpay production mode rejects a Test Mode Key ID. Do not enable production keys until you intend to accept real payments.

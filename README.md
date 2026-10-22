# NOIRÉ Cash On Delivery funnel

A production-ready Next.js App Router funnel for NOIRÉ Eau de Parfum. It includes a responsive product landing page, quantity-aware checkout, server-side order validation, Google Sheets order tracking, two HTML email notifications, and a thank-you page.

## Recommended stack

- **Next.js App Router + TypeScript** for the pages and secure server route.
- **Tailwind CSS** for the responsive black-and-gold interface.
- **Google Sheets API** with a service account for order storage.
- **Gmail SMTP with Nodemailer** on Vercel, or **Resend's HTTP API** when `EMAIL_SERVICE_API_KEY` is set.
- **Vercel** for the simplest deployment of the Next.js application and Gmail SMTP support.

## How an order moves through the system

1. A customer selects a quantity on the landing page. The product and quantity are passed to `/checkout` in the URL.
2. The checkout adds the correct delivery fee: NPR 150 inside Kathmandu Valley or NPR 200 outside the valley.
3. The browser sends only customer details, delivery area, product name, and quantity to `POST /api/order`.
4. The API validates every field and recalculates price and total on the server. It never trusts a price sent by the browser.
5. The API generates a unique order ID, sets the status to `New Order`, and appends the order to Google Sheets.
6. Only after the sheet write succeeds, the API sends a business notification and a customer confirmation email.
7. The success response contains the verified order summary. The browser then redirects to `/thank-you`.

If the sheet write fails, no emails are sent and checkout displays an error. If the sheet write succeeds but an email fails, checkout displays the saved order ID and tells the customer not to submit a duplicate.

## Local setup

Requirements: Node.js 22.13 or newer.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open the local URL printed in the terminal. Never commit `.env.local`.

## Create and connect the Google Spreadsheet

### 1. Create the sheet

1. Open [Google Sheets](https://sheets.google.com) and create a blank spreadsheet named `NOIRÉ Orders`.
2. Rename the first tab to `NOIRE_orders` exactly, or change `GOOGLE_SHEET_TAB_NAME` to match your chosen tab name.
3. The application creates and styles the header row automatically when the first order arrives. If you prefer to add it manually, paste these 13 headings into row 1:

```text
Order ID | Date & Time | Customer Name | Phone Number | Email Address | Exact Location | Product Name | Quantity | Price Per Piece | Total Price | Payment Method | Order Status | Notes
```

The first successful order also freezes the header, adds a filter, auto-sizes columns, and adds this dropdown to the **Order Status** column:

- New Order
- Order Confirmed
- Order Ongoing
- Delivered
- Cancelled

To add those manually, select column L from row 2 downward, choose **Data → Data validation → Dropdown**, and enter the five options. To add filters manually, select row 1 and choose **Data → Create a filter**.

### 2. Create a Google service account

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. Open **APIs & Services → Library**, find **Google Sheets API**, and enable it.
3. Open **IAM & Admin → Service Accounts** and create a service account such as `noire-orders`.
4. Open the service account, choose **Keys → Add key → Create new key → JSON**, and download the JSON file.
5. Do not put the JSON file in this repository or upload it publicly.

### 3. Share the spreadsheet

Copy `client_email` from the downloaded JSON. In Google Sheets, click **Share**, add that service account email, and grant **Editor** access. The application cannot append rows unless this exact account can edit the sheet.

### 4. Find the Sheet ID

The URL looks like:

```text
https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit
```

The value between `/d/` and `/edit` is `GOOGLE_SHEET_ID`.

### 5. Add the Google values to `.env.local`

```dotenv
GOOGLE_SHEET_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz
GOOGLE_SHEET_TAB_NAME=NOIRE_orders
GOOGLE_SERVICE_ACCOUNT_EMAIL=noire-orders@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

Keep the literal `\n` sequences when using a single-line environment variable in Vercel. The server converts them to real line breaks.

## Configure email

The server supports two delivery methods. If `EMAIL_SERVICE_API_KEY` exists, Resend is used. Otherwise, Gmail SMTP is used.

### Gmail SMTP on Vercel

1. Turn on two-step verification for `reeongurun36@gmail.com`.
2. Create a Google **App Password** for Mail. Do not use the normal Gmail password.
3. Add:

```dotenv
BUSINESS_EMAIL=reeongurun36@gmail.com
EMAIL_FROM="NOIRÉ <reeongurun36@gmail.com>"
BRAND_NAME=NOIRÉ
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=reeongurun36@gmail.com
SMTP_PASS=your-16-character-app-password
```

Gmail may apply sending limits. For higher order volume, use a transactional email provider.

### Resend alternative

Verify a sender domain in Resend, then set:

```dotenv
BUSINESS_EMAIL=reeongurun36@gmail.com
EMAIL_FROM="NOIRÉ Orders <orders@your-verified-domain.com>"
EMAIL_SERVICE_API_KEY=re_your_key
```

You can leave the SMTP values empty when Resend is configured. Resend is also the recommended option on runtimes that do not allow SMTP connections.

## Complete environment file

Copy `.env.example` to `.env.local` and set:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Final public site URL. |
| `BUSINESS_EMAIL` | Receives new-order notifications. |
| `EMAIL_FROM` | Verified sender shown in emails. |
| `BRAND_NAME` | Brand used in the customer email subject. |
| `GOOGLE_SHEET_ID` | ID from the Google Sheets URL. |
| `GOOGLE_SHEET_TAB_NAME` | Order tab, default `NOIRE_orders`. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account `client_email`. |
| `GOOGLE_PRIVATE_KEY` | Service account `private_key`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Gmail or another SMTP server. |
| `EMAIL_SERVICE_API_KEY` | Optional Resend key; takes priority over SMTP. |
| `FRONTEND_URL` | Production origin allowed to call the API, without a trailing slash. |

All credentials are read only inside server-side files. They are never exposed through `NEXT_PUBLIC_` variables or sent to the browser.

## Test a real order

1. Add complete Google and email credentials to `.env.local`.
2. Run `npm run dev` and place an order with a real email you can access.
3. Confirm that checkout shows `Submitting order...` and prevents a second click.
4. Confirm one new row appears in `NOIRE_orders` with an order ID, Nepal time, COD payment, and `New Order` status.
5. Confirm `reeongurun36@gmail.com` receives the business notification.
6. Confirm the customer address receives the order confirmation.
7. Confirm the browser redirects to `/thank-you` and shows the same order ID, quantity, and total.
8. Temporarily enter an invalid email or location to verify client and server validation messages.

An API success response is returned only after the sheet row and both emails succeed.

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. In [Vercel](https://vercel.com), choose **Add New → Project** and import the repository.
3. Keep the detected framework as **Next.js** and set the build command to `npm run build:vercel`.
4. In **Project Settings → Environment Variables**, add every production value from `.env.example`.
5. Set both `NEXT_PUBLIC_SITE_URL` and `FRONTEND_URL` to the final HTTPS Vercel domain, for example `https://noire.example.com`.
6. Deploy. After a domain change, update both URL variables and redeploy.
7. Place one real test order and complete every check in the previous section.

For preview deployments, either add the preview URL to `FRONTEND_URL` temporarily or test from the same origin; same-origin API calls are always allowed.

## Important operational notes

- Replace the clearly labeled sample reviews with genuine, permissioned customer feedback before using them as testimonials.
- The order price and delivery fee live in `lib/order.ts` and are recalculated on the server.
- The reels section is intentionally omitted because no reel links were provided.
- Product assets are optimized PNG files under `public/images`.

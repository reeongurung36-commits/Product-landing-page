import type { ValidatedOrder } from "@/lib/order";
import { getDeliveryLabel } from "@/lib/order";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export const SHEET_HEADERS = [
  "Order ID",
  "Date & Time",
  "Customer Name",
  "Phone Number",
  "Email Address",
  "Exact Location",
  "Product Name",
  "Quantity",
  "Price Per Piece",
  "Total Price",
  "Payment Method",
  "Order Status",
  "Notes",
] as const;

export function canSyncOrdersToGoogleSheet() {
  return Boolean(
    process.env.GOOGLE_SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY,
  );
}

function encodeBase64Url(value: Uint8Array | string) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string) {
  const normalized = pem.replace(/\\n/g, "\n");
  const base64 = normalized
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function getAccessToken(email: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: email,
      scope: SHEETS_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken),
  );
  const assertion = `${unsignedToken}.${encodeBase64Url(new Uint8Array(signature))}`;
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) {
    throw new Error(`Google authentication failed (${response.status}).`);
  }
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google did not return an access token.");
  return data.access_token;
}

async function googleRequest(
  url: string,
  accessToken: string,
  init?: RequestInit,
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("Google Sheets API error:", response.status, detail);
    throw new Error(`Google Sheets request failed (${response.status}).`);
  }
  return response;
}

async function ensureSheetStructure(
  sheetId: string,
  tabName: string,
  accessToken: string,
) {
  const encodedTab = encodeURIComponent(`'${tabName}'!A1:M1`);
  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodedTab}`;
  const current = await googleRequest(valuesUrl, accessToken);
  const currentData = (await current.json()) as { values?: string[][] };
  if (currentData.values?.[0]?.length) return;

  await googleRequest(`${valuesUrl}?valueInputOption=RAW`, accessToken, {
    method: "PUT",
    body: JSON.stringify({ values: [SHEET_HEADERS] }),
  });

  const metadataResponse = await googleRequest(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties`,
    accessToken,
  );
  const metadata = (await metadataResponse.json()) as {
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
  };
  const numericSheetId = metadata.sheets?.find(
    (sheet) => sheet.properties?.title === tabName,
  )?.properties?.sheetId;
  if (numericSheetId === undefined) {
    throw new Error(`The Google Sheet tab “${tabName}” was not found.`);
  }

  const requests = [
    {
      updateSheetProperties: {
        properties: { sheetId: numericSheetId, gridProperties: { frozenRowCount: 1 } },
        fields: "gridProperties.frozenRowCount",
      },
    },
    {
      repeatCell: {
        range: {
          sheetId: numericSheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 13,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.12, green: 0.09, blue: 0.04 },
            textFormat: {
              foregroundColor: { red: 0.94, green: 0.72, blue: 0.32 },
              bold: true,
            },
            horizontalAlignment: "CENTER",
          },
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
      },
    },
    {
      setDataValidation: {
        range: {
          sheetId: numericSheetId,
          startRowIndex: 1,
          startColumnIndex: 11,
          endColumnIndex: 12,
        },
        rule: {
          condition: {
            type: "ONE_OF_LIST",
            values: [
              "New Order",
              "Order Confirmed",
              "Order Ongoing",
              "Delivered",
              "Cancelled",
            ].map((userEnteredValue) => ({ userEnteredValue })),
          },
          strict: true,
          showCustomUi: true,
        },
      },
    },
    {
      setBasicFilter: {
        filter: {
          range: {
            sheetId: numericSheetId,
            startRowIndex: 0,
            startColumnIndex: 0,
            endColumnIndex: 13,
          },
        },
      },
    },
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: numericSheetId,
          dimension: "COLUMNS",
          startIndex: 0,
          endIndex: 13,
        },
      },
    },
  ];

  await googleRequest(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`,
    accessToken,
    { method: "POST", body: JSON.stringify({ requests }) },
  );
}

export async function appendOrderToGoogleSheet(order: ValidatedOrder) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const tabName = process.env.GOOGLE_SHEET_TAB_NAME || "NOIRE_orders";
  if (!sheetId || !serviceAccountEmail || !privateKey) {
    throw new Error("Google Sheets environment variables are incomplete.");
  }

  const accessToken = await getAccessToken(serviceAccountEmail, privateKey);
  await ensureSheetStructure(sheetId, tabName, accessToken);
  const encodedRange = encodeURIComponent(`'${tabName}'!A:M`);
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  await googleRequest(appendUrl, accessToken, {
    method: "POST",
    body: JSON.stringify({
      values: [
        [
          order.orderId,
          order.submittedAt,
          order.customerName,
          order.phone,
          order.email,
          `${order.location} (${getDeliveryLabel(order.deliveryZone)})`,
          order.productName,
          order.quantity,
          order.pricePerPiece,
          order.totalPrice,
          order.paymentMethod,
          order.orderStatus,
          order.notes,
        ],
      ],
    }),
  });
}

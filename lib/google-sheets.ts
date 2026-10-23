import type { ValidatedOrder } from "@/lib/order";
import { getDeliveryLabel } from "@/lib/order";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export const SHEET_HEADERS = [
  "Order ID",
  "Order Date",
  "Customer Name",
  "Phone",
  "Email",
  "Delivery Address",
  "Delivery Area",
  "Product",
  "Quantity",
  "Unit Price (NPR)",
  "Delivery Fee (NPR)",
  "Total (NPR)",
  "Payment Method",
  "Order Status",
  "Notes",
  "Request ID",
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
  const metadataResponse = await googleRequest(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties`,
    accessToken,
  );
  const metadata = (await metadataResponse.json()) as {
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
  };
  let numericSheetId = metadata.sheets?.find(
    (sheet) => sheet.properties?.title === tabName,
  )?.properties?.sheetId;

  if (numericSheetId === undefined) {
    const createResponse = await googleRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tabName } } }] }),
      },
    );
    const createData = (await createResponse.json()) as {
      replies?: Array<{ addSheet?: { properties?: { sheetId?: number } } }>;
    };
    numericSheetId = createData.replies?.[0]?.addSheet?.properties?.sheetId;
  }

  if (numericSheetId === undefined) {
    throw new Error(`The Google Sheet tab “${tabName}” could not be created.`);
  }

  const encodedHeaderRange = encodeURIComponent(`'${tabName}'!A1:P1`);
  await googleRequest(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodedHeaderRange}?valueInputOption=RAW`,
    accessToken,
    { method: "PUT", body: JSON.stringify({ values: [SHEET_HEADERS] }) },
  );

  const requests = [
    {
      updateSheetProperties: {
        properties: {
          sheetId: numericSheetId,
          gridProperties: { frozenRowCount: 1 },
          tabColorStyle: { rgbColor: { red: 0.84, green: 0.67, blue: 0.32 } },
        },
        fields: "gridProperties.frozenRowCount,tabColorStyle",
      },
    },
    {
      repeatCell: {
        range: {
          sheetId: numericSheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 16,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.06, green: 0.05, blue: 0.04 },
            textFormat: {
              foregroundColor: { red: 0.84, green: 0.67, blue: 0.32 },
              bold: true,
              fontFamily: "Georgia",
              fontSize: 11,
            },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            wrapStrategy: "WRAP",
            borders: {
              bottom: {
                style: "SOLID_THICK",
                color: { red: 0.84, green: 0.67, blue: 0.32 },
              },
            },
          },
        },
        fields: "userEnteredFormat",
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId: numericSheetId,
          dimension: "ROWS",
          startIndex: 0,
          endIndex: 1,
        },
        properties: { pixelSize: 38 },
        fields: "pixelSize",
      },
    },
    {
      repeatCell: {
        range: {
          sheetId: numericSheetId,
          startRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 16,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.98, green: 0.96, blue: 0.92 },
            textFormat: {
              foregroundColor: { red: 0.15, green: 0.13, blue: 0.1 },
              fontFamily: "Arial",
              fontSize: 10,
            },
            verticalAlignment: "MIDDLE",
          },
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,verticalAlignment)",
      },
    },
    {
      repeatCell: {
        range: {
          sheetId: numericSheetId,
          startRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              foregroundColor: { red: 0.57, green: 0.4, blue: 0.12 },
              bold: true,
            },
          },
        },
        fields: "userEnteredFormat.textFormat",
      },
    },
    {
      repeatCell: {
        range: {
          sheetId: numericSheetId,
          startRowIndex: 1,
          startColumnIndex: 9,
          endColumnIndex: 12,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: { type: "NUMBER", pattern: "\"NPR\" #,##0" },
            horizontalAlignment: "RIGHT",
          },
        },
        fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
      },
    },
    {
      repeatCell: {
        range: {
          sheetId: numericSheetId,
          startRowIndex: 1,
          startColumnIndex: 11,
          endColumnIndex: 12,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              foregroundColor: { red: 0.57, green: 0.4, blue: 0.12 },
              bold: true,
            },
          },
        },
        fields: "userEnteredFormat.textFormat",
      },
    },
    {
      repeatCell: {
        range: {
          sheetId: numericSheetId,
          startRowIndex: 1,
          startColumnIndex: 5,
          endColumnIndex: 6,
        },
        cell: { userEnteredFormat: { wrapStrategy: "WRAP" } },
        fields: "userEnteredFormat.wrapStrategy",
      },
    },
    {
      setDataValidation: {
        range: {
          sheetId: numericSheetId,
          startRowIndex: 1,
          startColumnIndex: 13,
          endColumnIndex: 14,
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
            endColumnIndex: 16,
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
          endIndex: 15,
        },
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId: numericSheetId,
          dimension: "COLUMNS",
          startIndex: 15,
          endIndex: 16,
        },
        properties: { hiddenByUser: true },
        fields: "hiddenByUser",
      },
    },
    ...[
      [0, 1, 190],
      [1, 2, 155],
      [2, 3, 180],
      [3, 4, 135],
      [4, 5, 220],
      [5, 6, 280],
      [6, 7, 185],
      [7, 8, 140],
      [8, 9, 85],
      [9, 12, 135],
      [12, 14, 155],
      [14, 15, 220],
    ].map(([startIndex, endIndex, pixelSize]) => ({
      updateDimensionProperties: {
        range: {
          sheetId: numericSheetId,
          dimension: "COLUMNS",
          startIndex,
          endIndex,
        },
        properties: { pixelSize },
        fields: "pixelSize",
      },
    })),
  ];

  await googleRequest(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`,
    accessToken,
    { method: "POST", body: JSON.stringify({ requests }) },
  );
}

function getGoogleSheetsConfig() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const tabName = process.env.GOOGLE_SHEET_TAB_NAME || "NOIRE_orders";
  if (!sheetId || !serviceAccountEmail || !privateKey) {
    throw new Error("Google Sheets environment variables are incomplete.");
  }

  return { sheetId, serviceAccountEmail, privateKey, tabName };
}

export async function appendOrderToGoogleSheet(
  order: ValidatedOrder,
  idempotencyKey = "",
) {
  const { sheetId, serviceAccountEmail, privateKey, tabName } =
    getGoogleSheetsConfig();

  const accessToken = await getAccessToken(serviceAccountEmail, privateKey);
  await ensureSheetStructure(sheetId, tabName, accessToken);
  const encodedRange = encodeURIComponent(`'${tabName}'!A:P`);
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
          order.location,
          getDeliveryLabel(order.deliveryZone),
          order.productName,
          order.quantity,
          order.pricePerPiece,
          order.deliveryFee,
          order.totalPrice,
          order.paymentMethod,
          order.orderStatus,
          order.notes,
          idempotencyKey,
        ],
      ],
    }),
  });
}

export async function findOrderInGoogleSheet(idempotencyKey: string) {
  const { sheetId, serviceAccountEmail, privateKey, tabName } =
    getGoogleSheetsConfig();
  const accessToken = await getAccessToken(serviceAccountEmail, privateKey);
  await ensureSheetStructure(sheetId, tabName, accessToken);
  const encodedRange = encodeURIComponent(`'${tabName}'!A2:P`);
  const response = await googleRequest(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodedRange}?majorDimension=ROWS`,
    accessToken,
  );
  const data = (await response.json()) as { values?: unknown[][] };
  const row = data.values
    ?.slice()
    .reverse()
    .find((candidate) => candidate[15] === idempotencyKey);

  if (!row) return null;

  const deliveryZone =
    row[6] === "Inside Kathmandu Valley" ? "inside" : "outside";

  return {
    orderId: String(row[0] ?? ""),
    submittedAt: String(row[1] ?? ""),
    customerName: String(row[2] ?? ""),
    phone: String(row[3] ?? ""),
    email: String(row[4] ?? ""),
    location: String(row[5] ?? ""),
    deliveryZone,
    productName: "NOIRÉ",
    quantity: Number(row[8] ?? 0),
    pricePerPiece: Number(row[9] ?? 0),
    deliveryFee: Number(row[10] ?? 0),
    totalPrice: Number(row[11] ?? 0),
    paymentMethod: "Cash On Delivery",
    orderStatus: "New Order",
    notes: String(row[14] ?? ""),
  } satisfies ValidatedOrder;
}

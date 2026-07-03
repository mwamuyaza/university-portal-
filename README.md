# University Hub Portal

A comprehensive, full-stack Academic Registry and Tuition Ledger management system. This platform is built with a segregated **React 18 / Vite** frontend and a robust **Node.js Express** backend server, supporting dual-approval admissions workflows, email verification codes, and real-time interactive **Lipa Na M-Pesa STK Push** payment flows with webhook callback synchronization.

---

## 🚀 Key Architectural Features

1. **Dual-Approval Admissions System**
   - Student and Faculty onboard independently. Accounts remain in a `PENDING_APPROVAL` state.
   - Requires signatures from both the Admin and the assigned Cohort Instructor before a student becomes `ACTIVE`.
   
2. **Tuition Ledger & Fees Portal**
   - Detailed client-side fees statement including total gross paid, outstanding balances, and receipt histories.
   - Features real-time conversion between **USD and KES (1:130 exchange rate)** for localized payment experiences.

3. **Lipa Na M-Pesa STK Push & Webhook Callback**
   - **STK Push Initiation**: Securely triggers Safaricom-style payment prompt straight to the student's registered mobile device.
   - **Public Webhook Callback**: Handles incoming transactional metadata directly from the Safaricom gateway, matching transactions by `CheckoutRequestID` and updating the database ledger automatically.
   - **Transaction Polling**: Direct status lookup during active checkout states to guarantee seamless client synchronization.

4. **Multi-Channel Onboarding Safeguards**
   - Pre-installed 6-digit email OTP (One-Time Password) flows for new registrations and forgot-password verification events.

---

## 📂 System Directory Structure

```
university-hub-portal/
├── backend/
│   ├── server.ts             # Express REST API, M-Pesa STK Push routes, Webhooks, and Middlewares
│   └── dbStore.ts            # Custom transactional state-persist file-backed JSON store
├── src/
│   ├── App.tsx               # Primary React routing container & layout dashboard
│   ├── main.tsx              # Front-end rendering entrypoint
│   ├── index.css             # Tailwind CSS global configurations and typography setups
│   ├── types.ts              # Global strictly typed model and entity declarations
│   └── components/
│       ├── StudentFeesPortal.tsx  # Dynamic student payments panel with interactive M-Pesa terminal
│       ├── FinanceModule.tsx      # Admin-side financial accounts and ledger review
│       └── ...                    # Sidebar, Academics, Grades, Logs, and Reports modules
├── spring-boot-backend/      # Alternative production Java Spring Boot + MySQL backend
├── package.json              # Direct monolithic compilation scripts
└── tsconfig.json             # Root TypeScript compilation rulebook
```

---

## ⚡ M-Pesa STK Push API Endpoints

### 1. Trigger STK Push Prompt
Triggers a push notification to the user's mobile phone to confirm tuition payments.

* **URL**: `/api/payments/mpesa/stkpush`
* **Method**: `POST`
* **Auth Required**: Yes (Bearer JWT)
* **Headers**: `Authorization: Bearer <token>`
* **Request Payload**:
```json
{
  "phoneNumber": "254712345678",
  "schoolId": "ST-2024-9403",
  "amount": 150.00,
  "remarks": "Tuition fees instalment"
}
```

* **Success Response (Safaricom format)**:
```json
{
  "MerchantRequestID": "MPESA-MRID-7E4A2C",
  "CheckoutRequestID": "ws_CO_839123_8D",
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing",
  "CustomerMessage": "Single STK Push prompt successfully sent to your mobile device. Enter M-Pesa PIN to complete payment."
}
```

---

### 2. Public Callback Webhook Listener
Receives the real transaction confirmation response payload directly from the M-Pesa Gateway.

* **URL**: `/api/payments/mpesa/callback`
* **Method**: `POST`
* **Auth Required**: No (Public webhook)
* **Request Payload (Success)**:
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "MPESA-MRID-7E4A2C",
      "CheckoutRequestID": "ws_CO_839123_8D",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 150.00 },
          { "Name": "MpesaReceiptNumber", "Value": "SKL29DJH83" },
          { "Name": "TransactionDate", "Value": 20260703120000 },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}
```

* **Webhook Processing Logic**:
  1. Validates the `ResultCode` is `0` (Success).
  2. Extracts the unique `MpesaReceiptNumber` and transaction amount.
  3. Locates the pending request by matching `CheckoutRequestID`.
  4. Automatically processes the fee payment in the database (`dbStore.ts`).
  5. Records the success or failure status directly to the system logs.

---

### 3. Check Transaction Status
Provides real-time state lookups while the user is inside the interactive mobile phone PIN terminal.

* **URL**: `/api/payments/mpesa/status/:checkoutRequestId`
* **Method**: `GET`
* **Auth Required**: Yes (Bearer JWT)
* **Success Response**:
```json
{
  "checkoutRequestId": "ws_CO_839123_8D",
  "merchantRequestId": "MPESA-MRID-7E4A2C",
  "status": "SUCCESS",
  "amount": 150.00,
  "schoolId": "ST-2024-9403",
  "phoneNumber": "254712345678"
}
```

---

## 🛠️ Installation, Local Boot, & Build

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Full-Stack Developer Server
Boots Vite and Express simultaneously on port `3000`:
```bash
npm run dev
```

### 3. Compile and Bundle for Production
Compiles the React assets and packages the Express backend with `esbuild` into a self-contained production bundle at `/dist`:
```bash
npm run build
npm run start
```

---

## 💡 Sandbox Simulator Settings
- In sandboxed environments where Safaricom gateways aren't bound to active external tunnels, the server simulates a realistic **3-second roundtrip background thread**.
- When you initialize the M-Pesa STK push and type your PIN into the interactive UI, the server will trigger a mock webhook background callback payload asynchronously, allowing you to test the callback ledger update mechanics completely offline!

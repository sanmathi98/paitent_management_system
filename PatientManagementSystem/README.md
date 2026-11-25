# CareLedger Clinical — Patient Management System

A full-stack Patient Management, Billing, and Razorpay Payment System built with **React.js**, **React Context + useReducer** (no Redux/Redux Toolkit), **Axios**, **Python**, **Django REST Framework**, **MySQL**, and **Razorpay**.

---

## Folder Structure

```text
PatientManagementSystem/
├── backend/                  # Python + Django + DRF + MySQL + Razorpay
│   ├── accounts/             # Custom User model, Registration, JWT Login & Refresh
│   ├── patients/             # Patient CRUD, Search, Gender Filter, Sorting, Pagination
│   ├── billing/              # Bills CRUD, Dashboard Summary, Razorpay Order & Verification
│   ├── config/               # Django settings, root URLs, exception handler, WSGI
│   ├── schema.sql            # Explicit MySQL DDL (PKs, FKs, Unique Constraints, Indexes)
│   ├── requirements.txt      # Python package dependencies
│   ├── .env.example          # Environment variable template
│   └── manage.py
└── frontend/                 # React.js + Vite + Tailwind CSS + Axios + React Router
    ├── src/
    │   ├── api/              # Axios client, authApi, patientApi, billingApi
    │   ├── context/          # React Context + useReducer state management
    │   ├── components/       # Layout, StatusBadge, ConfirmModal, RazorpayModal, InvoiceModal
    │   ├── pages/            # LoginPage, DashboardPage, PatientsPage, BillingPage
    │   ├── types/            # TypeScript interfaces
    │   └── utils/            # Currency, date, and invoice download helpers
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

---

## Architecture & Data Flow

```text
React Component (Pages / Forms)
  → React Context + useReducer (State, Loading, Error)
    → Axios API Service (Bearer JWT Header + Refresh Interceptor)
      → Django REST Framework View (Permissions + Routing)
        → DRF Serializer (Input Validation)
          → Service Layer (Business Logic, Razorpay SDK, HMAC Verification)
            → Django ORM (transaction.atomic)
              → MySQL Database (users, patients, bills, payments)
```

---

## 1. MySQL Database Setup

Start MySQL and create the database using `backend/schema.sql`:

```bash
mysql -u root -p < backend/schema.sql
```

Tables created:
- `users`: Primary key `id`, unique constraint on `email`, hashed `password`, `role`, `created_at`
- `patients`: Primary key `id`, unique constraint on `email`, indexed `name` and `gender`, `created_at`, `updated_at`
- `bills`: Primary key `id`, foreign key `patient_id -> patients(id)` (`ON DELETE CASCADE`), `amount`, `tax`, `total_amount`, `payment_status`
- `payments`: Primary key `id`, foreign key `bill_id -> bills(id)` (`ON DELETE CASCADE`), unique constraint on `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `payment_status`

---

## 2. Backend Setup (Python + Django + DRF)

```bash
cd PatientManagementSystem/backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate

# Install Python packages
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your MySQL credentials, Django secret key, and Razorpay Test Keys

# Apply Django migrations to MySQL
python manage.py makemigrations accounts patients billing
python manage.py migrate

# Run unit tests
python manage.py test

# Start the Django development server on port 8000
python manage.py runserver 0.0.0.0:8000
```

---

## 3. Frontend Setup (React + Vite)

```bash
cd PatientManagementSystem/frontend

# Install Node packages
npm install

# Configure API base URL
cp .env.example .env
# Ensure VITE_API_BASE_URL="http://127.0.0.1:8000/api"

# Start the React development server on port 3000
npm run dev
```

Open `http://localhost:3000` in your browser. On the Login screen, switch **Backend Mode** to **Django** to connect directly to `http://127.0.0.1:8000/api` (or use **Sandbox** mode for offline UI preview without a running server).

---

## 4. API Endpoints Reference

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/` | Public | Register clinic staff user and issue JWT |
| `POST` | `/api/auth/login/` | Public | Authenticate email/password and return JWT |
| `POST` | `/api/auth/refresh/` | Public | Refresh expired access token |
| `GET` | `/api/auth/me/` | JWT | Fetch authenticated user profile |
| `GET` | `/api/dashboard/summary/` | JWT | Total patients, bills, paid/pending totals, recent records |
| `GET` | `/api/patients/` | JWT | List patients with `?search=`, `?gender=`, `?sort=`, `?page=` |
| `POST` | `/api/patients/` | JWT | Create patient with field & duplicate email validation |
| `GET` | `/api/patients/<id>/` | JWT | Retrieve single patient details |
| `PUT` | `/api/patients/<id>/` | JWT | Update patient record |
| `DELETE` | `/api/patients/<id>/` | JWT | Delete patient record |
| `GET` | `/api/bills/` | JWT | List bills with `?search=`, `?payment_status=`, `?patient_id=` |
| `POST` | `/api/bills/` | JWT | Create patient bill (`Pending` default) |
| `GET/PUT/DELETE` | `/api/bills/<id>/` | JWT | Retrieve, update, or delete bill |
| `POST` | `/api/payments/create-order/` | JWT | Create Razorpay Order on backend and store pending `Payment` |
| `POST` | `/api/payments/verify/` | JWT | Verify HMAC-SHA256 signature and mark `Payment` + `Bill` as `Paid` |
| `POST` | `/api/payments/fail/` | JWT | Record `Failed` or `Cancelled` payment attempt |
| `GET` | `/api/payments/` | JWT | List payment history |
| `GET` | `/api/docs/` | Public | Interactive Swagger / OpenAPI documentation |

---

## 5. Razorpay Payment Flow

1. Staff clicks **Pay Bill** on a `Pending` or `Failed` bill in the React UI.
2. Frontend calls `POST /api/payments/create-order/` with `{ bill_id }`.
3. Django validates the bill, converts `total_amount` to paise (`amount * 100`), calls `razorpay.Client.order.create(...)` using server-side `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, saves a `Pending` row in `payments`, and returns `{ order_id, key_id, amount_paise }` (never exposing `RAZORPAY_KEY_SECRET`).
4. React opens Razorpay Checkout (`window.Razorpay`).
5. Upon payment completion, Razorpay returns `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` to React, which forwards them to `POST /api/payments/verify/`.
6. Django verifies the HMAC-SHA256 signature with `hmac.compare_digest` inside `transaction.atomic()` and updates both `Payment.payment_status` and `Bill.payment_status` to `Paid` (or `Failed` if tampered).

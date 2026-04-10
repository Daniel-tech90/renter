# 🏠 Rent Management Portal

A full-stack MERN application for managing renters, payments, and automated WhatsApp reminders.

---

## 🗂 Project Structure

```
Renter/
├── server/                  # Node.js + Express backend
│   ├── config/db.js         # MongoDB connection
│   ├── controllers/         # Business logic
│   ├── middleware/auth.js   # JWT middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routes
│   ├── services/            # Cron + WhatsApp
│   └── index.js             # Entry point
├── client/                  # React + Vite frontend
│   └── src/
│       ├── pages/           # Login, Dashboard, Renters, Payments
│       ├── components/      # Sidebar, Modal, Forms, StatCard
│       ├── context/         # Auth context
│       └── services/        # Axios API calls
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Twilio account (optional, for WhatsApp)

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your values
```

### 3. Start Development

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### 4. Default Admin Login
```
Email:    admin@rentportal.com
Password: Admin@123
```
> Change these in `.env` before production!

---

## 🔑 .env Reference

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/rent-management
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

ADMIN_EMAIL=admin@rentportal.com
ADMIN_PASSWORD=Admin@123
```

---

## 📡 API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Admin login → returns JWT |

### Renters *(requires Bearer token)*
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/renters` | List all renters (supports `?search=`) |
| GET | `/api/renters/:id` | Get single renter |
| POST | `/api/renters` | Create renter |
| PUT | `/api/renters/:id` | Update renter |
| DELETE | `/api/renters/:id` | Soft-delete renter |

### Payments *(requires Bearer token)*
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/payments` | List payments (supports `?status=&month=`) |
| GET | `/api/payments/renter/:renterId` | Payment history for a renter |
| POST | `/api/payments` | Record a payment |
| PUT | `/api/payments/:id` | Update payment |
| GET | `/api/payments/:id/receipt` | Download PDF receipt |

### Dashboard *(requires Bearer token)*
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard` | Stats: renters, paid/pending, monthly income |

---

## 🤖 Automation (Cron Jobs)

Two cron jobs run automatically:

| Schedule | Task |
|----------|------|
| Daily at 9 AM | Check due/overdue payments → send WhatsApp reminders |
| 1st of every month at midnight | Auto-create Pending payment records for all renters |

---

## 📱 WhatsApp Messages

Triggered via Twilio:
- **Rent Paid** → Confirmation message sent immediately
- **Rent Due/Overdue** → Reminder sent daily at 9 AM via cron

> Phone numbers are prefixed with `+91` (India). Change in `whatsappService.js` for other countries.

---

## 🧾 PDF Receipt

Click **Receipt** on any Paid payment in the Payments page to download a PDF receipt.

---

## 🚀 Production Deployment

```bash
# Build frontend
cd client && npm run build

# Serve with Express (add to server/index.js)
app.use(express.static('../client/dist'));
```

Use **MongoDB Atlas** for cloud DB and **Railway / Render** for hosting.

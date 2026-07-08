# NutriTrack AI - Smart Nutrition Tracking Application

NutriTrack AI is a production-ready, full-stack MERN (MongoDB, Express.js, React, Node.js) application designed for seamless nutrition tracking, meal logging, and advanced progress analytics.

## 🚀 Features

- **JWT Authentication**: Secure HttpOnly cookie-based authentication with password hashing using `bcryptjs`.
- **Dashboard**: High-level overview of daily calorie goals, macronutrient splits (protein, carbs, fat), total meals logged today, and weekly nutrition summaries.
- **Meal Management**: Complete CRUD operations for logging meals, including macros, meal type (Breakfast, Lunch, Dinner, Snack), meal pictures, and custom notes.
- **Advanced Search & Filtering**: Filter logged meals by type, specific dates, or search by meal name.
- **Progress Analytics**: Rich interactive charts powered by `Recharts` showing daily calories trend, macronutrient intake breakdown, and meal type distribution summaries.
- **Responsive Profile System**: Editable physiological details (height, weight, age, activity level, fitness goal), dynamic profile photo uploads, and password change management.
- **Centralized Error Handling**: Uniform API responses and middleware errors catching for invalid object IDs, database validation, and server faults.
- **Local Proxying**: Vite proxy configuration ensuring zero CORS complications in local dev environments.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React + Vite (Single Page Application)
- **Routing**: React Router DOM (protected layout architecture)
- **Styling**: Tailwind CSS v4.0 (modern responsive glassmorphism styles)
- **Forms & Validation**: React Hook Form + Zod resolvers
- **Notifications**: React Hot Toast (sleek micro-animations)
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Framework**: Node.js + Express.js
- **Database**: MongoDB with Mongoose Schemas
- **Security**: Helmet, MongoDB Sanitizer (`express-mongo-sanitize`), CORS, Express Rate Limit
- **File Uploads**: Multer memory storage and Cloudinary SDK integration

---

## 📦 Project Directory Breakdown

```text
nutritrack/
├── backend/
│   ├── config/            # DB & Cloudinary Configuration
│   ├── controllers/       # MVC Controller Handlers Office
│   ├── middleware/        # JWT Authentication, Uploads & Error pipelines
│   ├── models/            # Mongoose Schemas (User, Meal)
│   ├── routes/            # Express Endpoint Routers
│   ├── services/          # Cloudinary Media SDK service
│   ├── utils/             # Helper classes, error wrappers & JWT generators
│   ├── server.js          # App Bootstrap Entry Point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI (Modals, Pagination, Stat elements)
│   │   ├── context/       # Auth Context & global hook state
│   │   ├── hooks/         # Reusable API loader state hooks
│   │   ├── layouts/       # Main Dashboard layout wrapper
│   │   ├── pages/         # Landing Page, Login, Register, Profile, Analytics, Dashboard
│   │   ├── services/      # Axios HTTP API request index client
│   │   ├── utils/         # Helper functions, formatters & type maps
│   │   ├── App.jsx        # Main routing table
│   │   └── main.jsx
│   └── package.json
```

---

## ⚙️ Development Setup

### 1. Prerequisite
Ensure you have **Node.js (v18+)** and **MongoDB** local service installed and running on your device.

### 2. Configure Environment variables

#### Backend
Create a `.env` file within the `backend/` directory (a template `.env.example` has been provided):
```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/nutritrack
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### Frontend
Create a `.env` file within the `frontend/` directory:
```ini
VITE_API_URL=
```
*(Leave `VITE_API_URL` empty in local development to automatically route requests through the Vite integration proxy configured at `localhost:5000`)*

### 3. Installation & Run

Open two separate terminals, or execute tasks in parallel:

#### Start Backend
```bash
cd backend
npm install
npm run dev
```

#### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

The application will start running on [http://localhost:5173](http://localhost:5173). The API server will be available at [http://localhost:5000](http://localhost:5000).

---

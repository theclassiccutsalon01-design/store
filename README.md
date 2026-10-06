# 💈 The Classic Cut Salon (`the_classsic_cut_salon`)
### Luxury Gentleman Barber & Grooming Experience — Full MERN Stack

A modern, responsive web application built with a **Mobile-First** approach, scaling seamlessly to laptops and desktops. Featuring handcrafted **GSAP ScrollTrigger animations** (precision scissor snips, botanical hair wash with customer character, and razor beard grooming), a **5-Coupon Stamp Loyalty System** with auto-reset & offer coupon generation, live **Admin Content Management System (CMS)**, and dual authentication with **Email OTP + Google OAuth**.

---

## 📸 Media Assets Configured
- **Logo**: Vintage Gentleman Emblem (`imges/logo.jpg`) loaded into branding and favicon.
- **Hero Video**: Autoplay barbershop clip (`video/video1.mp4`) positioned right below the navigation bar.
- **Character**: Gentleman character (`imges/person.webp`) starring in the Hair Wash and Beard Detailing scroll animations.
- **Master Barber / Owner Photo**: Ultra-realistic master barber portrait loaded as placeholder (`owner-placeholder.jpg`), editable live anytime by the Admin.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, GSAP 3 (ScrollTrigger), Lucide Icons, Canvas-Confetti, QRCode.
- **Styling**: Vanilla CSS Design Tokens (Obsidian Charcoal, Vintage Gold, Crimson Red, Glassmorphism).
- **Backend**: Node.js, Express.js REST API.
- **Database**: MongoDB Atlas Cloud + MongoDB Compass viewer (Mongoose ODM).
- **Security**: Helmet, CORS Whitelist, Rate Limiting, Mongo Sanitize, Bcrypt (12 rounds), JWT Tokens.

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
cd "d:\salon website\server"
npm install
npm run dev
```
Backend runs on: `http://localhost:5000`

**Terminal 2 (Frontend Client):**
```bash
cd "d:\salon website\client"
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## ☁️ MongoDB Atlas Cloud + MongoDB Compass Guide (Step-by-Step)

Aapka saara data cloud pe **MongoDB Atlas** me store hoga, aur aap use apne desktop pe **MongoDB Compass** se live dekh sakte hain:

### A. MongoDB Atlas Cloud Setup (Free Tier):
1. [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) par jayein aur **"Try Free"** par click karke free account banayein (ya Google se sign in karein).
2. **Create a Deployment**: **M0 Free Tier** select karein (AWS region jaise Mumbai `ap-south-1` choose karein).
3. **Database Access (User Creation)**:
   - Username create karein: e.g., `admin_salon`
   - Password generate karein: e.g., `SalonPass123` (ise copy karke save rakhein).
   - "Create Database User" par click karein.
4. **Network Access (IP Whitelist)**:
   - "Network Access" tab me jayein -> **"Add IP Address"** par click karein.
   - **"Allow Access from Anywhere"** (`0.0.0.0/0`) select karein taaki aapka cloud database har jagah se connect ho sake.
5. **Get Connection String**:
   - "Database" tab me jayein -> **"Connect"** button dabayein.
   - **"Drivers"** option select karein.
   - Aapko aisi connection string milegi:
     ```
     mongodb+srv://admin_salon:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     ```
   - `<password>` ki jagah apna real password daalein aur database name daalein:
     ```
     mongodb+srv://admin_salon:SalonPass123@cluster0.xxxxx.mongodb.net/classic_cut_salon?retryWrites=true&w=majority
     ```
6. Open karein `server/.env` file aur `MONGODB_URI` me ye URL paste kar dein:
   ```env
   MONGODB_URI=mongodb+srv://admin_salon:SalonPass123@cluster0.xxxxx.mongodb.net/classic_cut_salon?retryWrites=true&w=majority
   ```

### B. MongoDB Compass me Atlas ka Data Dekhna:
1. Apne computer me **MongoDB Compass** application open karein.
2. New Connection me wahi same Atlas connection string paste karein:
   ```
   mongodb+srv://admin_salon:SalonPass123@cluster0.xxxxx.mongodb.net/classic_cut_salon
   ```
3. **"Connect"** par click karein.
4. Compass me aapko `classic_cut_salon` database dikhega jisme saari collections live cloud se load hongi:
   - `users`: Registered customers, stamp counts, verified emails
   - `visitlogs`: Kaunsa customer kab aaya tha (date, time, service taken)
   - `offercoupons`: Active aur redeemed 5-stamp reward vouchers with unique codes
   - `siteconfigs`: Salon name, phone, address, images, hours
   - `services`: Salon menu and rates

---

## 🔑 Google OAuth 2.0 Client ID Setup (Step-by-Step)

Google se Login / Register enable karne ke liye:

1. [console.cloud.google.com](https://console.cloud.google.com/) par jayein aur apne Google account se sign in karein.
2. **Create New Project**:
   - Top left dropdown me **"New Project"** par click karein.
   - Project Name daalein: `Classic Cut Salon` -> Click **Create**.
3. **Configure OAuth Consent Screen**:
   - Left menu me **APIs & Services** -> **OAuth consent screen** par jayein.
   - User Type: **External** select karein -> Click **Create**.
   - App Name: `The Classic Cut Salon`
   - User support email: Apna email select karein.
   - Developer contact email: Apna email daalein -> Click **Save and Continue**.
4. **Create Credentials**:
   - Left menu me **Credentials** par jayein -> Click **+ CREATE CREDENTIALS** -> Select **OAuth client ID**.
   - Application type: **Web application** select karein.
   - Name: `Classic Cut Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://localhost:5000`
     - (Baad me aapki live hosted domain bhi yahan add hogi jaise `https://your-salon.vercel.app`)
   - Click **Create**.
5. Google aapko ek **Client ID** aur **Client Secret** dega:
   - E.g., `1234567890-abcdefg.apps.googleusercontent.com`
6. Open `server/.env` aur credentials paste kar dein:
   ```env
   GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
   ```

*(Note: Application me instant one-click Google simulation bhi enabled hai taaki bina credentials ke bhi testing ho sake).*

---

## 🛡️ Default Admin Credentials

Jab aap pehli baar server start karenge, backend automatically ek default Admin account seed kar dega:
- **Admin Email**: `admin@classiccut.com`
- **Admin Password**: `admin12345`

### Admin Panel Features:
1. **Coupon Stamp Manager**:
   - Customer search by name, mobile or email.
   - One-click **+1 Coupon Stamp** button per visit.
   - 5-Stamp reaching alert: 1x Offer Coupon automatically created and active stamps reset to 0!
   - Full Visit History (kaun kab aaya tha date & time ke sath).
2. **Counter Coupon Redemption**:
   - Customer ka coupon code daalke ya QR scan karke 1-click verify & redeem.
3. **Live Website CMS**:
   - Salon Name, Address, Phone, WhatsApp, Google Map, Hours, Owner Bio/Photo, Hero Video live update.
   - Special Offer Title & Discount percentage edit.
4. **Services & Pricing**:
   - Services add, edit aur delete karein.

---

## 🚢 Deployment & Hosting Instructions

### Frontend Deployment (Vercel):
1. GitHub par project push karein.
2. [vercel.com](https://vercel.com) par jayein aur `client` folder ko import karein.
3. Build Command: `npm run build`, Output Directory: `dist`.
4. Environment variable: `VITE_API_URL=https://your-backend-render.onrender.com/api`.

### Backend Deployment (Render / Railway):
1. [render.com](https://render.com) par jayein -> Create **Web Service**.
2. Root Directory: `server`.
3. Build Command: `npm install`, Start Command: `node server.js`.
4. Add Environment Variables from `server/.env` (`MONGODB_URI`, `JWT_SECRET`, etc.).

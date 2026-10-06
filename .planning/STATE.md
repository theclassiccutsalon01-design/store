# STATE: The Classic Cut Salon

## Current Status
- **Current Phase**: All Phases Completed (Build, Scaffolding, Backend API, GSAP Experience, Loyalty System, Admin CMS, Setup Guides)
- **Status**: Production-Ready, Both Servers Running (Client on port 5173, Server on port 5000)
- **Health Check**: Backend `/api/health` 200 OK, Frontend Vite 200 OK

## Delivered Features
1. **Branding & Assets**:
   - Vintage Logo (`imges/logo.jpg` & `client/public/logo.jpg`) in Navbar & Favicon.
   - Autoplay Hero Video (`video/video1.mp4` & `client/public/video1.mp4`) positioned directly below the navbar.
   - Master Barber photo placeholder generated and loaded into the Owner section (`owner-placeholder.jpg`).
2. **GSAP Scroll Storytelling**:
   - Chapter 1: Precision Scissor blades rotate and snip floating hair strands as user scrolls.
   - Chapter 2: Character (`person.webp`) in hair wash station with shampoo foam lather and water mist particles.
   - Chapter 3: Same character receiving straight razor detailing with foam line clearing and gleam sparks.
3. **5-Coupe Loyalty Engine**:
   - Admin search & "+1 Coupe Stamp" per visit.
   - 5-slot interactive stamp card for users (1/5 to 5/5).
   - When 5th stamp is unlocked: generates 1x Special Offer Coupon (`CUT-XXXXXX`) with QR code, and **automatically resets active stamps to 0** for the next cycle.
   - Complete visit dates log with timestamps.
   - Admin counter coupon redemption.
4. **Admin CMS**:
   - Live edit Salon Name, Tagline, Phone, WhatsApp, Address, Google Map Embed, Hours, Owner Photo/Bio, and Default Reward Title & Discount.
5. **Security & Auth**:
   - Email OTP registration with Nodemailer and dev console fallback.
   - Google OAuth 2.0 with one-click test simulation.
   - Helmet, CORS, Express-Rate-Limit, Bcrypt 12 rounds, JWT tokens.
6. **Guides in README.md**:
   - MongoDB Atlas Cloud creation & connection string setup.
   - MongoDB Compass desktop connection to Atlas cloud.
   - Google Cloud Console OAuth 2.0 Client ID setup.
   - Vercel and Render deployment manuals.

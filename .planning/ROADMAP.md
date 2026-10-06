# ROADMAP: The Classic Cut Salon

## Phase 1: Architecture & Project Scaffolding
- [x] Initialize MERN structure (`client/` Vite React + `server/` Node Express).
- [x] Copy existing assets (`logo.jpg`, `person.webp`, `video1.mp4`, and generated owner portrait) into client public assets.
- [x] Set up Express backend foundation, MongoDB schemas, and security middleware (Helmet, CORS, Rate Limiter).
- [x] Configure CSS Design Tokens (Luxury vintage dark palette: Charcoal #0b0c10, Cream #f7f4ec, Crimson #c52222, Gold #d4af37).

## Phase 2: Backend Core API & Authentication
- [x] Mongoose Models: User, VisitLog, OfferCoupon, SiteConfig, Service, Otp.
- [x] Auth Controller: Email/Password signup, 6-digit OTP delivery/verification, Google OAuth, and Login.
- [x] Loyalty Controller: Admin award visit stamp (+1), auto-generation of Offer coupon at 5 stamps with reset to 0, visit history listing, counter coupon redemption.
- [x] CMS Controller: Get & update site configuration, update owner photo and media, services CRUD.

## Phase 3: Client Experience & GSAP Storytelling Animation
- [x] Luxury Glassmorphism Navbar with vintage logo & mobile slide-out navigation.
- [x] Hero Section with `video1.mp4` autoplay video loop, dark luxury gradient overlay, and call-to-actions.
- [x] **Interactive GSAP Scroll-Triggered Journey**:
  - Chapter 1: Precision Scissor blades dynamically snip floating hair strands on scroll.
  - Chapter 2: Character (`person.webp`) at the wash station with animated shampoo foam and water mist particles.
  - Chapter 3: Same character beard detailing with razor contouring, trim effects, and gleam.
- [x] Services Showcase with dynamic pricing, categories, and booking trigger.
- [x] Owner / Master Barber Section with photo spotlight and quote.
- [x] Interactive Location, Timing & WhatsApp / Call CTA.

## Phase 4: User Loyalty Dashboard & Admin Control Center
- [x] Customer 5-Stamp Card with interactive flip/reveal, progress bar (e.g. 3/5), and unlocked reward coupon vault with QR code.
- [x] Admin Portal:
  - Customer Registry: search by phone/name, view stamps, "+1 Visit Stamp" button.
  - Visit Audit History: table of customer visits with timestamps.
  - Offer Coupon Redemption: verify and redeem customer reward coupons.
  - Site Content CMS: live-edit salon name, phone, address, hours, photos, owner bio, and services.

## Phase 5: Testing, Hardening & Deployment Manual
- [x] Verified zero build errors via `npm run build` in Vite React.
- [x] Backend API online and healthy (`/api/health` 200 OK).
- [x] Comprehensive setup manual: MongoDB Compass local setup guide & MongoDB Atlas cloud setup written in `README.md`.
- [x] Google OAuth 2.0 step-by-step tutorial written in `README.md`.
- [x] Production deployment guides for Vercel and Render written in `README.md`.

# REQUIREMENTS: The Classic Cut Salon

## Functional Requirements

### 1. Branding & Visual Architecture
- [x] **REQ-1.1**: Responsive top Navigation Bar with vintage logo (`imges/logo.jpg`), mobile drawer menu, contact quick-action, and user login/profile pill.
- [x] **REQ-1.2**: Hero Section positioned directly beneath the navbar featuring autoplay/muted loop of `video/video1.mp4` with luxury dark overlay, tagline, and "Book Appointment / Check Loyalty" CTAs.
- [x] **REQ-1.3**: Salon Owner / Master Barber Section with photo (high-res placeholder loaded, easy replacement via Admin CMS) and bio/story.
- [x] **REQ-1.4**: Mobile-first layout styling scaling gracefully to tablet and desktop monitors.

### 2. Custom GSAP Scroll Animation Journey
- [x] **REQ-2.1**: Scissor & Hair Cutting Animation:
  - Responsive SVG shear blades animated using GSAP ScrollTrigger timeline.
  - Interactive cutting snip motion synchronized with scroll progress.
  - Hair strand particles falling organically.
- [x] **REQ-2.2**: Hair Washing Animation:
  - Transition to `imges/person.webp` character seated comfortably.
  - Animated shampoo lather foam bubbles and water spray/mist effects over hair.
- [x] **REQ-2.3**: Beard Trimming & Shaping Animation:
  - Razor blade / trimmer motion styling the beard of `person.webp`.
  - Clean edge lines and glowing after-trim sheen.

### 3. Loyalty Stamp & Coupon System ("Coupe" Engine)
- [x] **REQ-3.1**: User Loyalty Dashboard:
  - Visual 5-stamp card (Slots 1 to 5).
  - Current progress indicator (e.g. 3/5 visits).
  - Rewards vault showing unlocked Offer Coupons with unique redeem codes and QR.
- [x] **REQ-3.2**: Admin Stamp Management:
  - Admin can look up customers by phone number, email, or name.
  - One-click "+1 Visit Stamp" button with optional visit service notes.
  - Real-time audit log of who visited when (date & time).
- [x] **REQ-3.3**: Offer Auto-Generation & Stamp Reset:
  - When user reaches 5 stamps, automatically generate 1 Offer Coupon (e.g., "FREE Royal Cut / 50% Off Grooming").
  - Immediately reset the 5 active visit stamps to 0 for the next cycle.
  - Total lifetime visits count increments permanently.
- [x] **REQ-3.4**: Counter Redemption:
  - Admin can verify and mark an offer coupon as "REDEEMED" at checkout.

### 4. Admin Content Management System (CMS)
- [x] **REQ-4.1**: Live Site Info Editor:
  - Salon Name (`The Classic Cut Salon`), Tagline, Description.
  - Phone Number & WhatsApp quick chat link.
  - Physical Address & Google Maps Embed URL.
  - Operating Hours & Working Days.
- [x] **REQ-4.2**: Media Manager:
  - Update Hero Video link/file.
  - Upload/change Owner photo and bio.
  - Update salon gallery photos.
- [x] **REQ-4.3**: Services & Pricing Catalog:
  - Add, edit, delete salon services with price, duration, category, and description.

### 5. Authentication & Security
- [x] **REQ-5.1**: Email + Password Registration with 6-digit OTP email verification.
- [x] **REQ-5.2**: Google OAuth 2.0 Sign-In / Sign-Up.
- [x] **REQ-5.3**: Secure Admin Authentication with role verification middleware.
- [x] **REQ-5.4**: Hardened Express Security:
  - Rate limiting against OTP brute force and login flooding (`express-rate-limit`).
  - Secure HTTP headers via `helmet`.
  - CORS whitelist configuration.
  - NoSQL injection prevention via `express-mongo-sanitize`.
  - Bcrypt hashing for passwords with 12 salt rounds.

### 6. Deployment & Database Setup Guidance
- [x] **REQ-6.1**: Support for local MongoDB with MongoDB Compass (`mongodb://localhost:27017/classic_cut_salon`).
- [x] **REQ-6.2**: Support for cloud MongoDB Atlas cluster connection string.
- [x] **REQ-6.3**: Production environment configuration template (`.env.example`) and deployment instructions for Vercel/Render.

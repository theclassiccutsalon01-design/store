# PROJECT: The Classic Cut Salon (MERN Stack Luxury Experience)

## Overview
**The Classic Cut Salon** (`the_classsic_cut_salon`) is a luxury men's salon web application built using the full **MERN Stack (MongoDB, Express, React, Node.js)**. The application is built with a **Mobile-First Responsive** architecture and scales seamlessly to tablets and desktop screens. It delivers a bespoke, non-AI-generated visual feel powered by handcrafted **GSAP ScrollTrigger** interactive storytelling animations.

## Core Pillars
1. **Bespoke Interactive Barber Experience (GSAP)**:
   - Dynamic scroll-scrubbed animated scissor cutting hair strands.
   - Smooth transition to character (`person.webp`) enjoying a refreshing hair wash with lather & water effects.
   - Continuation to beard trimming & straight razor grooming with gleam finish.
   - Hero video (`video1.mp4`) prominently positioned directly beneath the navigation bar.
2. **Visit Stamp & Loyalty Offer Engine ("Coupe" System)**:
   - Admin awards 1 visit stamp per salon visit.
   - Interactive 5-stamp loyalty card for users (1 to 5 stamps).
   - Upon reaching 5 stamps, automatically awards a 1x Reward Offer Coupon (e.g. Free Haircut or 50% Off) and resets the 5 stamps to 0 for the next cycle.
   - Admin view of all users, their stamps count, visit logs with timestamps, and counter coupon redemption.
3. **Full Admin CMS (Dynamic Site Control)**:
   - Admin can update salon name, contact numbers, address, Google Maps location, opening hours.
   - Admin can update photos, owner photo & bio, promo video, and salon services catalog with pricing.
4. **Modern Authentication & Enterprise Security**:
   - Email/Password with 6-digit OTP verification.
   - Google OAuth registration and login.
   - Role-based authorization (`admin` vs `user`).
   - Rate limiting, Helmet HTTP headers, CORS whitelisting, Bcrypt password hashing, and NoSQL injection protection.
   - Production deployment readiness (Vercel + Render + MongoDB Atlas / Compass).

## Brand & Assets
- **Salon Name**: The Classic Cut Salon (`the_classsic_cut_salon`)
- **Logo**: Vintage Gentleman Emblem (`imges/logo.jpg`)
- **Hero Video**: Autoplay barbershop clip (`video/video1.mp4`)
- **Character Asset**: Friendly modern man illustration (`imges/person.webp`)
- **Owner Portrait**: Luxury Master Barber portrait (placeholder generated, ready for real photo replacement)

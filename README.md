# Jahnon On Wheels - Frontend Application 🚀

This repository contains the **Frontend Source Code** for **Jahnon On Wheels**, a real-world, high-volume food catering and delivery service handling simultaneous orders during peak Saturday shifts.

> ⚠️ **Note:** This is a sanitized "Mirror" repository. Sensitive information such as Google API Keys, production environment variables, and authentication secrets have been removed for security purposes. The architecture, components, and logic remain intact.

## 🔗 Live Website
[Click Here to Visit](https://jahnonnweels.netlify.app/)
*(The Manager Dashboard is restricted to authenticated employees only).*

## 🎥 Video Walkthrough (Full System)
Watch the system in action: [System Walkthrough Video](#)

---

## 🛠 Tech Stack
- **React 18** (Vite)
- **TypeScript** (Strict Mode)
- **Progressive Web App (PWA)** for easy installation on mobile devices.
- **Redux Toolkit** for complex global state management (Cart, History, auth roles).
- **Google Places SDK** for dynamic, real-time fetching of business reviews.

---

## 🏗 System Architecture & Key Features

### 1. Customer Portal (PWA)
A highly polished, mobile-first interface allowing customers to:
- Browse dynamic menus and place pickup or delivery orders.
- Utilize Google Authentication or One-Time Passwords (OTP) via WhatsApp to log in.
- View past order history and reorder items seamlessly.
- **PWA Capabilities:** Customers can install the app to their home screens, taking advantage of local caching (`vite-plugin-pwa`), standalone UI, and faster load times.

### 2. Live Google Reviews Integration
Built entirely without third-party plugins. The app natively hooks into the **Google Maps JavaScript API** to fetch the business's latest Top-Rated reviews (`>4.0 stars`) and displays them in a modern, animated grid on the homepage.
- Bypasses CORS and Adblocker restrictions by using the native Places Library.
- Implements robust error boundaries with static fallback reviews gracefully.

### 3. Glassmorphism UI & Premium UX
- The User Interface was meticulously crafted using CSS variables and modern layout techniques (`clamp()`, `grid`).
- Includes a premium transparent Header with backdrop-blur, animated dropdown menus, and CSS micro-interactions for button hovers.
- Full viewport optimization ensuring a native app feel on mobile platforms (e.g., hidden scrollbars, overscroll-behavior control).

### 4. Admin / Employee Dashboard
A secured portal accessible only to authorized personnel:
- **Order Management:** Real-time visibility of incoming orders fetched from the Django backend. Includes state changes ("In Progress", "Ready", "Delivered").
- **Live Inventory (SSE):** The frontend listens to Server-Sent Events from the backend to instantly update available stock across different POS locations (Yavne vs. Ayyanot) without polling.
- **Role-Based Access Control:** Differentiates between `manager` and `worker` permissions, granting access to financial reports vs. operational screens.

---

## ⚙️ Running Locally
To run this project locally:

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your backend URL:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

*Designed and Developed by [Shaked Goren](https://github.com/shakedgoren)*

# Fresh Grocery Landing Page

A clean, responsive e-commerce grocery landing page built with pure semantic HTML5 and modern CSS3.

---

## Features

* **Storefront Discovery:** Includes live product suggestions, category filters, price/popularity/freshness sorting, package-size pricing with per-kilogram comparisons for weight-based options, explicit per-piece/head prices, stock and freshness labels, and quick product details.
* **Persistent Cart:** Product cards have inline quantity controls; the cart icon opens a slide-over cart with quantity controls, delivery totals, and free-delivery progress. Cart items persist in local storage and remain available on the full cart and checkout pages.
* **Promotions & Delivery Demo:** The `FRESH30` code applies 30% off eligible $20+ checkout subtotals (maximum $10). The landing-page ZIP checker validates six-digit formatting only; it does not check delivery coverage. Delivery windows are demonstrations and are not connected to a live delivery service.
* **Vibrant Hero Section:** Features a softened light background, pill-style navigation with search, promotional headline, call-to-action button, floating informational badges (e.g., *UPTO 30% Off*, *Fast Delivery*, and *230+ Happy Customers*), and an image carousel with automatic rotation and clickable pagination.
* **Social Follow Bar:** Vertical "Follow us On" bar positioned along the side with social link icons.
* **Demo Checkout:** A delivery-details form with scheduled demo delivery windows, UPI/cash-on-delivery choices, promo-code entry, and an order summary; no card details are collected and no payment is processed.
* **Demo Content:** Product origins, stock levels, freshness labels, delivery availability, offer terms, store metrics, ratings, testimonials, and draft policy pages are sample content and must be verified or replaced before a live launch.
* **Testimonials Card:** A centered client review card featuring an avatar placeholder, reviewer details, star rating, and distinct decorative corner tabs.
* **Responsive Layout:** Adapts smoothly across desktop, tablet, and mobile screen sizes using CSS Flexbox.

---

## File Structure

```text
├── index.html
├── assets/
├── pages/
│   ├── cart.html
│   ├── payment.html
│   ├── policy.html
│   ├── refund.html
│   └── terms.html
├── src/
│   ├── css/
│   │   ├── cart.css
│   │   ├── payment.css
│   │   ├── policy.css
│   │   └── style.css
│   └── js/
│       ├── cart-page.js
│       ├── payment.js
│       └── script.js
└── README.md

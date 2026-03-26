# DashDish

A full-stack food delivery mobile application built with React Native and Expo, featuring real-time order tracking, live driver location updates, and a complete dual-role system for customers and drivers.

> Built as a portfolio project targeting the Nigerian market (Lagos) demonstrating production-grade mobile development patterns including real-time data sync, GPS tracking, animated map interactions, and a robust simulation engine for demo purposes.

---

## Demo video
Watch here: https://youtube.com/shorts/NLNUNUgyd7s?feature=share

## Features

### Customer
- Browse restaurants with category filters and search
- Add items to cart with quantity controls
- Geocoded delivery address input with saved address auto-fill from profile
- Paystack payment integration (web inline popup + native WebView)
- Real-time order tracking with animated driver marker on Mapbox
- Collapsible bottom sheet on tracking screen (drag up/down to reveal map)
- Driver profile card showing avatar, star rating, vehicle info, and delivery count
- Rating modal after delivery (1–5 stars)
- Order history with status timeline

### Driver
- Real-time order request feed via Supabase Realtime
- Swipe right to accept / swipe left to decline (with background reveal animation)
- Persistent decline — declined orders stay hidden across logout/login via Supabase
- Active delivery screen with live GPS tracking, route polyline, and status update buttons
- Earnings dashboard with weekly bar chart, period selector, and delivery history
- Distance calculation using the Haversine formula (no extra API calls)
- Profile with avatar upload, vehicle info, and online/offline toggle

### System
- Dual-role authentication (customer / driver) via Supabase Auth
- 10-second simulation window — orders sit as `placed` giving real drivers a chance to accept before the simulation kicks in
- Smooth driver marker animation using `requestAnimationFrame` interpolation (1800ms ease-in-out between GPS updates)
- Error boundaries on all critical screens — a crash in one screen doesn't affect the rest of the app
- Row Level Security on all Supabase tables

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 + Expo Router v6 (file-based routing) |
| Language | TypeScript |
| Styling | twrnc (Tailwind React Native Classnames) — no StyleSheet |
| State Management | Zustand |
| Backend | Supabase (PostgreSQL + Realtime + Storage + Auth) |
| Maps | Mapbox (`@rnmapbox/maps`) |
| Payments | Paystack (`react-native-paystack-webview` + web inline JS) |
| Location | `expo-location` (foreground GPS watching) |
| Image Uploads | `expo-image-picker` + Supabase Storage |
| Testing | Jest + React Native Testing Library + jest-expo |
| Font | Montserrat (all weights via `expo-font`) |

---

## Project Structure

```
dashdish/
├── app/
│   ├── _layout.tsx                      # Root layout — auth gate, font loading, error boundary
│   ├── index.tsx                        # Role-based redirect (customer / driver)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── role-select.tsx
│   ├── (customer)/
│   │   ├── _layout.tsx                  # Stack wrapping tabs + stack screens
│   │   ├── checkout.tsx                 # Address geocoding + saved address button
│   │   ├── payment.tsx                  # Paystack web popup + native WebView
│   │   ├── restaurant/[id].tsx          # Menu screen
│   │   ├── tracking/[orderId].tsx       # Live tracking + collapsible bottom sheet
│   │   └── (tabs)/
│   │       ├── _layout.tsx              # Glass tab bar (Home, Orders, Cart, Profile)
│   │       ├── index.tsx                # Restaurant list + search + category filters
│   │       ├── orders.tsx               # Order history
│   │       ├── cart.tsx
│   │       └── profile.tsx              # Avatar upload + saved address + stats
│   └── (driver)/
│       ├── _layout.tsx                  # Stack: (tabs) + active screen
│       ├── active.tsx                   # Live GPS + route polyline + status buttons
│       └── (tabs)/
│           ├── _layout.tsx              # Glass tab bar (Home, Earnings, Profile)
│           ├── index.tsx                # Request feed with swipe accept/decline
│           ├── earnings.tsx             # Weekly chart + stats + delivery history
│           └── profile.tsx              # Avatar upload + vehicle info + online toggle
│
├── components/
│   ├── ErrorBoundary.tsx                # Class component — retry + go back
│   ├── ProfileField.tsx                 # Reusable editable profile field
│   ├── auth/
│   │   └── role-select.tsx
│   ├── driver/
│   │   ├── DriverCard.tsx               # Driver info card shown on customer tracking screen
│   │   ├── RequestCard.tsx              # Order request card with pulsing dot + stats row
│   │   ├── earnings/
│   │   │   ├── BarChart.tsx
│   │   │   ├── DeliveryRow.tsx
│   │   │   ├── EarningsHero.tsx
│   │   │   ├── EarningsStats.tsx
│   │   │   ├── haversine.ts             # Haversine distance formula
│   │   │   └── PeriodSelector.tsx
│   │   └── profile/
│   │       ├── Divider.tsx
│   │       └── FieldRow.tsx
│   ├── maps/
│   │   ├── DeliveryMap.tsx              # Composes all map sub-components + web fallback
│   │   ├── DriverMarker.tsx             # ShapeSource + CircleLayer + SymbolLayer
│   │   ├── RestaurantMarker.tsx         # PointAnnotation with restaurant icon
│   │   ├── RoutePolyline.tsx            # ShapeSource + LineLayer
│   │   └── WebMap.tsx                   # Static Mapbox image fallback for web
│   ├── order/
│   │   ├── OrderCard.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   ├── OrderStatusBar.tsx
│   │   ├── OrderSummary.tsx
│   │   └── OrderTimeline.tsx
│   ├── restaurant/
│   │   ├── MenuCategory.tsx
│   │   ├── MenuItem.tsx
│   │   └── RestaurantCard.tsx
│   └── ui/
│       ├── AppText.tsx                  # Custom Text with weight prop (Montserrat)
│       ├── Avatar.tsx                   # Initials fallback with color hash + image upload
│       ├── Badge.tsx
│       ├── ErrorState.tsx
│       ├── Input.tsx
│       ├── SkeletonCard.tsx
│       └── modal/
│           └── RatingModal.tsx          # Star rating modal after delivery
│
├── hooks/
│   ├── useBottomSheet.ts                # Animated bottom sheet snap logic
│   ├── useDriver.ts                     # Pending orders + Realtime + persistent decline
│   ├── useDriverLocation.ts             # GPS watch + broadcast to Supabase every 3s
│   ├── useDriverProfile.ts              # Driver profile + avg rating + delivery count
│   ├── useDriverTracking.ts             # Driver location subscription (customer side)
│   ├── useOrder.ts                      # Fetch order + Realtime status subscription
│   ├── useRatingModal.ts                # Rating modal show/hide logic
│   └── useSmoothedLocation.ts           # requestAnimationFrame interpolation between GPS points
│
├── services/
│   ├── supabase.ts                      # Supabase client init
│   ├── auth.service.ts
│   ├── driver.service.ts                # acceptOrder, declineOrder, updateDeliveryStatus
│   ├── mapbox.service.ts                # getRoute, forwardGeocode, subscribeToDriverLocation
│   ├── order.service.ts                 # createOrder, getOrderById, getCustomerOrders
│   └── restaurant.service.ts
│
├── store/
│   ├── useAuthStore.ts                  # session, profile, setProfile, clearAuth
│   ├── useCartStore.ts                  # items, restaurantId, restaurantLat/Lng
│   ├── useOrderStore.ts                 # activeOrder, updateActiveOrderStatus
│   └── useDriverStore.ts                # activeDelivery, isOnline, currentLocation
│
├── types/
│   ├── auth.types.ts
│   ├── database.types.ts                # Full Supabase schema types
│   ├── driver.types.ts
│   ├── order.types.ts
│   └── restaurant.types.ts
│
├── constants/
│   ├── colors.ts                        # Design system color tokens
│   ├── config.ts                        # farePerKm, minimumFare, simulation delays
│   ├── delivery.ts
│   ├── mapbox.ts
│   └── orderTracking.ts
│
├── utils/
│   ├── calculateFare.ts                 # farePerKm * distance, minimum fare floor
│   ├── formatCurrency.ts                # Intl.NumberFormat NGN
│   ├── getOrderStatus.ts
│   ├── simulateDelivery.ts              # Full delivery lifecycle simulation engine
│   └── tw.ts
│
├── __tests__/
│   ├── utils/
│   │   ├── formatCurrency.test.ts
│   │   ├── calculateFare.test.ts
│   │   ├── haversineKm.test.ts
│   │   └── simulateDelivery.test.ts
│   └── hooks/
│       ├── useOrder.test.ts
│       └── useDriver.test.ts
│
├── babel.config.js
├── jest.config.js
├── jest.setup.js
├── metro.config.js                      # CSS shim for mapbox-gl web compatibility
└── emptyModule.js                       # CSS redirect target for Metro
```

---

## Database Schema

```sql
profiles         -- id, full_name, phone, avatar_url, role, address, vehicle_info
restaurants      -- id, name, category, rating, delivery_time, lat, lng, image_url
menu_categories  -- id, restaurant_id, name, order_index
menu_items       -- id, category_id, restaurant_id, name, price, image_url
orders           -- id, customer_id, driver_id, restaurant_id, status, delivery_lat/lng
order_items      -- id, order_id, menu_item_id, quantity, unit_price
driver_locations -- id, driver_id, lat, lng, is_online, updated_at
driver_ratings   -- id, order_id, driver_id, customer_id, rating (1–5)
declined_orders  -- id, driver_id, order_id (persists declined requests across sessions)
```

**Order status flow:**
```
placed → confirmed → preparing → picked_up → on_the_way → delivered
```

**Realtime enabled on:** `orders`, `driver_locations`

---

## Architecture Decisions

### Simulation Engine (`utils/simulateDelivery.ts`)
Orders are created as `placed` with no `driver_id`. Payment triggers a `setTimeout` of 10 seconds before simulation starts — giving real drivers a window to accept. When the simulation fires:
1. `isOrderStillUnassigned()` checks if a real driver already accepted — bails if so
2. Assigns simulated driver atomically using `.is('driver_id', null)` to prevent race conditions
3. Animates through all status phases with GPS movement (12 steps × 1.5s to restaurant, 20 steps × 2s to delivery)

### Smooth Driver Animation (`hooks/useSmoothedLocation.ts`)
Raw GPS updates every ~2–3 seconds would cause the marker to jump. This hook uses `requestAnimationFrame` to interpolate between the previous and new coordinates over 1800ms with an ease-in-out curve. The driver marker uses `ShapeSource` + `CircleLayer` (not `PointAnnotation`) to enable GPU-side animation with no re-renders.

### Persistent Decline (`hooks/useDriver.ts` + `declined_orders` table)
Declined order IDs are written to Supabase so they survive logout and work across devices. `getPendingOrders` filters them server-side on every fetch. A local `useRef` Set provides optimistic UI — the card disappears instantly before the async DB write completes.

### Error Boundaries (`components/ErrorBoundary.tsx`)
A global boundary wraps the root layout as last resort. Per-screen boundaries on tracking, active delivery, restaurant, orders, and profile screens mean a crash in one screen doesn't affect others. In `__DEV__` mode the raw error message is shown for faster debugging.

### Glass Tab Bar
Both customer and driver tab bars use `BlurView` + frosted overlay + border overlay with pure twrnc — no `StyleSheet` anywhere in the project. The active tab has a 2.5px pill indicator and a subtle primary color background.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Android Studio (for Android dev build)
- Supabase account
- Mapbox account
- Paystack account (test keys work)

### Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_PAYSTACK_KEY=your_paystack_public_key
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
MAPBOX_DOWNLOADS_TOKEN=your_mapbox_downloads_token
```

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/dashdish.git
cd dashdish

# Install dependencies
npm install --legacy-peer-deps
```

### First Build (Required — native modules need compiling)

```bash
# Android
npx expo run:android
```

> **Note:** A native dev build is required because the app uses `@rnmapbox/maps`, `expo-location`, and `expo-image-picker` which contain native code. Expo Go will not work.

### Subsequent Runs

```bash
npx expo start --dev-client
```

### Database Setup

Run in your Supabase SQL editor:

1. Create all tables with the schema above
2. Enable RLS on every table
3. Enable Realtime on `orders` and `driver_locations`
4. Create `avatars` storage bucket (set to public)
5. Add RLS policies for storage (users can upload to their own path)

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test suites:**

| File | What's tested |
|---|---|
| `formatCurrency.test.ts` | NGN formatting, zero, large amounts, no decimals |
| `calculateFare.test.ts` | Fare calculation, minimum fare floor, correct per-km rate |
| `haversineKm.test.ts` | Distance accuracy, symmetry, zero distance, cross-hemisphere |
| `simulateDelivery.test.ts` | Interpolation linearity, jitter bounds, cancel function |
| `useOrder.test.ts` | Fetch, cache hit skip, Realtime subscribe/unsubscribe, setOrder |
| `useDriver.test.ts` | Orders fetch, decline optimistic + DB persist, Realtime, refresh |

---

## Demo Flow

### Option A — Real Driver (two devices / emulators)
1. Customer places and pays for an order
2. Driver sees it appear on their home screen in real-time
3. Driver swipes right to accept → navigates to active delivery screen
4. Customer tracking screen shows driver assigned with live location
5. Driver taps: **Mark as Picked Up** → **Start Delivery** → **Mark as Delivered**
6. Customer sees each status update live on tracking screen
7. Rating modal appears after delivery

### Option B — Simulation (solo demo)
1. Customer places an order
2. Wait 10 seconds — simulation kicks in automatically
3. Driver marker animates smoothly across the map toward the delivery address
4. Status updates in real-time on the customer tracking screen
5. Rating modal appears on delivery

### Paystack Test Card
```
Card Number : 4084 0840 8408 4081
CVV         : 408
Expiry      : Any future date
PIN         : 0000
OTP         : 123456
```

---

## Key Dependencies

```json
{
  "expo": "~54.0.0",
  "expo-router": "~6.0.23",
  "@rnmapbox/maps": "^10.2.10",
  "@supabase/supabase-js": "^2.98.0",
  "zustand": "^5.0.11",
  "twrnc": "^4.16.0",
  "react-native-paystack-webview": "^5.0.3",
  "expo-location": "~19.0.8",
  "expo-image-picker": "^55.0.12",
  "expo-blur": "~15.0.8",
  "@tanstack/react-query": "^5.90.21"
}
```

---

## Security

- All database tables have Row Level Security enabled
- Customers can only read/write their own orders and order items
- Drivers can see unassigned orders (`driver_id IS NULL`) and their own accepted orders
- Simulation uses `.is('driver_id', null)` atomic guard to prevent race conditions on concurrent accepts
- Avatar uploads are scoped to the authenticated user's ID in Supabase Storage
- Declined orders are RLS-scoped — drivers can only see and write their own declines

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

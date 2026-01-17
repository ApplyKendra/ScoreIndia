# Project Blueprint: ISKCON Digital Ecosystem
**Version:** 2.0
**Target Framework:** Next.js (Frontend) + NestJS (Backend)
**Database:** PostgreSQL (Cloud Managed)
**Caching:** Redis (Cloud Managed)

---

## 1. Core Architecture & Tech Stack

### A. Frontend (Client Side)
- **Framework:** Next.js 15+ (App Router).
- **Language:** TypeScript.
- **Styling:** Tailwind CSS + ShadCN UI (for consistent, clean, spiritual aesthetic).
- **State Management:** Zustand (for Cart/Session).
- **Data Fetching:** TanStack Query (React Query) for caching API calls.

### B. Backend (Server Side)
- **Framework:** NestJS (Modular Monolith).
- **ORM:** Prisma (for PostgreSQL).
- **Validation:** Zod + Class Validator.
- **Queue System:** BullMQ (backed by Redis) for handling order emails and notifications.

### C. Infrastructure
- **Database:** PostgreSQL (e.g., Neon/AWS RDS).
- **Cache:** Redis (e.g., Upstash/AWS ElastiCache). Used for:
  - Caching "Store" catalog (low write, high read).
  - Storing User Sessions (JWT whitelist).
  - Managing "Live Darshan" stream status.

---

## 2. Access Control (RBAC) & Roles

**Strategy:** The system has three distinct tiers.
1.  **SUPER_ADMIN (Main Admin):**
    -   *Capabilities:* Full system access. Can create/delete `SUB_ADMIN` accounts. Access to all financial logs.
2.  **SUB_ADMIN:**
    -   *Capabilities:* Content management only. Can update Prasadam Menu, Store Items, Youth Events. Cannot manage other admins or see sensitive platform settings.
3.  **USER:**
    -   *Capabilities:* Public access. Can order Prasadam, view store, donate.

---

## 3. Detailed Feature Specifications

### Module 1: Prasadam Ordering (Transactional)
- **User View:**
  -   Menu categories (Breakfast, Raj-Bhog, Dinner, Sweets).
  -   "Add to Cart" functionality.
  -   Checkout with Payment Gateway integration (Razorpay/Stripe).
  -   Delivery options: "Pickup at Temple" or "Local Delivery".
- **Admin View:**
  -   Order Management Dashboard (Accept/Reject/Mark Ready).
  -   Inventory toggle (Mark items "Out of Stock").

### Module 2: Temple Store (Catalog Only)
- **User View:**
  -   Grid view of items (Books, Beads, Deities).
  -   **No Buy Button.** Action button: "Check Availability" (opens WhatsApp/Contact Form).
  -   Search & Filter (by Author, Language, Material).
- **Admin View:**
  -   CRUD operations for items (Upload photo, set description, price reference).

### Module 3: Youth Forum (IYF)
- **Features:**
  -   **Event Registration:** Sign up for camps/retreats.
  -   **Media Gallery:** Photos/Videos of past youth festivals.
  -   **Blog:** Articles relevant to modern youth & spirituality.

---

## 4. Database Schema Structure (Prisma)

Use this logic to build the `schema.prisma` file.

```prisma
// Enums
enum Role {
  USER
  SUB_ADMIN
  SUPER_ADMIN
}

enum OrderStatus {
  PENDING
  PREPARING
  READY
  COMPLETED
  CANCELLED
}

// Models
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String    // Hashed
  name          String
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  
  // Relations
  orders        PrasadamOrder[]
  registrations YouthEventRegistration[]
}

model PrasadamItem {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Decimal
  isAvailable Boolean  @default(true)
  category    String   // e.g., "Sweets", "Lunch"
  imageUrl    String?
}

model PrasadamOrder {
  id          String      @id @default(uuid())
  user        User        @relation(fields: [userId], references: [id])
  userId      String
  status      OrderStatus @default(PENDING)
  totalAmount Decimal
  items       Json        // Storing snapshot of items for simplicity
  createdAt   DateTime    @default(now())
}

model StoreItem {
  id          String   @id @default(uuid())
  name        String
  description String
  category    String
  imageUrl    String
  inStock     Boolean  @default(true)
  // No price required if strictly informational, but good to have reference
  displayPrice Decimal? 
}

model YouthEvent {
  id          String   @id @default(uuid())
  title       String
  date        DateTime
  location    String
  description String
  registrations YouthEventRegistration[]
}

model YouthEventRegistration {
  id        String   @id @default(uuid())
  event     YouthEvent @relation(fields: [eventId], references: [id])
  eventId   String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
}
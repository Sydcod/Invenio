# MoneyMind: Comprehensive Development Plan

This document provides a granular, step-by-step roadmap for building the MoneyMind application, based on the full project scope defined in the research files.

---

## Phase 1: Foundation & Technical Setup

**Goal:** Prepare the boilerplate codebase for custom development by integrating the new design system, setting up the database, and establishing core backend utilities.

### Milestone 1.1: Design System & Dependencies
-   [x] **Install Core Design Libraries:** `npm install framer-motion class-variance-authority clsx tailwind-merge lucide-react`
-   [x] **Install Animation Libraries:** `npm install vanta three gsap`
-   [x] **Configure `tailwind.config.js`:**
    -   [x] Add custom color palette (primary, secondary, accent, etc.) from research.
    -   [x] Add `Inter` font family.
    -   [x] Define custom animations (e.g., staggered reveal, blur-in) for reuse.
-   [x] **Create UI Utility (`/libs/utils.ts`):** Set up `cn` function for merging Tailwind classes.
-   [x] **Test - Dev Server:** Run `npm run dev` to confirm the app builds successfully with all new dependencies.

### Milestone 1.2: Database & Models
-   [ ] **Configure MongoDB Connection:** Set up Mongoose connection utility in `/libs/db/mongoose.ts` using credentials from `.env`.
-   [ ] **Define Database Schemas (`/models/*.ts`):**
    -   [ ] `User.ts`: Define user schema (name, email, password, subscription tier, etc.).
    -   [ ] `Document.ts`: Schema for uploaded documents (userId, fileName, storageUrl, status, etc.).
    -   [ ] `Transaction.ts`: Schema for financial transactions (userId, documentId, date, description, amount, category, etc.).
    -   [ ] `Category.ts`: Schema for user-defined spending categories.
-   [ ] **Create Seeding Script (`/scripts/seed-categories.ts`):** Write a script to populate the database with default transaction categories.
-   [ ] **Test - Database Connection:** Create a test script or API endpoint to verify successful connection to MongoDB Atlas.

---

## Phase 2: Landing Page & User Onboarding

**Goal:** Replace the generic boilerplate landing page and implement a seamless, secure user authentication flow.

### Milestone 2.1: Landing Page Transformation
-   [ ] **Component-by-Component Replacement:**
    -   [ ] **`Hero.tsx`:** Rebuild with Vanta.js background, animated headline (React Bits/GSAP), and custom CTA buttons.
    -   [ ] **`ValueProposition.tsx`:** Build Bento Grid layout with animated cards.
    -   [ ] **`SocialProof.tsx`:** Build infinite marquee for testimonials and animated star ratings.
    -   [ ] **`ProductShowcase.tsx`:** Build animated terminal to simulate AI analysis.
    -   [ ] **`Pricing.tsx`:** Rebuild with custom styles and link to Stripe checkout.
    -   [ ] **`FAQ.tsx`:** Rebuild with custom accordion animations.
    -   [ ] **`CTA.tsx` & `Footer.tsx`:** Rebuild with custom designs.
-   [ ] **Test - Landing Page:** Full visual and functional review. Test responsiveness, animations, performance (Lighthouse score), and all links.

### Milestone 2.2: Authentication
-   [ ] **Configure NextAuth.js:** Set up providers (Google, Email Magic Link) in `[...nextauth].ts`.
-   [ ] **Create Custom Auth Pages:**
    -   [ ] `(auth)/login/page.tsx`: Build custom login form.
    -   [ ] `(auth)/register/page.tsx`: Build custom registration form.
-   [ ] **Implement Transactional Emails (Resend):**
    -   [ ] Set up Resend integration.
    -   [ ] Implement "Magic Link" sign-in email.
    -   [ ] Implement "Welcome" email upon registration.
-   [ ] **Test - Authentication Flow:**
    -   [ ] Test registration and login with both Google and email.
    -   [ ] Verify that user sessions are created and persisted correctly.
    -   [ ] Confirm emails are sent and links work as expected.

---

## Phase 3: Core Application MVP

**Goal:** Build the core product experience: document upload, AI processing, and data visualization.

### Milestone 3.1: Document Management
-   [ ] **Build Dashboard UI (`/app/dashboard/page.tsx`):** Create the main layout for logged-in users.
-   [ ] **Build Document Upload UI:** Implement a file dropzone with loading states and progress indicators.
-   [ ] **Build Document Upload API (`/api/documents/upload`):**
    -   [ ] API endpoint to receive file uploads.
    -   [ ] Logic to stream file to Cloudflare R2 for storage.
    -   [ ] Create a `Document` record in MongoDB with `status: 'uploaded'`.
    -   [ ] Add the document processing job to a queue (Upstash Redis).
-   [ ] **Test - Document Upload:** Upload PDF and CSV files. Verify they appear in Cloudflare R2 and a corresponding record is created in MongoDB.

### Milestone 3.2: AI Processing Pipeline
-   [ ] **Create Document Processing Worker:** A serverless function triggered by the Redis queue.
    -   [ ] Fetches the document from R2.
    -   [ ] Implements OCR/parsing logic.
    -   [ ] Calls OpenAI API with a structured prompt to extract transactions.
    -   [ ] Updates document status to `status: 'processing'` then `status: 'complete'` or `status: 'failed'`.
-   [ ] **Save Transactions to DB:** The worker saves the extracted transactions to the `transactions` collection in MongoDB.
-   [ ] **Test - AI Pipeline:** Manually trigger the worker with a sample document. Verify transactions are extracted and saved correctly to the database.

### Milestone 3.3: Data Visualization
-   [ ] **Create Transaction List API (`/api/transactions`):** Endpoint to fetch transactions for the logged-in user.
-   [ ] **Build Transaction View UI:** Display transactions in a sortable, filterable table on the dashboard.
-   [ ] **Build Insights Dashboard:** Create basic charts and stats (e.g., spending by category) on the dashboard.
-   [ ] **Test - Dashboard:** Log in as a user with processed transactions. Verify all data is displayed correctly and charts are accurate.

---

## Phase 4: Advanced AI Features & Launch Prep

**Goal:** Implement the advanced AI chat feature, polish the application, and prepare for launch.

### Milestone 4.1: Conversational AI Assistant
-   [ ] **Build Chat UI:** Create the chat interface components (`ChatInterface.tsx`, `MessageBubble.tsx`, etc.).
-   [ ] **Implement Vector Embeddings:** When processing documents, create and store vector embeddings of transactions (using Pinecone/other) for semantic search.
-   [ ] **Build Chat API (`/api/ai/chat`):**
    -   [ ] Use LangChain.js to create a retrieval chain.
    -   [ ] The chain will take a user's question, find relevant transactions from the vector store, and use an LLM to generate a natural language answer.
-   [ ] **Test - AI Chat:** Ask various questions about spending. Test for accuracy, context awareness, and performance.

### Milestone 4.2: Final Polish & Deployment
-   [ ] **Implement Stripe Payments:** Integrate Stripe Checkout for Pro/Premium subscription tiers.
-   [ ] **Security Audit:** Review for common vulnerabilities (XSS, CSRF, etc.). Ensure RBAC is enforced.
-   [ ] **Performance Optimization:** Bundle analysis, code splitting, image optimization.
-   [ ] **Configure SEO:** Finalize `next-sitemap.config.js` and metadata across all pages.
-   [ ] **Deployment:** Deploy the application to Vercel.
-   [ ] **Test - Staging/Production:** Conduct end-to-end testing on the deployed application.


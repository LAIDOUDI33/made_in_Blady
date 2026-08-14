# AlgeriaTrade.dz Phase 2 - Reviews & Ratings System

## Overview
Complete implementation of a comprehensive product and company review system for the Algerian B2B marketplace.

## Database Schema (Updated)

### Review Model (Enhanced)
- **New fields added:**
  - `orderId` - For verified purchase tracking
  - `pros` / `cons` - JSON arrays for pros/cons lists
  - `categoryRatings` - JSON object for company category ratings
  - `images` - JSON array of image URLs
  - `isVerifiedPurchase`, `isAnonymous`, `isFeatured` - Boolean flags
  - `helpfulCount`, `notHelpfulCount` - Voting counts
  - `status` - published/pending/rejected/hidden/flagged
  - `reportedAt`, `reportReason` - Moderation fields
  - `response`, `respondedAt`, `respondedBy` - Supplier response

### ReviewVote Model (New)
- Tracks user votes (helpful/not_helpful)
- Unique constraint on (reviewId, userId, type)

## API Routes Created

### Product Reviews
- **`GET /api/products/[slug]/reviews`** - List reviews with pagination, sorting, filtering
- **`POST /api/products/[slug]/reviews`** - Submit new product review

### Review CRUD
- **`GET /api/reviews/[reviewId]`** - Get single review details
- **`PUT /api/reviews/[reviewId]`** - Update own review (24h edit window)
- **`DELETE /api/reviews/[reviewId]`** - Delete review

### Voting & Reporting
- **`POST/GET /api/reviews/[reviewId]/vote`** - Toggle helpful/not-helpful vote
- **`POST /api/reviews/[reviewId]/report`** - Report inappropriate content

### Company Reviews
- **`GET /api/companies/[slug]/reviews`** - List with category breakdowns
- **`POST /api/companies/[slug]/reviews`** - Submit company review with categories
- **`POST/DELETE /api/companies/[slug]/reviews/respond`** - Supplier response

### Admin
- **`GET /api/admin/reviews`** - List all with filters (status, type, reported)
- **`PATCH /api/admin/reviews`** - Bulk approve/reject/hide
- **`DELETE /api/admin/reviews`** - Remove review

## Components Built

### StarRating (`src/components/reviews/StarRating.tsx`)
- Interactive star rating input (1-5 stars)
- Half-star support for display mode
- Size variants: sm, md, lg, xl
- French decimal format (4,5 sur 5)
- Exported variants: StarRatingDisplay, StarRatingLarge

### ReviewCard (`src/components/reviews/ReviewCard.tsx`)
- Complete review display card
- User info with avatar (anonymous support)
- French relative dates ("il y a 3 jours")
- Pros/Cons with green/red styling
- Image grid with lightbox
- Verified purchase badge
- Supplier response box
- Helpful/Not helpful voting
- Report functionality

### ReviewForm (`src/components/reviews/ReviewForm.tsx`)
- Multi-step form wizard:
  1. Rating selection (interactive stars)
  2. Category ratings (for companies)
  3. Title + comment (with validation)
  4. Pros/Cons (tag-style inputs)
  5. Photo upload (drag-drop, max 5)
  6. Preview & submit
- Spam/profanity detection
- Anonymity toggle
- Terms acknowledgment

### ReviewList (`src/components/reviews/ReviewList.tsx`)
- Full review list with:
  - Sort options (newest, oldest, highest, lowest, helpful)
  - Filters (photos, verified, with response)
  - Pagination (10 per page)
  - Stats sidebar integration
  - Empty state handling
  - Loading skeletons

### ReviewStats (`src/components/reviews/ReviewStats.tsx`)
- Overall average display (large number)
- Rating distribution bar chart (5★ to 1★)
- Total reviews count
- "Write a review" CTA button
- Compact variant available

### CompanyReviews (`src/components/reviews/CompanyReviews.tsx`)
- Category-specific ratings visualization
- Response rate percentage
- Average response time
- Supplier's quick stats header
- Reviews list integration

## Pages Created/Updated

### Updated: `/products/[slug]/page.tsx`
- Added reviews tab using new ReviewList component
- Integrated ReviewForm modal for writing reviews
- Shows review stats sidebar

### New: `/products/[slug]/reviews/page.tsx`
- Dedicated full-page reviews view
- Expanded filters and sorting
- Community guidelines section

### New: `/companies/[slug]/page.tsx`
- Complete company profile page
- Header with company info and verification badge
- Contact information display
- Integrated CompanyReviews component
- Review form modal

### New: `/dashboard/[role]/my-reviews/page.tsx`
- User's review history dashboard
- Filter by status/type
- Edit capability (within 24h)
- Track responses received
- Delete reviews
- Detail view dialog

### New: `/admin/reviews/page.tsx`
- Admin moderation queue
- Status overview cards (published, pending, flagged, rejected, hidden)
- Search and filter capabilities
- Bulk actions (approve, reject, hide, delete)
- Individual review management
- Report details viewing
- Pagination

## Features Implemented

### Product Reviews ✅
- [x] Star rating (1-5) with half-stars
- [x] Review title + detailed comment
- [x] Pros/Cons lists
- [x] Photo upload (up to 5 images)
- [x] Verified purchase badge
- [x] Helpful/Not helpful voting
- [x] Report inappropriate content

### Company/Supplier Reviews ✅
- [x] Overall company rating (aggregated)
- [x] Category ratings (Quality, Communication, Delivery, Value, After-sales)
- [x] Arabic labels for categories
- [x] Response from supplier (public reply)
- [x] Reviewer anonymity option

### Review Moderation ✅
- [x] Auto-moderation (spam detection keywords)
- [x] Status workflow (published → flagged → approved/rejected)
- [x] Flagged reviews priority handling
- [x] Admin bulk actions
- [x] Report reason tracking

## Design Implementation

### Colors Used
- Stars: Yellow (#fbbf24) filled, gray (#d1d5db) empty
- Positive pros: Green text (#10b981)
- Negative cons: Red text (#ef4444)
- Verified badge: Blue (#3b82f6)
- Supplier response: Light blue background (#eff6ff)
- Report flag: Orange warning (#f59e0b)

### Layout
- Clean card-based design
- Responsive (stack on mobile)
- Good whitespace
- Readable typography (16px base)

### Interactions
- Smooth star hover animation
- Expand/collapse long reviews ("Lire la suite")
- Image lightbox on click
- Toast notifications on vote/submit
- Confirmation dialogs before actions

## Algerian Context
- French language UI throughout
- Date formatting: "15 janvier 2024" or "il y a 3 jours"
- Number formatting: "4,5 sur 5" (French decimal comma)
- Arabic labels for company categories
- Community standards notice in French

## File Structure Summary
```
src/
├── app/
│   ├── api/
│   │   ├── admin/reviews/route.ts
│   │   ├── products/[slug]/reviews/route.ts
│   │   ├── companies/[slug]/reviews/route.ts
│   │   ├── companies/[slug]/reviews/respond/route.ts
│   │   └── reviews/[reviewId]/
│   │       ├── route.ts
│   │       ├── vote/route.ts
│   │       └── report/route.ts
│   ├── admin/reviews/page.tsx
│   ├── companies/[slug]/page.tsx
│   ├── dashboard/[role]/my-reviews/page.tsx
│   └── products/[slug]/reviews/page.tsx
└── components/reviews/
    ├── index.ts
    ├── StarRating.tsx
    ├── ReviewCard.tsx
    ├── ReviewForm.tsx
    ├── ReviewList.tsx
    ├── ReviewStats.tsx
    └── CompanyReviews.tsx
```

## Notes
- All API routes use XTransformPort query parameter for gateway routing
- SQLite-compatible schema (no array types, JSON strings used instead)
- French language throughout UI
- Proper error handling and validation
- Toast notifications for user feedback
- Responsive design for mobile/tablet/desktop

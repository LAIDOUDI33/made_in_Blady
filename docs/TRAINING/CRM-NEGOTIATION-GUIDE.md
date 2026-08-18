# AlgeriaTrade.dz CRM & Negotiation System Training Manual

> **Version:** 2.0  
> **Last Updated:** January 2025  
> **Target Audience:** Sales Teams, Account Managers, Customer Support Staff

---

# PART 1: CRM MODULE TRAINING

---

## Chapter 1: Getting Started with CRM

### 1.1 Dashboard Overview

The CRM dashboard is your central command center for managing all customer relationships and sales activities on AlgeriaTrade.dz.

#### KPI Cards Explanation

| KPI Card | Description | Update Frequency |
|----------|-------------|------------------|
| **Total Contacts** | Complete count of all contacts in your database | Real-time |
| **Active Deals** | Number of deals currently in progress | Real-time |
| **Pipeline Value** | Total value of all active opportunities | Real-time |
| **Win Rate** | Percentage of closed-won vs total closed deals | Daily |
| **Tasks Due Today** | Number of tasks requiring attention today | Real-time |
| **New Leads (7d)** | Leads added in the past 7 days | Daily |

#### Navigation Guide

```
┌─────────────────────────────────────────────────────────────────┐
│  🏠 Dashboard    👥 Contacts    💼 Deals    📊 Analytics    ⚙️ Settings │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │   KPI 1     │  │   KPI 2     │  │   KPI 3     │           │
│   └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Pipeline View / Recent Activity             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Quick Actions Bar

The Quick Actions Bar provides one-click access to common tasks:

- **+ New Contact** - Add a new contact to your database
- **+ New Deal** - Create a new sales opportunity
- **+ Log Activity** - Record an interaction (call, email, meeting)
- **+ Import** - Bulk import contacts from CSV
- **+ New Task** - Create a follow-up task

### 1.2 User Roles & Permissions

| Role | Access Level | Capabilities |
|------|--------------|--------------|
| **Admin** | Full Access | All features, user management, settings |
| **Manager** | Team Access | Reports, team deals, assignments |
| **Sales Rep** | Personal | Own contacts/deals, basic features |
| **Viewer** | Read Only | Dashboards, reports only |

---

## Chapter 2: Contact Management

### 2.1 Adding New Contacts

#### Method 1: Manual Entry Form

To add a contact manually:

1. Click **"+ New Contact"** in the Quick Actions bar or navigate to **Contacts → Add Contact**
2. Fill in the required fields:
   - **First Name** (required)
   - **Last Name** (required)
   - **Email Address** (required) - used as unique identifier
   - **Phone Number** (optional but recommended)
3. Complete additional information:
   - Company name
   - Job title
   - Industry sector
   - Location (city, wilaya)
4. Add custom fields as needed:
   - Source (how they found you)
   - Notes
   - Tags
5. Click **"Save Contact"**

#### Method 2: Bulk Import from CSV

For importing multiple contacts at once:

1. Download the import template from **Contacts → Import → Download Template**
2. Prepare your CSV file following this format:

```csv
first_name,last_name,email,phone,company,job_title,industry,city,tags
Ahmed,Benali,ahmed@company.dz,+213555123456,TechAlgeria,CEO,Technology,Algiers,"prospect,vip"
Fatima,Zerhouni,fatima@trade.dz,+213555789012,ExportCo,Manager,Trading,Oran,"lead,b2b"
```

3. Navigate to **Contacts → Import**
4. Upload your CSV file
5. Map columns to database fields
6. Review the preview
7. Click **"Import"**

**Import Rules:**
- Maximum 5,000 contacts per import
- Duplicate emails are skipped automatically
- Invalid emails are flagged for review
- Phone numbers should include country code (+213)

#### Method 3: Lead Capture from Website

AlgeriaTrade.dz automatically captures leads when:

- A visitor fills out the "Contact Us" form
- Someone requests a quote
- A user registers for newsletters
- A buyer sends an inquiry about a product

These leads appear in **Contacts → Captured Leads** for review and assignment.

### 2.2 Contact Segmentation

#### Using Tags Effectively

Tags are flexible labels to categorize contacts. Best practices:

| Tag Category | Examples | Usage |
|-------------|----------|-------|
| **Lead Status** | `new`, `contacted`, `qualified`, `unresponsive` | Track progress |
| **Customer Type** | `b2b`, `b2c`, `reseller`, `wholesaler` | Business model |
| **Interest Level** | `hot`, `warm`, `cold` | Prioritization |
| **Source** | `website`, `referral`, `trade-show`, `social` | Marketing tracking |
| **Region** | `algiers`, `oran`, `constantine`, `international` | Geographic |

**Tag Management Tips:**
- Use lowercase tags for consistency
- Limit to 3-5 tags per contact maximum
- Review and clean up unused tags monthly
- Create a standardized tag list for your team

#### Creating Segments

Segments are saved filters that group contacts by criteria:

1. Go to **Contacts → Segments**
2. Click **"+ New Segment"**
3. Define criteria using AND/OR logic:
   ```
   Example: "Hot Export Prospects"
   
   Tags CONTAINS "hot"
   AND Industry EQUALS "Export/Import"
   AND City NOT EQUALS "Algiers"
   AND Created Date WITHIN last 30 days
   ```
4. Name your segment descriptively
5. Save - segment updates dynamically

#### Target Lists for Campaigns

Create target lists from segments for marketing campaigns:

1. Select a segment
2. Click **"Create Campaign List"**
3. Choose campaign type:
   - Email blast
   - SMS notification
   - WhatsApp message
   - Internal follow-up queue
4. Schedule or send immediately

---

## Chapter 3: Sales Pipeline

### 3.1 Understanding Pipeline Stages

The sales pipeline represents your customer's journey from first contact to completed sale:

```
┌──────────┬────────────┬───────────┬──────────────┬──────────────┐
│  LEAD    │ QUALIFIED  │ PROPOSAL  │ NEGOTIATION  │ CLOSED       │
│          │            │           │              │              │
│ 🔵       │ 🟡         │ 🟠        │ 🔴           │ 🟢/⚫         │
├──────────┼────────────┼───────────┼──────────────┼──────────────┤
│ Initial  │ Needs      │ Quote     │ Price/terms  │ Deal         │
│ inquiry  │ verified   │ sent      │ discussion   │ complete     │
│ captured │ Budget OK? │ Client    │ Counter-     │ Won = Revenue │
│          │ Authority? │ reviewing │ offers       │ Lost = Learn  │
│          │ Timing?    │           │              │              │
├──────────┼────────────┼───────────┼──────────────┼──────────────┤
│ 0-10%    │ 20-40%     │ 50-70%    │ 70-90%       │ 100%/0%      │
│ prob.    │ prob.      │ prob.     │ prob.        │              │
└──────────┴────────────┴───────────┴──────────────┴──────────────┘
```

#### Stage Definitions & Criteria

| Stage | Definition | Move Forward When... | Typical Duration |
|-------|------------|---------------------|------------------|
| **Lead** | Initial contact/inquiry captured | You've confirmed interest | 1-3 days |
| **Qualified** | BANT criteria verified | Decision to pursue | 3-7 days |
| **Proposal** | Formal quote sent | Client responds | 7-14 days |
| **Negotiation** | Active price/terms discussion | Agreement reached | 7-21 days |
| **Closed Won** | Contract signed/deal complete | N/A | Final |
| **Closed Lost** | Deal not proceeding | N/A | Final |

#### When to Move Deals Between Stages

**Moving Forward:**
- ✅ Always have a clear trigger event
- ✅ Document the reason for stage change
- ✅ Update deal value if it changes
- ✅ Notify team members if handoff needed

**Moving Backward:**
- ⚠️ Track reasons for regression
- ⚠️ May indicate process issues
- ⚠️ Common in Negotiation → Proposal
- ⚠️ Should be exception, not norm

### 3.2 Managing Deals

#### Creating New Deals

1. Navigate to **Deals → + New Deal** or press `Ctrl+D`
2. Enter required information:
   - **Deal Name** - Clear, descriptive title
   - **Contact** - Link to existing contact
   - **Value (DZD)** - Expected revenue
   - **Stage** - Usually starts at "Lead"
3. Set optional details:
   - Expected close date
   - Win probability (%)
   - Assigned owner
   - Products/services involved
4. Click **"Create Deal"**

#### Setting Probabilities

Default probabilities by stage can be overridden for individual deals:

| Situation | Recommended Probability |
|-----------|------------------------|
| Standard qualified lead | Use stage default |
| Warm referral from existing client | +10-15% above default |
| Cold call with no relationship | -10-15% below budget |
| Competitive situation | -10-20% below default |
| Verbal commitment | 85-95% regardless of stage |
| Waiting on budget approval | 60-75% typically |

#### Revenue Forecasting

The system calculates weighted pipeline value:

```
Forecast Value = Σ (Deal Value × Win Probability)

Example:
Deal A: 500,000 DZD × 70% = 350,000 DZD
Deal B: 250,000 DZD × 40% = 100,000 DZD
Deal C: 1,000,000 DZD × 20% = 200,000 DZD
─────────────────────────────────────────────
Total Forecast:              650,000 DZD
```

Access forecasts at **Analytics → Forecasts**

---

## Chapter 4: Activities & Tasks

### 4.1 Logging Interactions

Every customer touchpoint should be recorded for complete history.

#### Types of Activities

| Type | Icon | When to Use | Required Fields |
|------|------|-------------|-----------------|
| **Call** | 📞 | Phone conversation | Date, duration, notes |
| **Email** | 📧 | Email exchange | Subject, direction (in/out) |
| **Meeting** | 📅 | In-person or video meeting | Date, attendees, agenda |
| **Note** | 📝 | General observation | Content, category |
| **Task** | ✅ | To-do item creation | Due date, priority |

#### How to Log Activities

**Method 1: From Contact Record**
1. Open contact profile
2. Scroll to **Activity Timeline**
3. Click **"+ Log Activity"**
4. Select type and fill details
5. Save

**Method 2: Keyboard Shortcut**
Press `Ctrl+A` anywhere in CRM to quick-log activity

**Method 3: Mobile App**
Use the mobile app for on-the-go logging

#### Follow-up Scheduling

After logging an activity, always schedule next steps:

1. Choose **"Schedule Follow-up"** checkbox
2. Set date/time based on activity type:
   - After cold call: 2-3 days
   After proposal sent: 3-5 days
   After meeting: 1-2 days
   After voicemail: 1 day
3. Add reminder notification preference:
   - Email
   - Push notification
   - SMS (for urgent tasks)

#### Task Assignment

Tasks can be assigned to any team member:

1. Create task with due date
2. Click **"Assign To"** dropdown
3. Select team member
4. Set priority level:
   - 🔴 Critical - Must complete today
   - 🟠 High - Within 48 hours
   - 🟡 Medium - This week
   - 🟢 Low - When possible
5. Add context notes for assignee

---

## Chapter 5: Analytics & Reports

### 5.1 Key Metrics

#### Conversion Metrics

| Metric | Formula | Target | Action if Below |
|--------|---------|--------|-----------------|
| **Lead-to-Qualified Rate** | Qualified / Total Leads | >30% | Review lead quality sources |
| **Qualified-to-Proposal** | Proposals / Qualified | >50% | Improve qualification process |
| **Proposal-to-Closed** | Closed / Proposals | >40% | Review pricing/competitors |
| **Overall Win Rate** | Won / (Won + Lost) | >25% | Full pipeline analysis |

#### Velocity Metrics

| Metric | Description | Good Performance |
|--------|-------------|------------------|
| **Average Sales Cycle** | Days from Lead to Close | <45 days |
| **Stage Duration** | Time in each stage | Varies by stage |
| **Response Time** | First contact after lead-in | <4 hours |
| **Follow-up Frequency** | Touches per opportunity | 8-12 touches |

#### Win/Loss Analysis

Regularly analyze why deals are won or lost:

**Common Win Reasons:**
- Strong product fit
- Competitive pricing
- Existing relationship
- Responsive service
- Unique value proposition

**Common Loss Reasons:**
- Price too high
- Chose competitor
- Timeline mismatch
- Budget constraints
- No decision made (stale)

Access detailed analysis at **Analytics → Win/Loss Report**

### 5.2 Available Reports

| Report | Data Shown | Refresh | Export |
|--------|------------|---------|--------|
| Pipeline Summary | All deals by stage | Real-time | Yes |
| Sales Performance | Rep-by-rep metrics | Daily | Yes |
| Lead Sources | Origin tracking | Weekly | Yes |
| Activity Volume | Interactions logged | Real-time | Yes |
| Forecast Report | Weighted pipeline | Hourly | Yes |
| Custom Reports | User-defined queries | On-demand | Yes |

---

# PART 2: NEGOTIATION SYSTEM TRAINING

---

## Chapter 1: Understanding Negotiations

### 1.1 When to Use Negotiation

The negotiation feature is designed for specific scenarios where standard pricing doesn't apply:

#### Price Negotiations
- **Bulk orders** - Buying larger quantities than listed
- **Repeat customers** - Loyalty discounts
- **Seasonal promotions** - End-of-quarter deals
- **Competitive situations** - Matching market rates

#### Quantity Discounts
When buyers want:
- More units than standard listing quantity
- Mixed-product bundles
- Long-term supply agreements
- Tiered pricing structures

#### Delivery Terms
Negotiable elements:
- Shipping method upgrades
- Expedited delivery
- Split shipments
- Free shipping thresholds

#### Payment Conditions
Available options:
- Payment terms (net 30, net 60)
- Partial upfront payment
- Installment plans for large orders
- Letter of credit arrangements

### 1.2 Business Rules

All negotiations must adhere to these system rules:

| Rule | Limit | Notes |
|------|-------|-------|
| **Maximum Counter-Offers** | 10 rounds total | Combined both parties |
| **Offer Validity** | 72 hours | Auto-expires if no response |
| **Minimum Change** | 1% from last offer | Prevents spam offers |
| **Maximum Discount** | 40% off list price | System-enforced cap |
| **Auto-Accept Threshold** | 5% margin | Seller-configurable |

#### Rule Details

**72-Hour Offer Validity:**
- Countdown timer visible to both parties
- Extension available once per negotiation (24hr)
- Auto-expiration sends notification
- Expired offers cannot be revived

**1-40% Discount Range:**
- Offers below 60% of list price rejected automatically
- Offers above 99% of list price accepted automatically (if within threshold)
- Warning shown for extreme offers (>35% discount requested)

**Auto-Accept Feature:**
Sellers can set automatic acceptance when:
- Buyer offer is within X% of asking price
- Default threshold: 5%
- Can be adjusted per product or globally
- Override available before auto-trigger completes

---

## Chapter 2: For Buyers

### 2.1 Making an Offer

#### Step 1: Finding the Negotiate Button

The negotiate option appears when:
- ✅ Product has negotiation enabled by seller
- ✅ You are logged in as a verified buyer
- ✅ Product is active and in stock
- ✅ You haven't exceeded negotiation limits

**Location:** On product detail page, near "Add to Cart" button

```
┌─────────────────────────────────────┐
│  PRODUCT DETAIL PAGE                │
│                                     │
│  [Product Image]                    │
│                                     │
│  Price: 150,000 DZD                 │
│                                     │
│  [🛒 Add to Cart]  [💰 Negotiate]   │
│                  ↑                  │
│           Click here!               │
└─────────────────────────────────────┘
```

#### Step 2: Setting Your Offer Price

Consider these factors:
- Market research on similar products
- Your budget constraints
- Quantity you're purchasing
- Relationship with seller
- Current promotions elsewhere

**Price Calculator:**
```
List Price:     150,000 DZD
Your Offer:     125,000 DZD
Discount:       16.7% ✓ (within range)
Status:         Valid offer
```

The system validates your offer in real-time:
- ✅ Green checkmark: Valid offer
- ⚠️ Yellow warning: Extreme offer (may be rejected)
- ❌ Red error: Invalid (outside rules)

#### Step 3: Adding a Message

While optional, messages improve success rate:

**Good Message Examples:**
- "Planning to order 50+ units monthly"
- "Found similar product at 120,000 DZD"
- "Ready to pay immediately upon agreement"
- "Long-term partnership interested"

**Bad Message Examples:**
- "Your price is too high" (no value)
- "Take it or leave it" (aggressive)
- Empty/no message (missed opportunity)

#### Step 4: Submitting the Offer

Before submitting, verify:
- [ ] Offer price is correct
- [ ] Message is professional (if included)
- [ ] Quantity is accurate
- [ ] Delivery preferences set
- [ ] You're ready to purchase if accepted

Click **"Submit Offer"** - you'll receive confirmation and the seller will be notified.

### 2.2 Handling Counter-Offers

#### Reviewing Seller's Counter

When you receive a counter-offer:

1. **Notification received** via email/app
2. **View counter details:**
   - New proposed price
   - Time remaining (72-hour clock resets)
   - Any message from seller
   - Round number (how many exchanges so far)

3. **Analyze the counter:**
   ```
   Your Last Offer:    125,000 DZD
   Their Counter:      140,000 DZD
   Gap:                 15,000 DZD (10%)
   Midpoint:           132,500 DZD
   ```

#### Calculating Savings

Use the built-in calculator:
```
Original Price:  150,000 DZD
Counter Offer:   140,000 DZD
Your Savings:     10,000 DZD (6.7%)

If you accept now:
✓ Immediate purchase available
✓ Lock in this price for 48 hours
```

#### Accepting or Countering Again

**Option 1: Accept the Counter**
- Click **"Accept Offer"**
- Proceed to checkout immediately
- Price guaranteed for 48 hours

**Option 2: Make Another Counter**
- Enter new price (must differ by ≥1%)
- Consider splitting the difference
- Add supporting message
- Remember: limited rounds remaining!

**Option 3: Decline/End Negotiation**
- Click **"End Negotiation"**
- Provide optional reason
- Return to normal shopping

**Decision Framework:**
```
IF counter is within 10% of your max:
    → Accept (good deal achieved)

IF counter is 10-20% from your max:
    → Counter once more at midpoint

IF counter is >20% from your max:
    → Evaluate if product worth premium
    → Consider walking away
```

---

## Chapter 3: For Sellers

### 3.1 Reviewing Incoming Offers

#### Step 1: Check Buyer Profile

Before responding, review the buyer:

**Information Available:**
- Account age and verification status
- Previous order history
- Rating from other sellers
- Response time history
- Location and business type

**Risk Indicators:**
- ⚠️ New account (<30 days)
- ⚠️ No previous orders
- ⚠️ Low rating from others
- ⚠️ Very low initial offer

**Positive Signals:**
- ✅ Verified business account
- ✅ History of completed orders
- ✅ Good ratings from sellers
- ✅ Reasonable initial offer

#### Step 2: Profit Margin Calculator

Use the built-in tool to evaluate offers:

```
OFFER ANALYSIS
═══════════════════════════════════════
List Price:        150,000 DZD
Buyer Offer:       120,000 DZD
Your Cost:          80,000 DZD
───────────────────────────────────────
Gross Margin:       40,000 DZD (33.3%)
Margin %:           Above minimum (25%)
Recommendation:     COUNTER or ACCEPT
```

The system shows:
- Absolute profit amount
- Margin percentage
- Comparison to your minimum acceptable margin
- Accept/counter/reject recommendation

#### Step 3: Response Options

**Accept**
- Use when: Offer meets or exceeds your minimum margin
- Result: Deal closes, buyer gets purchase link
- Best for: Reasonable offers, good buyers

**Counter-Offer**
- Use when: Offer is close but not quite there
- Result: Negotiation continues
- Best for: Most situations

**Reject**
- Use when: Offer is unreasonably low
- Result: Negotiation ends
- Best for: Extreme lowballs, problematic buyers

### 3.2 Making Counter-Offers

#### Setting Minimum Acceptable Price

Know your numbers before negotiating:

**Cost Calculation Template:**
```
Product cost:           XX,XXX DZD
Shipping/Packaging:     X,XXX DZD
Platform fees (3%):     X,XXX DZD
Payment processing:     XXX DZD
────────────────────────────────────
Total costs:           XX,XXX DZD

Minimum acceptable:     Costs + Desired margin %
Example: 80,000 + 25% = 100,000 DZD minimum
```

#### Adding Value Propositions

Strengthen your counter with value adds:

| Value Add | Example Wording |
|-----------|-----------------|
| Quality assurance | "Our products undergo 3-stage QC" |
| Warranty | "Includes 12-month warranty vs competitor's 6-month" |
| Support | "Dedicated account manager for orders over 100K DZD" |
| Speed | "Same-day shipping from our Algiers warehouse" |
| Flexibility | "Accept returns within 30 days, no questions asked" |

#### Bundle Offers

Increase deal value while appearing to concede:

**Bundle Strategies:**
- "At 135,000 DZD, I'll include free shipping"
- "Can do 130,000 DZD if you order 20+ units"
- "Current price includes 6-month extended warranty"
- "Will match that price if you commit to monthly reorders"

---

## Chapter 4: Best Practices

### 4.1 Negotiation Tips

#### Research Market Prices

Before entering negotiations:
- Check competitor prices on AlgeriaTrade.dz
- Review historical transaction data
- Understand seasonal pricing trends
- Know your BATNA (Best Alternative to Negotiated Agreement)

#### Be Respectful and Professional

Always maintain professionalism:
- Use polite language
- Avoid aggressive tactics
- Acknowledge the other party's position
- Focus on win-win outcomes
- Never make it personal

#### Respond Promptly

Time management tips:
- Aim to respond within 24 hours
- Faster responses show seriousness
- Don't use delay as tactic (damages trust)
- If need time, communicate that explicitly

#### Know Your Bottom Line

Before starting, determine:
- **Walk-away point** - The price where you decline
- **Target point** - Your ideal outcome
- **Aspiration point** - Optimistic opening (for sellers)

```
Aspiration:  150,000 DZD (list price)
Target:      135,000 DZD (acceptable outcome)
Walk-away:   110,000 DZD (minimum viable)
```

### 4.2 Common Mistakes

#### Lowballing Excessively

**The Mistake:**
Starting with an extremely low offer (e.g., 50% off)

**Why It Fails:**
- Insults the seller
- Signals non-serious buyer
- Often ignored completely
- Burns bridges for future

**Better Approach:**
Start at 15-20% below asking price with justification

#### Ignoring Time Pressure

**The Mistake:**
Waiting until the last hour to respond, letting offers expire

**Why It Fails:**
- Shows disorganization
- Misses opportunities
- Creates bad reputation
- Other buyers may purchase

**Better Approach:**
Set calendar reminders, respond within 24 hours

#### Burning Bridges

**The Mistake:**
Being rude, threatening, or unprofessional during negotiations

**Why It Fails:**
- Word travels in B2B community
- Blocked by sellers
- Negative reviews
- Lost future opportunities

**Better Approach:**
Even if declining, thank them and leave door open:

> "Thank you for your offer. Unfortunately, we cannot agree on price at this time. We hope to work together in the future under different circumstances."

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **BATNA** | Best Alternative to Negotiated Agreement |
| **BANT** | Budget, Authority, Need, Timeline (qualification framework) |
| **DZD** | Algerian Dinar currency |
| **KPI** | Key Performance Indicator |
| **Lead Score** | Numerical ranking of lead quality (0-100) |
| **Pipeline** | Visual representation of sales stages |
| **Qualification** | Process of verifying lead viability |
| **Wilaya** | Algerian administrative province |

## Appendix B: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Quick search contacts |
| `Ctrl+N` | New contact |
| `Ctrl+D` | New deal |
| `Ctrl+A` | Log activity |
| `Ctrl+/` | Show all shortcuts |
| `Esc` | Close modal/dialog |

## Appendix C: Support Resources

| Resource | Location |
|----------|----------|
| Help Center | help.algeriatrade.dz |
| Video Tutorials | youtube.com/@AlgeriaTrade |
| Email Support | support@algeriatrade.dz |
| Phone Support | +213 (0) XXX XXX XXX |
| Live Chat | Available 8AM-6PM (UTC+1) |

---

*This training manual is maintained by the AlgeriaTrade.dz Operations Team. For updates or corrections, please contact training@algeriatrade.dz*

© 2025 AlgeriaTrade.dz - All Rights Reserved

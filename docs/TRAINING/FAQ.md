# AlgeriaTrade.dz Training Materials - Frequently Asked Questions (FAQ)

> **Last Updated:** January 2025  
> **Categories:** CRM | Negotiation System | General

---

## Table of Contents

- [CRM FAQ](#crm-faq)
  - [Getting Started](#getting-started)
  - [Contact Management](#contact-management)
  - [Sales Pipeline](#sales-pipeline)
  - [Activities & Tasks](#activities--tasks)
  - [Reports & Analytics](#reports--analytics)
- [Negotiation System FAQ](#negotiation-system-faq)
  - [For Buyers](#for-buyers)
  - [For Sellers](#for-sellers)
  - [Rules & Limits](#rules--limits)
  - [Troubleshooting](#troubleshooting)

---

# CRM FAQ

## Getting Started

### Q1: How do I access the CRM system?

**A:** The CRM is accessible at `crm.algeriatrade.dz` or through the main dashboard by clicking "CRM" in the top navigation menu. You'll need an active AlgeriaTrade.dz business account with appropriate permissions.

---

### Q2: What are the different user roles in CRM?

**A:** There are four user roles:

| Role | Access Level |
|------|--------------|
| **Admin** | Full access to all features, user management, and settings |
| **Manager** | Team performance reports, deal assignments, team contacts |
| **Sales Rep** | Personal contacts/deals only, basic features |
| **Viewer** | Read-only access to dashboards and reports |

Contact your admin to request role changes.

---

### Q3: Can I customize my dashboard?

**A:** Yes! Admins and Managers can:
- Rearrange KPI cards via drag-and-drop
- Add/remove widget panels
- Set custom date ranges for metrics
- Create saved filter views
- Pin frequently used reports

Go to **Settings → Dashboard Layout** to customize.

---

## Contact Management

### Q4: What information is required when adding a new contact?

**A:** Required fields:
- First Name
- Last Name  
- Email Address (serves as unique identifier)

Highly recommended fields:
- Phone Number
- Company Name
- Job Title

Optional fields include tags, notes, custom fields, and more.

---

### Q5: How do I import multiple contacts at once?

**A:** Use the bulk import feature:

1. Go to **Contacts → Import**
2. Download the CSV template
3. Fill in your data following the template format
4. Upload the completed CSV file
5. Map columns to database fields
6. Review preview and click Import

**Limits:** Maximum 5,000 contacts per import, duplicates are auto-skipped.

---

### Q6: What happens if I try to add a duplicate contact?

**A:** The system checks for duplicates based on email address:
- If email exists: Contact is skipped, you're notified
- If email is new but name matches: You get a warning to review
- Completely new contact: Added normally

You can merge duplicate contacts later from **Contacts → Merge Duplicates**.

---

### Q7: How should I use tags effectively?

**A:** Best practices for tagging:

✅ **DO:**
- Use lowercase tags consistently (`prospect`, not `Prospect`)
- Limit to 3-5 tags per contact
- Create a standardized tag list for your team
- Review and clean unused tags monthly

❌ **DON'T:**
- Create overly specific tags (use segments instead)
- Apply contradictory tags
- Leave tags without clear definitions

**Recommended tag categories:**
- Status: `new`, `contacted`, `qualified`, `unresponsive`
- Type: `b2b`, `b2c`, `reseller`, `wholesaler`
- Interest: `hot`, `warm`, `cold`
- Source: `website`, `referral`, `trade-show`

---

### Q8: What's the difference between tags and segments?

**A:** 

| Feature | Tags | Segments |
|---------|------|----------|
| **Purpose** | Manual labeling | Dynamic filtering |
| **Update method** | Manually applied | Auto-updates based on criteria |
| **Best for** | Quick categorization | Target lists, campaigns |
| **Example** | Tag "VIP" on key accounts | Segment "Hot leads in Algiers" |

Use tags for simple categorization; use segments for complex, rule-based grouping.

---

## Sales Pipeline

### Q9: What are the pipeline stages and when should I move deals?

**A:** Standard pipeline stages:

```
Lead (10%) → Qualified (30%) → Proposal (55%) → Negotiating (80%) → Closed (100%/0%)
```

**Move forward when:**
- **Lead → Qualified:** BANT criteria verified (Budget, Authority, Need, Timeline)
- **Qualified → Proposal:** Formal quote sent to prospect
- **Proposal → Negotiating:** Client responds with questions or counter-proposal
- **Negotiating → Closed:** Agreement reached or deal officially lost

---

### Q10: Can I create custom pipeline stages?

**A:** Yes! Admins can customize pipelines:

1. Go to **Settings → Pipeline Configuration**
2. Click "Add Stage" or modify existing stages
3. Set stage name, probability %, and color
4. Drag to reorder stages
5. Save changes

**Note:** Minimum 3 stages required; maximum 10 stages recommended.

---

### Q11: How is the forecast value calculated?

**A:** Forecast uses weighted pipeline calculation:

```
Forecast = Σ (Deal Value × Win Probability)

Example:
Deal A: 500,000 DZD × 70% = 350,000 DZD
Deal B: 250,000 DZD × 40% = 100,000 DZD
Total Forecast: 450,000 DZD
```

You can override default probabilities per-deal if you have inside information.

---

### Q12: A deal has been stuck in one stage too long. What should I do?

**A:** Deals stagnating in a single stage may indicate issues:

**Common causes & solutions:**

| Stage Stuck In | Likely Issue | Action |
|----------------|--------------|--------|
| Lead | Not properly qualified | Complete BANT assessment |
| Proposal | Client not responding | Send follow-up, try different channel |
| Negotiating | Price/terms impasse | Consider margin calculator, add value |
| Any stage >30 days | Deal may be stale | Re-qualify or move to Closed Lost |

Use **Analytics → Deal Velocity Report** to identify stuck deals automatically.

---

## Activities & Tasks

### Q13: What types of activities can I log?

**A:** Supported activity types:

| Type | Icon | When to Use |
|------|------|-------------|
| **Call** | 📞 | Phone conversations (inbound/outbound) |
| **Email** | 📧 | Email exchanges (manual logging) |
| **Meeting** | 📅 | In-person or video meetings |
| **Note** | 📝 | General observations, updates |
| **Task** | ✅ | To-do items with due dates |

Each activity records date/time, duration (where applicable), notes, and associated contact/deal.

---

### Q14: Can I set up automatic follow-up reminders?

**A:** Yes! When logging any activity:

1. Check the **"Schedule Follow-up"** box
2. Select date/time for reminder
3. Choose notification preference:
   - Email notification
   - Push notification (mobile app)
   - SMS (for critical tasks)
4. Add context notes for your future self

**Recommended follow-up timing:**
- After cold call: 2-3 days
- After proposal sent: 3-5 days
- After meeting: 1-2 days
- After voicemail: 1 day

---

### Q15: How do I assign tasks to team members?

**A:** To delegate tasks:

1. Create task with due date and details
2. Click **"Assign To"** dropdown
3. Select team member from list
4. Set priority level (Critical/High/Medium/Low)
5. Add explanatory notes

The assignee receives immediate notification and sees the task in their **My Tasks** view.

---

## Reports & Analytics

### Q16: What reports are available in CRM Analytics?

**A:** Built-in reports include:

| Report | Description | Refresh Frequency |
|--------|-------------|-------------------|
| Pipeline Summary | All deals by stage | Real-time |
| Sales Performance | Rep-by-rep metrics | Daily |
| Lead Sources | Origin tracking & conversion | Weekly |
| Activity Volume | Interactions logged | Real-time |
| Forecast Report | Weighted pipeline value | Hourly |
| Win/Loss Analysis | Reasons for outcomes | Weekly |
| Deal Velocity | Time in each stage | Weekly |

Custom reports can be created from **Analytics → Custom Reports**.

---

### Q17: How do I export report data?

**A:** Export options available on every report page:

1. Open desired report
2. Click **"Export"** button (top-right)
3. Choose format:
   - **PDF** - Formatted report with charts
   - **Excel (.xlsx)** - Raw data for analysis
   - **CSV** - Universal data format
4. Select date range if applicable
5. Click **"Download"**

Large exports may take a few minutes; you'll receive email when ready.

---

### Q18: What is a good win rate benchmark?

**A:** Industry benchmarks for B2B sales:

| Win Rate | Assessment | Recommendation |
|----------|------------|----------------|
| **<15%** | Below average | Review qualification process |
| **15-25%** | Average | Room for improvement |
| **25-35%** | Good | Maintain current practices |
| **>35%** | Excellent | Document best practices |

Your target should account for industry, product complexity, and market conditions. AlgeriaTrade.dz sets **25%** as the minimum healthy target.

---

# Negotiation System FAQ

## For Buyers

### Q19: How do I know if a product is available for negotiation?

**A:** Look for these indicators on the product page:

✅ **Negotiate button visible** - Product has negotiation enabled
✅ **"Price Negotiable" badge** - Seller accepts offers
✅ **No "Fixed Price" label** - Price may be flexible

If you don't see a Negotiate button, the seller has disabled negotiation for that product.

---

### Q20: What should my first offer be?

**A:** Recommended starting points:

| Situation | Suggested Discount | Example (150,000 DZD) |
|-----------|-------------------|----------------------|
| Standard purchase | 10-15% below | 127,500-135,000 DZD |
| Bulk order (10+ units) | 15-20% below | 120,000-127,500 DZD |
| Repeat customer | 10-12% below | 132,000-135,000 DZD |
| Competitive situation | 15-18% below | 123,000-127,500 DZD |

**Always research comparable prices first** and never start above 20% off unless you have strong justification.

---

### Q21: Is it better to accept a counter-offer or counter again?

**A:** Decision framework:

**ACCEPT if:**
- Counter is within 10% of your maximum budget
- You've already used 5+ rounds
- The seller has added value (warranty, shipping, etc.)
- Time pressure exists (product may sell out)

**COUNTER AGAIN if:**
- Gap is 10-20% from your max
- You haven't exceeded 5 rounds yet
- You can offer something in return (volume commitment, etc.)

**WALK AWAY if:**
- Gap exceeds 20% of your max
- Seller won't budge after 3+ rounds
- You found better alternatives

---

### Q22: Can I negotiate on multiple products at once?

**A:** Currently, negotiations are **per-product only**. However, you can:

1. Mention bundle interest in your message ("Interested in ordering Products A, B, C together")
2. Negotiate the primary/largest item first
3. Reference the established price for subsequent negotiations
4. Contact seller directly for custom bulk quotes

Bundle negotiation features are planned for future releases.

---

### Q23: What happens after my offer is accepted?

**A:** Upon acceptance:

1. **Immediate notification** via email and app
2. **Purchase link generated** at agreed price
3. **48-hour price lock** - Your negotiated price is guaranteed
4. **Complete checkout** like any other purchase
5. **Order confirmation** with negotiated price shown

The negotiated price appears on your invoice and order history.

---

## For Sellers

### Q24: How do I enable negotiation on my products?

**A:** To enable negotiation:

1. Go to **Seller Dashboard → Products**
2. Select product(s) to edit
3. Find **"Negotiation Settings"** section
4. Toggle **"Allow Negotiations"** to ON
5. Set optional preferences:
   - Minimum acceptable margin (%)
   - Auto-accept threshold (default: 5%)
   - Maximum discount cap (up to 40%)
6. Save changes

Products show "Price Negotiable" badge once enabled.

---

### Q25: Should I accept low offers from new buyers?

**A:** Evaluate using this framework:

**GREEN FLAGS (consider accepting):**
- Verified business account
- Good ratings from other sellers
- Reasonable first offer (not extreme lowball)
- Clear communication in message
- Bulk or repeat purchase intent

**YELLOW FLAGS (counter carefully):**
- New/unverified account
- No order history
- Very low initial offer
- Vague messages

**RED FLAGS (consider rejecting):**
- Account <30 days old AND offer >30% off
- Multiple rejected negotiations elsewhere
- Rude or demanding messages
- Unreasonable demands

Use the **Buyer Profile Check** before every response.

---

### Q26: How do I protect my profit margins during negotiation?

**A:** Margin protection strategies:

**Before negotiating:**
1. Know your exact costs (product + shipping + fees + platform %)
2. Set firm minimum price in your settings
3. Configure auto-accept threshold appropriately

**During negotiation:**
1. Use the built-in **Margin Calculator** every time
2. Never accept below your minimum without approval
3. Add value instead of dropping price:
   - Extended warranty
   - Free/priority shipping
   - Bundle extras
   - Payment term flexibility

**After negotiation:**
1. Review what worked/didn't work
2. Update minimum prices if needed
3. Note buyer behavior for future reference

---

### Q27: Can I end a negotiation early?

**A:** Yes, either party can end negotiation at any time:

**To end negotiation:**
1. Open the active negotiation
2. Click **"End Negotiation"**
3. Select reason (optional but recommended):
   - "Reached agreement" (if accepting final offer)
   - "Price gap too large"
   - "No longer interested"
   - "Found alternative"
4. Add closing message (professional courtesy)
5. Confirm

**Best practice:** Even when declining, leave door open for future business with a polite message.

---

## Rules & Limits

### Q28: What are all the negotiation rules I need to know?

**A:** Complete rule summary:

| Rule | Limit | Details |
|------|-------|---------|
| **Max rounds** | 10 total | Combined buyer + seller counters |
| **Offer validity** | 72 hours | Auto-expires if no response |
| **Min change** | 1% | Between consecutive offers |
| **Max discount** | 40% off | From original list price |
| **Auto-accept** | Configurable | Default: 5% below asking |
| **Extensions** | 1 per party | Adds 24 hours |
| **Min quantity** | 1 unit | No fractional units |

Violations result in automatic rejection or error message.

---

### Q29: Can the 72-hour deadline be extended?

**A:** Yes, **one extension per party** is allowed:

**How to request extension:**
1. Open active negotiation before expiry
2. Click **"Request Extension"**
3. System adds 24 hours to countdown
4. Other party is notified

**Limitations:**
- Only ONE extension request per side
- Extension must be requested BEFORE expiration
- Expired negotiations cannot be revived

**Tip:** If you need more time, communicate early rather than waiting until the last hour.

---

### Q30: Why was my offer rejected automatically?

**A:** Automatic rejection occurs when:

| Reason | Threshold | Solution |
|--------|-----------|----------|
| **Discount too high** | >40% off list price | Offer closer to list price |
| **Change too small** | <1% from last offer | Adjust by at least 1% |
| **Round limit reached** | 10 rounds used | Accept or end negotiation |
| **Product unavailable** | Sold out/removed | Check product status |
| **Account issue** | Verification/suspension | Contact support |

Check the error message for specific reason and adjust accordingly.

---

## Troubleshooting

### Q31: I'm having technical issues with the CRM. Who do I contact?

**A:** Support channels:

| Issue Type | Channel | Response Time |
|------------|---------|---------------|
| Technical bugs | support@algeriatrade.dz | 24 hours |
| Feature requests | feedback@algeriatrade.dz | 48 hours |
| Urgent issues | Live Chat (8AM-6PM) | Immediate |
| Training questions | training@algeriatrade.dz | 24 hours |
| Phone support | +213 XXX XXX XXX | Business hours |

**Before contacting support:**
1. Clear browser cache and cookies
2. Try a different browser
3. Check system status page
4. Screenshot the error if possible

---

### Q32: A negotiation disappeared from my dashboard. What happened?

**A:** Common reasons for missing negotiations:

**Check these:**
1. **Expired** - Past 72-hour deadline (check "Expired" tab)
2. **Completed** - Moved to "Completed" section after acceptance
3. **Ended** - Either party ended negotiation
4. **Filter issue** - Check your active filters
5. **Product removed** - Seller delisted the product

Go to **Negotiations → All** and use status filters to locate it.

---

### Q33: Can I undo a completed action (accepted offer, moved deal, etc.)?

**A:** Undo capabilities vary:

| Action | Undo Possible? | Method |
|--------|----------------|--------|
| **Accepted offer** | ❌ No | Complete purchase or let link expire |
| **Rejected offer** | ⚠️ Limited | Contact seller directly |
| **Moved deal stage** | ✅ Yes | Drag back to previous stage |
| **Deleted contact** | ✅ Yes | Within 30 days from Trash |
| **Sent message** | ✅ Yes | Edit within 5 minutes |
| **Ended negotiation** | ❌ No | Must start new negotiation |

For critical mistakes, contact support immediately for potential manual intervention.

---

### Q34: Where can I find additional training resources?

**A:** Available resources:

| Resource | Location | Format |
|----------|----------|--------|
| **This FAQ** | docs/TRAINING/FAQ.md | Text |
| **Training Manual** | docs/TRAINING/CRM-NEGOTIATION-GUIDE.md | Comprehensive guide |
| **Video Tutorials** | YouTube: @AlgeriaTrade | Video |
| **Quick Reference Cards** | docs/TRAINING/CHEATSHEETS/ | PDF |
| **Assessment Quizzes** | docs/TRAINING/QUIZZES/ | JSON |
| **Tutorial Scripts** | docs/TRAINING/SCRIPTS/ | Text |
| **Help Center** | help.algeriatrade.dz | Web |
| **Live Webinars** | Monthly schedule | Interactive |

Contact **training@algeriatrade.dz** to schedule customized team training sessions.

---

### Q35: How often is the training material updated?

**A:** Update schedule:

| Material | Update Frequency | Trigger |
|----------|------------------|---------|
| FAQ | As needed | New common questions |
| Training Manual | Quarterly | Feature releases |
| Video Tutorials | Semi-annually | Major UI changes |
| Quizzes | Per release | New features added |
| Cheatsheets | Annually | Workflow changes |

Subscribe to the **Training Newsletter** for update notifications, or check the **What's New** page in the Help Center.

---

*Still have questions? Reach out to us at **support@algeriatrade.dz** or **training@algeriatrade.dz***

© 2025 AlgeriaTrade.dz - All Rights Reserved

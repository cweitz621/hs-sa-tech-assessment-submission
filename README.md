# HubSpot Integration - Breezy Technical Assessment

**⚠️ Work in Progress**

This is a proof-of-concept application for the HubSpot Solutions Architect Technical Assessment. It demonstrates how Breezy (a smart home technology company) would integrate their platform with HubSpot to sync customer data, track trials, and manage subscriptions.

---

## A. Setup Instructions

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- A **free HubSpot account**
- **HubSpot Private App** access token
- **Google Gemini API key** (for AI features)

### How to Run Locally

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Get Your HubSpot Access Token

1. Sign up for a [free HubSpot account](https://offers.hubspot.com/free-trial)
2. Navigate to **Settings** → **Integrations** → **Private Apps**
3. Click **Create a private app**
4. Give it a name (e.g., "Breezy Integration App")
5. Go to the **Scopes** tab and enable:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`
   - `crm.objects.products.read`
   - `crm.objects.products.write`
   - `crm.objects.line_items.read`
   - `crm.objects.line_items.write`
   - `crm.objects.custom.read`
   - `crm.objects.custom.write`
6. Click **Create app** and copy your access token

#### 3. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **Get API Key** or navigate to the API Keys section
4. Create a new API key or copy an existing one
5. Activate key with free trial

#### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
HUBSPOT_ACCESS_TOKEN=pat-na1-your-token-here
GEMINI_API_KEY=your-gemini-api-key-here
```

#### 5. Start the Server

**For development (with hot-reloading):**

```bash
npm run dev
```

You should see:

```
✅ Server running successfully!
🌐 API available at: http://localhost:3001
📋 Health check: http://localhost:3001/health
📁 Static files served from: /public
```

**To stop the server:** Press `Ctrl+C`

#### 6. Set Up Breezy Subscription Creation

**Important**: The Breezy Subscriptions displayed in the admin panel can be created in two ways:

**Option A: HubSpot Workflows (Recommended for API Call Management)**
- Using HubSpot workflows to create subscriptions helps manage API call limits
- Workflows run server-side in HubSpot, reducing the number of API calls from your application
- This is the recommended approach if you're concerned about HubSpot API rate limits
- Set up a workflow in HubSpot that creates subscription records in the custom "Breezy Subscriptions" object

**Option B: Direct API Calls**
- If preferred, you can create subscriptions directly via API calls from your application
- This gives you more control but uses more API calls
- You would need to add an endpoint to create subscription records using the HubSpot Custom Objects API
- Example: `POST /crm/v3/objects/breezy_subscriptions` (using object ID `2-53381506`)

**For this POC, we demonstrate Option A (workflows)** to show how you can reduce API call volume. In production, choose the approach that best fits your needs, rate limits, and control requirements.

**Steps to Create the Workflow (Option A):**

1. **Navigate to Workflows**:
   - Go to **Automation** → **Workflows** in your HubSpot account
   - Click **Create workflow**

2. **Set Workflow Trigger**:
   - Choose **Deal-based workflow**
   - Set trigger: When a deal moves to "Converted" stage (or your trial conversion stage)

3. **Add Action: Create Record**:
   - Add action: **Create record**
   - Select object: **Breezy Subscription**
   - Map properties:
     - `status`: Set to "Active"
     - `active_date`: Set to current date/time
     - `subscription_id`: Generate or use a unique identifier
   - Associate the subscription to the contact from the deal

4. **Activate the Workflow**:
   - Review and activate the workflow
   - Test by converting a trial deal to verify subscription creation

**Note**: For testing purposes, you can also manually create Breezy Subscription records in HubSpot:
- Go to **Objects** → **Breezy Subscriptions**
- Create a new record
- Associate to Contact and (optional) Trial Deal 
- Set `status` to "Active" or "Cancelled"
- Set appropriate dates

The subscription will then appear in the admin panel table for the associated contact.

#### 7. Access the Application

Open your browser and navigate to:

```
http://localhost:3001
```

### How to Test the Integration Flow

1. **Create a Contact:**
   - Fill out the "Sync Customer to HubSpot" form
   - Optionally specify "Number of Thermostats Purchased"
   - Submit the form
   - Verify the contact appears in the contacts table
   - If thermostats purchased, verify a deal is created with basic information

2. **Create a Trial:**
   - Select an existing contact from the dropdown
   - Fill in trial details (name, value, billing frequency, stage)
   - Submit the form
   - Verify the trial appears in the "Trials" column for that contact

3. **View Data:**
   - The contacts table displays:
     - Contact information (name, email, job title, company)
     - Thermostat purchases (quantity and total amount)
     - Trials (deal name, amount, stage, ID)
     - **Breezy Subscriptions** (status, dates, trial ID) - *These are created by HubSpot workflows when trials convert*
     - AI Customer Health insights (optional)

4. **Test AI Insights:**
   - Click "Get AI Insight" button for any contact
   - Modal will display AI-generated customer health analysis
   - Includes likelihood to upgrade, churn risk, and HubSpot AI tool recommendations

5. **Test Error Handling:**
   - Try creating a contact with an existing email address
   - Verify you receive a clear error message about duplicate contacts

---

## B. Project Overview

### What This POC Demonstrates

This proof-of-concept demonstrates an integration between Breezy's smart home platform and HubSpot CRM. The application simulates an admin panel that Breezy's team would use to:

1. **Sync Customer Data**: Automatically create HubSpot contacts when customers purchase thermostats or sign up for trials
2. **Track Hardware Purchases**: Create deals in HubSpot's "Hardware Pipeline" with associated line items for thermostat purchases
3. **Manage Trial Signups**: Create trial deals with line items that include billing frequency and pricing information
4. **Monitor Subscriptions**: Display subscription status from HubSpot's custom "Breezy Subscriptions" object
5. **AI-Powered Insights**: Generate customer health insights using Google Gemini AI, with recommendations for HubSpot AI tools



### Key Features

- **Contact Management**: Create and view contacts with job title and company information
- **Deal Tracking**: Separate pipelines for hardware purchases (Hardware Pipeline) and trials (Default Pipeline)
- **Line Item Integration**: Automatic creation of products and line items for thermostats and premium subscriptions
- **Custom Object Integration**: Read subscription data from HubSpot custom objects
- **Dynamic Pipeline Loading**: Automatically fetch and display current deal stages from HubSpot
- **AI Customer Health**: Generate insights with specific HubSpot AI tool recommendations
- **Error Handling**: User-friendly error messages for common issues (e.g., duplicate emails)

### Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **API Integration**: HubSpot CRM API v3
- **AI Integration**: Google Gemini 2.0 Flash API
- **HTTP Client**: Axios
- **Documentation Tools**: Mermaid (for ERD diagrams), Google Gemini (for diagram generation)

---

## C. AI Usage Documentation

### Which AI Tools Did You Use?

- **Google Gemini 2.0 Flash (Experimental)**: Used for generating customer health insights
- **Google Gemini**: Used in conjunction with Mermaid to generate the Entity Relationship Diagram (ERD) for the HubSpot data architecture

### What Tasks Did You Use AI For?

1. **Customer Health Analysis**: 
   - Analyzing customer data (hardware purchases, trial activity, subscription status)
   - Generating likelihood to upgrade scores
   - Assessing churn risk
   - Providing actionable recommendations

2. **HubSpot AI Tool Recommendations**:
   - Suggesting specific HubSpot AI tools (Content Writer, ChatSpot, Email Assistant, Workflows, etc.)
   - Connecting insights to tactical execution methods
   - Providing context-aware recommendations based on customer profile

3. **Documentation and Diagram Generation**:
   - Used Google Gemini to generate Mermaid diagram code for the Entity Relationship Diagram (ERD)
   - Gemini helped structure the complex relationships between HubSpot objects (Contacts, Deals, Line Items, Products, Custom Objects)
   - Mermaid rendered the diagram into a visual representation of the data architecture

### What Did You Learn? What Was Challenging?

**What I Learned:**
- Prompt engineering is crucial for getting structured, actionable responses from AI
- AI models need clear instructions about output format (JSON structure)
- Context matters - providing comprehensive customer data leads to better insights
- AI can effectively bridge the gap between data analysis and actionable recommendations
- **AI for Documentation**: Using Gemini to generate Mermaid diagram code demonstrated how AI can accelerate documentation tasks, helping structure complex relationships and generate visual representations of system architecture

**Challenges:**
- **Model Availability**: Initially tried `gemini-2.0-flash-exp` which wasn't available on free tier, had to switch to `gemini-1.5-flash` initially
- **Response Parsing**: Gemini sometimes returns JSON wrapped in markdown code blocks, requiring additional parsing logic
- **Prompt Design**: Balancing specificity (HubSpot AI tools) with flexibility (various customer scenarios) required iteration
- **Error Handling**: Handling API quota limits and rate limiting gracefully
- **Structured Output**: Ensuring consistent JSON structure despite AI's natural language tendencies

### How Did AI Help (or Not Help)?

**How AI Helped:**
- **Pattern Recognition**: AI excels at identifying patterns across multiple data points (purchase history, trial activity, time-based signals)
- **Contextual Recommendations**: AI can synthesize complex customer data into actionable insights that would require manual analysis
- **Scalability**: AI can analyze any number of customers without additional code changes
- **Natural Language**: AI generates human-readable justifications that are easy for sales/marketing teams to understand

**Limitations Encountered:**
- **API Quotas**: Free tier has strict rate limits, requiring careful error handling
- **Consistency**: Sometimes responses vary in format, requiring robust parsing
- **Cost Considerations**: For production, would need to consider API costs vs. building rule-based logic
- **Latency**: AI API calls add ~1-2 seconds to the user experience

**When AI Was Most Valuable:**
- Analyzing complex customer profiles with multiple data points
- Providing nuanced recommendations that consider multiple factors simultaneously
- Generating explanations that help sales/marketing teams understand the "why" behind recommendations

**When Traditional Logic Would Be Better:**
- Simple if/then rules (e.g., "if trial ends in 3 days, send reminder")
- High-frequency operations where latency matters
- Operations requiring 100% consistency and predictability

---

## D. HubSpot Data Architecture

### Entity Relationship Diagram (ERD)

![HubSpot Data Architecture ERD](assets/images/SA_assessment_ADVANCED_ERD.png)

*This ERD was created using Google Gemini to generate Mermaid diagram code, which was then rendered into the visual diagram shown above. Gemini helped structure the complex relationships between HubSpot objects including Contacts, Deals (Trials and Hardware Purchases), Line Items, Products, and the Breezy Subscriptions custom object.*

### Deal Pipeline Architecture

#### 1. Hardware Pipeline (ID: `829155852`)
**Purpose**: Track hardware (thermostat) purchases

**Stages:**
- **Purchased** (ID: `1228120105`) - Customer has purchased thermostats
- Additional stages can be added (e.g., "Shipped", "Delivered", "Returned")

**Deal Properties:**
- `dealname`: "Thermostat Purchase - [Customer Name]"
- `amount`: Total purchase value (quantity × $299)
- `pipeline`: `829155852`
- `dealstage`: `1228120105` (Purchased)

**Associated Line Items:**
- Product: "Breezy Thermostat"
- Price: $299.00 per unit
- Quantity: Number of thermostats purchased
- Amount: Total value

#### 2. Default Pipeline (Trial Pipeline)
**Purpose**: Track trial signups and conversions

**Stages:**
- **Active** - Trial is currently active
- **Converted** - Trial converted to paid subscription
- **Lost** - Trial ended without conversion
- **Ended** - Trial has ended (treated same as Lost)

**Deal Properties:**
- `dealname`: "Breezy Premium - 30 Day Trial" (default)
- `amount`: Trial value (optional)
- `dealstage`: Selected from dynamic pipeline stages
- `pipeline`: Default pipeline (not Hardware Pipeline)

**Associated Line Items:**
- Product: "Breezy Premium"
- Price: Trial value amount
- Quantity: 1
- `recurringbillingfrequency`: "monthly" or "annually"
- Amount: Trial value

### Data Flow

1. **Contact Creation**:
   - Contact created in HubSpot
   - If thermostat quantity provided → Deal created in Hardware Pipeline
   - Line items created and associated

2. **Trial Creation**:
   - Deal created in default pipeline
   - "Breezy Premium" product found/created
   - Line item created with billing frequency
   - Deal associated with contact

3. **Subscription Tracking**:
   - Custom object "Breezy Subscriptions" (ID: `2-53381506`)
   - Linked to trials via `trial_id`
   - Status tracked (Active/Cancelled)
   - Dates tracked (active_date, cancellation_date)

### Associations

- **Contact ↔ Deal**: Many-to-many (HUBSPOT_DEFINED, type 3)
- **Deal ↔ Line Item**: Many-to-many (HUBSPOT_DEFINED, type 20)
- **Line Item ↔ Product**: Many-to-one (via `hs_product_id` property)
- **Subscription ↔ Trial**: One-to-one (via `trial_id` property)

---

## E. AI Feature Explanation

### Describe Your AI-Powered Feature

**AI Customer Health Insight** is a feature that analyzes customer data and generates actionable insights with specific recommendations for using HubSpot AI tools. When a user clicks "Get AI Insight" for a contact, the system:

1. Aggregates customer data (hardware purchases, trials, subscriptions, dates)
2. Sends a structured prompt to Google Gemini 2.0 Flash API
3. Receives analysis including:
   - **Likelihood to Upgrade**: Low/Medium/High with percentage
   - **Risk of Churn**: Low/Medium/High with percentage
   - **Suggested Action**: Specific recommendation with HubSpot AI tool suggestions
   - **Justification**: 2-3 sentence explanation

### Why Did You Choose This Feature?

1. **Real Business Value**: Customer health scoring is a common need for sales and marketing teams
2. **Demonstrates AI Integration**: Shows how AI can enhance HubSpot workflows
3. **Actionable Output**: Provides specific tool recommendations, not just insights
4. **Scalable**: Can analyze any customer without writing new rules
5. **Educational**: Shows the intersection of CRM data, AI analysis, and tool recommendations

### How Does It Make the Integration Smarter?

**Traditional Approach:**
- Manual review of customer data
- Rule-based scoring (e.g., "if trial > 20 days, high churn risk")
- Generic recommendations

**AI-Enhanced Approach:**
- **Contextual Analysis**: Considers multiple factors simultaneously (purchase history, trial activity, time patterns, conversion history)
- **Nuanced Insights**: Identifies patterns that might not be obvious (e.g., "customer with 2 thermostats but no active subscription = expansion opportunity")
- **Tool-Specific Recommendations**: Connects insights to specific HubSpot AI tools for execution
- **Justification**: Explains the "why" behind recommendations, helping teams understand and act

**Example:**
Instead of: "Customer has active trial"
AI provides: "High likelihood to upgrade (85%) - Customer purchased 2 thermostats and has active trial. Use HubSpot AI Email Assistant to draft personalized upgrade email highlighting multi-device benefits."

### When Would You Use AI vs Traditional Rules/Logic?

**Use AI When:**
- ✅ Analyzing complex, multi-dimensional customer profiles
- ✅ Need nuanced insights that consider context
- ✅ Patterns are not easily codified into if/then rules
- ✅ Recommendations need to be personalized and contextual
- ✅ You want explanations/justifications for insights
- ✅ Data patterns change frequently (AI adapts)

**Use Traditional Rules/Logic When:**
- ✅ Simple, binary conditions (e.g., "if subscription expires in 3 days")
- ✅ High-frequency operations where latency matters
- ✅ 100% consistency and predictability required
- ✅ Cost is a concern (AI API calls have costs)
- ✅ Rules are well-defined and stable
- ✅ Compliance/audit requirements need deterministic logic

**Hybrid Approach (Recommended):**
- Use rules for simple, high-frequency triggers
- Use AI for complex analysis and recommendations
- Combine both: Rules trigger workflows, AI provides context for personalization

---

## F. Design Decisions

### Technical Choices and Why

1. **Express.js Backend**
   - **Why**: Simple, well-documented, easy to extend
   - **Alternative Considered**: Next.js API routes (but wanted separation of concerns)

2. **Vanilla JavaScript Frontend**
   - **Why**: No build step required, fast iteration, demonstrates core skills
   - **Alternative Considered**: React/Vue (would add complexity for POC)

3. **HubSpot API v3**
   - **Why**: Most current, supports custom objects, better error handling
   - **Alternative Considered**: v1 (deprecated), v2 (limited features)

4. **Separate CSS/JS Files**
   - **Why**: Better organization, maintainability, follows best practices
   - **Alternative Considered**: Inline styles/scripts (initially, but refactored for clarity)

5. **Modal for AI Insights**
   - **Why**: Keeps table compact, better UX for detailed information
   - **Alternative Considered**: Inline expansion (too much space)

6. **Dynamic Pipeline Loading**
   - **Why**: Adapts to HubSpot configuration changes without code updates
   - **Alternative Considered**: Hardcoded stages (less flexible)

7. **Line Items for Both Purchases and Trials**
   - **Why**: Proper revenue tracking, supports reporting, follows HubSpot best practices
   - **Alternative Considered**: Deals only (less accurate for accounting)

### Assumptions About Breezy's Platform

1. **E-commerce Integration**: Assumed Breezy has an e-commerce platform that can trigger webhooks/API calls when:
   - Customer purchases thermostats
   - Customer signs up for trial

2. **Subscription Management**: Assumed Breezy has a subscription management system that:
   - Creates/updates subscriptions in HubSpot custom object
   - Links subscriptions to trials via `trial_id`
   - Tracks subscription status and dates

3. **Admin Panel Usage**: Assumed Breezy's team would use this admin panel for:
   - Manual data entry (for testing/demo purposes)
   - Viewing unified customer data
   - Getting AI insights for decision-making

4. **Pricing Structure**:
   - Thermostat: $299 per unit
   - Premium subscription: Variable pricing (monthly/annual)
   - Trial value: Optional (can be $0)

5. **Business Logic**:
   - Customers can purchase multiple thermostats
   - Customers can have multiple trials
   - Trials can convert to subscriptions
   - Subscriptions can be active or cancelled

### What Would You Improve With More Time?

1. **Error Handling**:
   - More granular error messages
   - Retry logic for transient API failures
   - Better validation before API calls

2. **Performance**:
   - Batch API calls where possible
   - Implement caching for pipeline stages
   - Lazy loading for large contact lists

3. **User Experience**:
   - Loading skeletons instead of "Loading..." text
   - Optimistic UI updates
   - Toast notifications for actions
   - Pagination for large datasets

4. **Testing**:
   - Unit tests for API endpoints
   - Integration tests for HubSpot API calls
   - Frontend component tests
   - E2E tests for critical flows

5. **Security**:
   - Input sanitization
   - Rate limiting
   - API key rotation
   - Environment-specific configurations

6. **Documentation**:
   - API documentation (Swagger/OpenAPI)
   - Code comments
   - Architecture diagrams
   - Deployment guides

7. **Features**:
   - Bulk contact import
   - Contact search/filtering
   - Export functionality
   - Historical data tracking
   - Webhook support for real-time updates

### What Would You Ask the Client Before Building Production Version?

1. **Integration Requirements**:
   - What triggers the sync? (webhooks, scheduled jobs, manual?)
   - What's the expected volume? (contacts/day, deals/day)
   - Are there other systems to integrate? (payment processors, shipping, etc.)

2. **Data Requirements**:
   - What additional contact properties are needed?
   - Are there other custom objects required?
   - What reporting/analytics are needed?
   - How long should historical data be retained?

3. **Business Rules**:
   - What defines a "qualified" trial?
   - When should deals be automatically updated?
   - What workflows should be automated?
   - Are there compliance requirements (GDPR, etc.)?

4. **User Experience**:
   - Who will use the admin panel? (technical/non-technical)
   - What's the primary use case? (data entry, reporting, analysis)
   - Are there mobile users?
   - What's the expected user count?

5. **Technical Constraints**:
   - What's the hosting environment? (cloud, on-premise)
   - Are there security/compliance requirements?
   - What's the budget for API calls (HubSpot, AI)?
   - Are there preferred technologies/frameworks?

6. **Success Metrics**:
   - How will success be measured?
   - What KPIs matter most?
   - What's the expected ROI?

7. **Timeline & Resources**:
   - What's the launch timeline?
   - Who will maintain the system?
   - What's the support model?

---

## Additional Resources

### API Endpoints

See the original README sections for detailed API documentation, or check `server.js` for implementation details.

### Project Structure

```
hs-solution-architect-tech-assignment/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (not in git)
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore rules
├── README.md             # This file
├── assets/              # Documentation assets
│   └── images/          # Images for README documentation
└── public/               # Frontend application
    ├── index.html        # Main HTML file
    ├── css/
    │   └── styles.css    # Application styles
    └── js/
        └── app.js        # Application logic
```

### Adding Images to README

To include images in this README, place them in the `assets/images/` directory and reference them using markdown syntax:

**Example:**
```markdown
![Alt text](assets/images/screenshot.png)
![Admin Panel Overview](assets/images/admin-panel.png)
```

**For images with captions or links:**
```markdown
[![Click to view larger](assets/images/diagram.png)](assets/images/diagram.png)
```

**Supported image formats:**
- PNG (recommended for screenshots)
- JPG/JPEG (for photos)
- GIF (for animated images)
- SVG (for diagrams)

**Best practices:**
- Use descriptive filenames (e.g., `admin-panel-overview.png` instead of `image1.png`)
- Keep file sizes reasonable for GitHub viewing
- Use alt text that describes the image content

### Troubleshooting

See the original README for common troubleshooting steps, or check the server console logs for detailed error messages.

---

**Good luck with your assessment!**

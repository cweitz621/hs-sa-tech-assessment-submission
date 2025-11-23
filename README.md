# HubSpot Integration - Solutions Architect Technical Assessment


This is a proof-of-concept application for the HubSpot Solutions Architect Technical Assessment. It demonstrates how Breezy (a smart home technology company) would integrate their platform with HubSpot to sync customer data, track trials, and manage subscriptions.

## Demo Video

https://www.loom.com/share/4fd919c08d354ebb99c7887411b19479

> **Note**: This video provides a quick demonstration of the technical functionality of the admin panel. For the business rationale, use cases, and architectural decisions behind this integration, please refer to the detailed documentation below in this README.

---

## Table of Contents

- [A. Project Overview](#a-project-overview)
  - [What This POC Demonstrates](#what-this-poc-demonstrates)
  - [Key Features](#key-features)
  - [Technology Stack](#technology-stack)
- [B. AI Usage Documentation](#b-ai-usage-documentation)
  - [Which AI Tools Did You Use?](#which-ai-tools-did-you-use)
  - [What Tasks Did You Use AI For?](#what-tasks-did-you-use-ai-for)
  - [What Did You Learn? What Was Challenging?](#what-did-you-learn-what-was-challenging)
  - [How Did AI Help (or Not Help)?](#how-did-ai-help-or-not-help)
- [C. HubSpot Data Architecture](#c-hubspot-data-architecture)
  - [Entity Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
  - [Why This Architecture?](#why-this-architecture)
  - [Deal Pipeline Architecture](#deal-pipeline-architecture)
  - [Data Flow](#data-flow)
- [D. AI Feature Explanation](#d-ai-feature-explanation)
  - [Describe Your AI-Powered Feature](#describe-your-ai-powered-feature)
  - [Why Did You Choose This Feature?](#why-did-you-choose-this-feature)
  - [How Does It Make the Integration Smarter?](#how-does-it-make-the-integration-smarter)
- [E. Design Decisions](#e-design-decisions)
  - [Technical Choices and Why](#technical-choices-and-why)
  - [Assumptions About Breezy's Platform](#assumptions-about-breezys-platform)
  - [What Would You Improve With More Time?](#what-would-you-improve-with-more-time)
  - [What Would You Ask the Client Before Building Production Version?](#what-would-you-ask-the-client-before-building-production-version)
  - [Project Structure](#project-structure)
- [F. Setup Instructions](#f-setup-instructions)
  - [Prerequisites](#prerequisites)
  - [How to Run Locally](#how-to-run-locally)
  - [How to Test the Integration Flow](#how-to-test-the-integration-flow)

---

## A. Project Overview

### What This POC Demonstrates

This proof-of-concept demonstrates an integration between Breezy's smart home platform and HubSpot CRM. The application simulates an admin panel that Breezy's team would use to:

1. **Sync Customer Data**: Automatically create HubSpot contacts when customers purchase thermostats or sign up for trials
2. **Track Hardware Purchases**: Create deals in HubSpot's "Hardware Pipeline" with associated line items for thermostat purchases
3. **Manage Trial Signups**: Create trial deals with line items that include billing frequency and pricing information
4. **Monitor Subscriptions**: Display subscription status from HubSpot's custom "Breezy Subscriptions" object
5. **Manage Subscription Status**: Update subscription status (Active/Cancelled) directly from the admin panel, demonstrating that Breezy Subscriptions can be edited in HubSpot via another system
6. **AI-Powered Insights**: Generate customer health insights using Google Gemini AI, with recommendations for HubSpot AI tools



### Key Features

- **Contact Management**: Create and view contacts. Optionally include Thermostat purchases which create deals and reflect in the table.
- **Deal Tracking**: Separate pipelines for hardware purchases (Hardware Pipeline) and trials (Default Pipeline)
- **Line Item Integration**: Automatic creation of line items for thermostats and premium subscriptions
- **Custom Object Integration**: Read subscription data from HubSpot custom objects
- **Subscription Status Management**: Update subscription status (Active/Cancelled) directly from the admin panel via inline dropdown, demonstrating bidirectional integration where external systems can edit HubSpot data
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

## B. AI Usage Documentation

### Which AI Tools Did You Use?

- **Cursor AI**: Used as the primary AI coding assistant throughout the development process
- **Google Gemini 2.0 Flash (Experimental)**: Used for generating customer health insights
- **Google Gemini**: Used in conjunction with Mermaid to generate the Entity Relationship Diagram (ERD) for the HubSpot data architecture


### What Tasks Did You Use AI For?

1. **Code Development and Implementation**:
   - Used Cursor AI as the primary coding assistant throughout the entire project
   - Generated initial code structure for Express.js backend and frontend components
   - Implemented HubSpot API integrations (contacts, deals, line items, custom objects)
   - Built AI insight feature integration with Gemini API
   - Refactored codebase structure (separating CSS/JS files)
   - Debugged API errors and integration issues (line item associations, duplicate email handling, pipeline stage loading)
   - Implemented error handling and user feedback mechanisms
   - Created responsive UI components and styling
   - Created searchable dropdown functionality for contact selection

2. **Documentation and Diagram Generation**:
   - Used Google Gemini to generate Mermaid diagram code for the Entity Relationship Diagram (ERD)
   - Gemini helped structure the complex relationships between HubSpot objects (Contacts, Deals, Line Items, Products, Custom Objects)
   - Mermaid rendered the diagram into a visual representation of the data architecture
   - Used Cursor AI to help write and structure the README documentation
   - Generated code examples and explanations for documentation

### What Did You Learn? What Was Challenging?

**What I Learned:**
- Prompt engineering is crucial for getting structured, actionable responses from AI
- AI models need clear instructions about output format (JSON structure)
- Context matters: providing comprehensive information about the business and its goals/priorities leads to better outcomes
- **AI for Documentation**: Using Gemini to generate Mermaid diagram code demonstrated how AI can accelerate documentation tasks, helping structure complex relationships and generate visual representations of system architecture

### How Did AI Help (or Not Help)?

**How AI Helped:**
- **Rapid Development**: Cursor AI significantly accelerated development by generating boilerplate code, API integration patterns, and common functionality
- **Debugging Support**: When encountering errors (like line item association issues, API 404s, or parsing problems), Cursor helped identify root causes and suggest fixes
- **Code Refactoring**: AI assisted in restructuring code (separating CSS/JS files) and improving code organization
- **Documentation Generation**: Gemini and Cursor helped generate comprehensive documentation, ERD diagrams, and code explanations
- **Problem Solving**: AI provided alternative approaches when initial implementations didn't work (e.g., trying different API endpoints for associations)
- **Time Savings**: Reduced time spent on repetitive tasks, allowing focus on higher-level architecture and business logic

**Limitations and Challenges:**
- **Missing Business Requirements**: A significant challenge was not knowing the customer's specific business requirements and not being able to conduct a full discovery session/s. This required making assumptions about Breezy's needs, workflows, and priorities, which may not align with their actual requirements
- **Diagram Generation Accuracy**: Gemini did not generate Mermaid diagram code accurately for the ERD. The relationship nodes and connections required manual adjustment to correctly represent the HubSpot data architecture
- **Code Review Needed**: Generated code sometimes required review and adjustment to match project requirements
- **Context Understanding**: Sometimes needed to provide additional context or clarify requirements when AI misunderstood the task
- **Error Handling**: AI-generated code sometimes lacked comprehensive error handling, requiring manual additions
- **Best Practices**: Had to verify that AI suggestions followed best practices and weren't just "working" solutions

**When AI Was Most Valuable:**
- Initial project setup and scaffolding
- Debugging complex integration issues
- Generating documentation and diagrams
- Implementing UI components with proper styling

**When I Needed to Rely More on Manual Work:**
- Understanding business requirements and translating them to code
- Making architectural decisions about data flow and structure
- Testing and validating that features worked as expected
- Ensuring code quality and maintainability
- Making final decisions on user experience and design choices

---

## C. HubSpot Data Architecture

### Entity Relationship Diagram (ERD)

![HubSpot Data Architecture ERD](assets/images/SA_assessment_ADVANCED_ERD.png)

*This ERD was created using Google Gemini to generate Mermaid diagram code, which was then rendered into the visual diagram shown above. Gemini helped structure the complex relationships between HubSpot objects including Contacts, Deals (Trials and Hardware Purchases), Line Items, Products, and the Breezy Subscriptions custom object.*

### Why This Architecture?

This data model architecture provides several key benefits for Breezy's business needs:

1. **Separation of Concerns**: 
   - **Deals** represent sales opportunities and transactions (one-time purchases, trials)
   - **Subscriptions** represent ongoing service relationships and recurring revenue
   - This separation allows Breezy to track sales activities separately from subscription management, enabling accurate reporting on both sales performance and recurring revenue

2. **Accurate Revenue Tracking**:
   - Line items linked to deals provide detailed product-level revenue tracking
   - Hardware purchases (thermostats) are tracked separately from subscription trials
   - Enables proper revenue recognition: one-time hardware sales vs. recurring subscription revenue

3. **Flexible Pipeline Management**:
   - Separate pipelines for hardware purchases and trials allow different sales processes
   - Hardware Pipeline can track fulfillment stages (Purchased, Shipped, Delivered)
   - Trial Pipeline can track conversion stages (Active, Converted, Lost)
   - Each pipeline can have its own stages and workflows optimized for that sales motion

4. **Scalable Product Management**:
   - Products are centralized and reusable across multiple deals
   - Line items reference products, enabling consistent pricing and product information
   - Easy to add new products without modifying deal structures

5. **Complete Customer Journey Tracking**:
   - Contacts can have multiple deals (hardware purchases and trials)
   - Provides full visibility into customer lifecycle: purchase → trial → subscription

6. **Reporting and Analytics**:
   - Can analyze hardware sales separately from subscription conversions
   - Track trial-to-subscription conversion rates
   - Calculate MRR/ARR from subscription data
   - Report on product-level performance through line items

7. **HubSpot Best Practices**:
   - Uses standard HubSpot objects (Contacts, Deals, Products, Line Items) for native reporting
   - Custom object (Breezy Subscriptions) extends functionality without breaking HubSpot conventions
   - Leverages HubSpot's built-in associations and relationship tracking

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

#### 2. Trial Pipeline
**Purpose**: Track trial signups and conversions

**Stages:**
- **Active** - Trial is currently active
- **Converted** - Trial converted to paid subscription
- **Ended** - Trial has ended

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
   - **Status can be updated from the admin panel**: Demonstrates bidirectional integration where external systems can edit HubSpot subscription data via API (`PATCH /api/subscriptions/:subscriptionId`)
   - When status is changed to "Cancelled", HubSpot workflows can automatically set the `cancellation_date` property

---

## D. AI Feature Explanation

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

**Note on Proof of Concept**: This AI feature is implemented as a proof of concept with limited data points (deal stages, trial dates, basic contact information). In a production application, the AI platform would have access to significantly more data and information that could enhance insights, including:

- Email engagement metrics (open rates, click-through rates, response rates)
- Website activity and behavior tracking
- Support ticket history and resolution times
- Product usage analytics and feature adoption
- Social media interactions and sentiment
- Marketing campaign engagement history
- Payment history and billing interactions
- Customer feedback and survey responses
- Integration usage data (e.g., smart home device connections)
- Historical communication logs and meeting notes

With this richer dataset, the AI could provide even more nuanced insights, identify subtle patterns, and generate highly personalized recommendations that account for the full customer journey and engagement history.

---

## E. Design Decisions

### Technical Choices and Why

1. **Express.js Backend**
   - **Why**: Simple, well-documented, easy to extend. Also was the provided boilerplate for this Assessment

2. **Vanilla JavaScript Frontend**
   - **Why**: No build step required, fast iteration, demonstrates core skills
   - **Alternative Considered**: React/Vue (would add complexity for POC)

3. **Modal for AI Insights**
   - **Why**: Keeps table compact, better UX for detailed information
   - **Alternative Considered**: Inline expansion (too much space)

4. **Dynamic Pipeline Loading**
   - **Why**: Adapts to HubSpot configuration changes without code updates
   - **Alternative Considered**: Hardcoded stages (less flexible)

5. **Line Items for Both Purchases and Trials**
   - **Why**: Proper revenue tracking, supports reporting, follows HubSpot best practices
   - **Alternative Considered**: Deals only (less accurate for accounting)

### Assumptions About Breezy's Platform

1. **E-commerce Integration**: Assumed Breezy has an e-commerce platform that can trigger webhooks/API calls when:
   - Customer purchases thermostats
   - Customer signs up for trial

2. **Subscription Management**: Assumed Breezy wants to track subscription status and information in HubSpot separately from deals, which represent sales opportunities. The subscription custom object:
   - Tracks the actual ongoing service relationship (separate from trial deals)
   - Tracks subscription status (Active/Cancelled) and important dates (active_date, cancellation_date)

3. **Admin Panel Usage**: Assumed Breezy's team would use this admin panel for:
   - Manual data entry (for testing/demo purposes)
   - Viewing unified customer data
   - Getting AI insights for decision-making

4. **Business Logic**:
   - Customers can purchase multiple thermostats
   - Customers can have multiple trials
   - Trials can convert to subscriptions
   - Subscriptions can be active or cancelled

### What Would You Improve With More Time?

1. **Reporting and Revenue Tracking Structure**:
   - Better understanding of Breezy's specific reporting needs and requirements
   - Establish a more set-in-stone data structure to handle reporting needs, particularly for recurring revenue tracking
   - Design subscription and revenue data models that support accurate MRR/ARR calculations and forecasting
   - Implement proper revenue recognition tracking aligned with their accounting needs

2. **Native HubSpot Subscription Object**:
   - Consider migrating from the custom "Breezy Subscriptions" object to HubSpot's native Subscription object
   - Leverage Commerce Hub features for subscription management, including:
     - Built-in subscription lifecycle management
     - Automated billing and payment processing integrations
     - Native subscription reporting and analytics
     - Subscription renewal and cancellation workflows
     - Integration with HubSpot Payments (if applicable)
   - Evaluate trade-offs: native object provides more features but may require Commerce Hub subscription and have different data structure requirements

3. **Error Handling**:
   - More granular error messages
   - Better validation before API calls

4. **Performance**:
   - Batch API calls where possible
   - Implement caching for pipeline stages

5. **Testing**:
   - Unit tests for API endpoints
   - Integration tests for HubSpot API calls

6. **Security**:
   - Input sanitization
   - Rate limiting


### What Would You Ask the Client Before Building Production Version?

1. **Integration Requirements**:
   - What triggers the sync? (webhooks, scheduled jobs, manual?)
   - What's the expected volume? (contacts/day, deals/day)
   - Are there other systems to integrate? (payment processors, shipping, etc.)

2. **Data Requirements**:
   - What additional contact properties are needed?
   - Are there other custom objects required?
   - What reporting/analytics are needed?
   - Do we need to track recurring revenue in HubSpot?
   - How long should historical data be retained?

3. **Business Rules**:
   - When should deals be automatically updated?
   - What workflows should be automated?
   - Are there compliance requirements (GDPR, etc.)?


5. **Technical Constraints**:
   - What's the hosting environment? (cloud, on-premise)
   - Are there security/compliance requirements?
   - What's the budget for API calls (HubSpot, AI)?
   - Are there preferred technologies/frameworks?

7. **Timeline & Resources**:
   - What's the launch timeline?
   - Who will maintain the system?
   - What's the support model?

---

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

---

## F. Setup Instructions

> **Note for Evaluators**: The setup instructions below are provided for reference if you'd like to run the application locally. The demo video and documentation above demonstrate the functionality and rationale.

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

Create a `.env` file in the root directory:

```bash
# If .env.example exists, copy it:
cp .env.example .env

# Otherwise, create the file manually:
touch .env
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
- Example: `POST /crm/v3/objects/[object ID]` (using object ID `2-53381506`)

**For this POC, I demonstrate Option A (workflows)** to show how you can reduce API call volume. In production, choose the approach that best fits your needs, rate limits, and control requirements.

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

#### 7. Set Up Subscription Status Update Workflow (Optional)

**Optional Enhancement**: To automatically set the `cancellation_date` when a subscription status is changed to "Cancelled":

1. **Navigate to Workflows**:
   - Go to **Automation** → **Workflows** in your HubSpot account
   - Click **Create workflow**

2. **Set Workflow Trigger**:
   - Choose **Custom object-based workflow**
   - Select object: **Breezy Subscription**
   - Set trigger: When `status` property changes to "Cancelled"

3. **Add Action: Set Property Value**:
   - Add action: **Set property value**
   - Property: `cancellation_date`
   - Value: Current date/time

4. **Activate the Workflow**:
   - Review and activate the workflow
   - When a subscription status is updated to "Cancelled" from the admin panel, the workflow will automatically set the cancellation date

**This demonstrates bidirectional integration**: The admin panel can update HubSpot data, and HubSpot workflows can respond to those updates, creating a seamless integration between systems.

#### 8. Access the Application

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
     - Contact information (name, email, phone)
     - Thermostat purchases (quantity and total amount)
     - Trials (deal name, amount, stage, ID)
     - **Breezy Subscriptions** (status, dates, trial ID) - *These are created by HubSpot workflows when trials convert*
     - AI Customer Health insights (optional)

4. **Update Subscription Status:**
   - In the "Breezy Subscriptions" column, click the status dropdown on any subscription card
   - Change the status from "Active" to "Cancelled" (or vice versa)
   - The status updates immediately in HubSpot via API
   - If changing to "Cancelled", the cancellation date will be set by a HubSpot workflow (if configured) and will appear after a brief delay
   - This demonstrates that Breezy Subscriptions can be edited in HubSpot from an external system (the admin panel)

5. **Test AI Insights:**
   - Click "Get AI Insight" button for any contact
   - Modal will display AI-generated customer health analysis
   - Includes likelihood to upgrade, churn risk, and HubSpot AI tool recommendations

6. **Test Error Handling:**
   - Try creating a contact with an existing email address
   - Verify you receive a clear error message about duplicate contacts


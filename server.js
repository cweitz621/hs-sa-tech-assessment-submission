require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory (for easy frontend development)
app.use(express.static(path.join(__dirname, 'public')));

// HubSpot API configuration
const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Validate token on startup
if (!HUBSPOT_TOKEN) {
  console.error('❌ ERROR: HUBSPOT_ACCESS_TOKEN not found in .env file');
  console.error('Please create a .env file and add your HubSpot Private App token');
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});

// GET endpoint - Fetch contacts from HubSpot
app.get('/api/contacts', async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 50,
          properties: 'firstname,lastname,email,phone,address,jobtitle,company'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching contacts:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch contacts',
      details: error.response?.data || error.message
    });
  }
});

// POST endpoint - Create new contact in HubSpot
app.post('/api/contacts', async (req, res) => {
  try {
    const { properties, thermostatQuantity } = req.body;
    
    // Create the contact
    const contactResponse = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      {
        properties: properties
      },
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const contactId = contactResponse.data.id;
    const contactData = contactResponse.data;
    
    // If thermostat quantity is provided, create a purchase deal with line items
    if (thermostatQuantity && parseInt(thermostatQuantity) > 0) {
      const quantity = parseInt(thermostatQuantity);
      const unitPrice = 299;
      const totalAmount = quantity * unitPrice;
      const contactName = `${properties.firstname || ''} ${properties.lastname || ''}`.trim() || properties.email || 'Customer';
      
      // Create the deal in the order pipeline
      const dealResponse = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
        {
          properties: {
            dealname: `Thermostat Purchase - ${contactName}`,
            amount: totalAmount.toString(),
            dealstage: '1228120105', // "Purchased" stage ID
            pipeline: '829155852' // Order pipeline ID
          },
          associations: [{
            to: { id: contactId },
            types: [{
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: 3 // Deal to Contact association
            }]
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const dealId = dealResponse.data.id;
      
      // Find or create the "Breezy Thermostat" product
      let productId;
      try {
        console.log('Searching for Breezy Thermostat product...');
        // Try to find existing product
        const productSearch = await axios.get(
          `${HUBSPOT_API_BASE}/crm/v3/objects/products`,
          {
            headers: {
              'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
              'Content-Type': 'application/json'
            },
            params: {
              limit: 1,
              properties: 'name',
              filterGroups: [{
                filters: [{
                  propertyName: 'name',
                  operator: 'EQ',
                  value: 'Breezy Thermostat'
                }]
              }]
            }
          }
        );
        
        console.log('Product search results:', productSearch.data);
        
        if (productSearch.data.results && productSearch.data.results.length > 0) {
          productId = productSearch.data.results[0].id;
          console.log(`Found existing product with ID: ${productId}`);
        } else {
          // Create the product if it doesn't exist
          console.log('Product not found, creating new product...');
          const productCreate = await axios.post(
            `${HUBSPOT_API_BASE}/crm/v3/objects/products`,
            {
              properties: {
                name: 'Breezy Thermostat',
                price: unitPrice.toString()
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );
          productId = productCreate.data.id;
          console.log(`Created new product with ID: ${productId}`);
        }
      } catch (productError) {
        console.error('Error finding/creating product:', productError.response?.data || productError.message);
        console.error('Full product error:', productError);
        // Continue without line items if product creation fails
      }
      
      // Create line items if product was found/created
      if (productId) {
        try {
          console.log(`Creating line item for deal ${dealId}, product ${productId}, quantity ${quantity}`);
          
          // Create the line item first
          const lineItemResponse = await axios.post(
            `${HUBSPOT_API_BASE}/crm/v3/objects/line_items`,
            {
              properties: {
                name: 'Breezy Thermostat',
                quantity: quantity.toString(),
                price: unitPrice.toString(),
                amount: totalAmount.toString(),
                hs_product_id: productId // Associate product via property
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log('Line item created:', lineItemResponse.data);
          const lineItemId = lineItemResponse.data.id;
          
          // Associate line item to deal using v3 PUT endpoint
          try {
            await axios.put(
              `${HUBSPOT_API_BASE}/crm/v3/objects/line_items/${lineItemId}/associations/deals/${dealId}/20`,
              {},
              {
                headers: {
                  'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            console.log('Line item successfully associated to deal');
          } catch (assocError) {
            console.error('Error associating line item to deal:', assocError.response?.data || assocError.message);
          }
        } catch (lineItemError) {
          console.error('Error creating line item:', lineItemError.response?.data || lineItemError.message);
          console.error('Full error:', lineItemError);
          // Continue even if line item creation fails
        }
      } else {
        console.log('No productId available, skipping line item creation');
      }
      
      // Return contact data with deal info
      return res.json({
        ...contactData,
        thermostatDeal: {
          id: dealId,
          amount: totalAmount,
          quantity: quantity
        }
      });
    }
    
    res.json(contactData);
  } catch (error) {
    console.error('Error creating contact:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to create contact',
      details: error.response?.data || error.message
    });
  }
});

// GET endpoint - Fetch all deals from HubSpot
app.get('/api/deals', async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 50,
          properties: 'dealname,amount,dealstage,closedate,pipeline'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching deals:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch deals',
      details: error.response?.data || error.message
    });
  }
});

// POST endpoint - Create new deal and associate to contact
app.post('/api/deals', async (req, res) => {
  try {
    const { dealProperties, contactId } = req.body;
    
    // Create the deal with association to contact
    const dealResponse = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      {
        properties: dealProperties,
        associations: contactId ? [{
          to: { id: contactId },
          types: [{
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: 3 // Deal to Contact association
          }]
        }] : []
      },
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(dealResponse.data);
  } catch (error) {
    console.error('Error creating deal:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to create deal',
      details: error.response?.data || error.message
    });
  }
});

// GET endpoint - Fetch deal pipelines and stages
app.get('/api/pipelines', async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/pipelines/deals`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching pipelines:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch pipelines',
      details: error.response?.data || error.message
    });
  }
});

// GET endpoint - Fetch deals associated with a specific contact
app.get('/api/contacts/:contactId/deals', async (req, res) => {
  try {
    const { contactId } = req.params;
    
    // First, get the deal associations for this contact
    const associationsResponse = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}/associations/deals`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // If there are associated deals, fetch their full details
    if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
      const dealIds = associationsResponse.data.results.map(r => r.id);
      
      const dealsResponse = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/deals/batch/read`,
        {
          inputs: dealIds.map(id => ({ id })),
          properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline', 'converted_subscription_id']
        },
        {
          headers: {
            'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Filter out deals from the order pipeline (thermostat purchases)
      // Only return deals that are NOT in the order pipeline (829155852)
      const trialDeals = (dealsResponse.data.results || []).filter(
        deal => deal.properties.pipeline !== '829155852'
      );
      
      res.json({ results: trialDeals });
    } else {
      res.json({ results: [] });
    }
  } catch (error) {
    console.error('Error fetching deals for contact:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch deals for contact',
      details: error.response?.data || error.message
    });
  }
});

// GET endpoint - Fetch thermostat purchase deals for a specific contact
app.get('/api/contacts/:contactId/thermostat-deals', async (req, res) => {
  try {
    const { contactId } = req.params;
    
    // Get deal associations for this contact
    const associationsResponse = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}/associations/deals`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // If there are associated deals, fetch their full details and filter for order pipeline
    if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
      const dealIds = associationsResponse.data.results.map(r => r.id);
      
      const dealsResponse = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/deals/batch/read`,
        {
          inputs: dealIds.map(id => ({ id })),
          properties: ['dealname', 'amount', 'dealstage', 'pipeline']
        },
        {
          headers: {
            'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Filter for deals in the order pipeline (829155852)
      const thermostatDeals = (dealsResponse.data.results || []).filter(
        deal => deal.properties.pipeline === '829155852'
      );
      
      // For each deal, get line items to get quantity
      const dealsWithLineItems = await Promise.all(
        thermostatDeals.map(async (deal) => {
          try {
            const lineItemsResponse = await axios.get(
              `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${deal.id}/associations/line_items`,
              {
                headers: {
                  'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            let totalQuantity = 0;
            if (lineItemsResponse.data.results && lineItemsResponse.data.results.length > 0) {
              const lineItemIds = lineItemsResponse.data.results.map(r => r.id);
              const lineItemsDetails = await axios.post(
                `${HUBSPOT_API_BASE}/crm/v3/objects/line_items/batch/read`,
                {
                  inputs: lineItemIds.map(id => ({ id })),
                  properties: ['quantity', 'name']
                },
                {
                  headers: {
                    'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              // Sum up quantities from all line items
              totalQuantity = (lineItemsDetails.data.results || []).reduce((sum, item) => {
                const qty = parseInt(item.properties.quantity || '0');
                return sum + qty;
              }, 0);
            }
            
            return {
              ...deal,
              quantity: totalQuantity
            };
          } catch (error) {
            console.error(`Error fetching line items for deal ${deal.id}:`, error);
            return {
              ...deal,
              quantity: 0
            };
          }
        })
      );
      
      res.json({ results: dealsWithLineItems });
    } else {
      res.json({ results: [] });
    }
  } catch (error) {
    console.error('Error fetching thermostat deals for contact:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch thermostat deals for contact',
      details: error.response?.data || error.message
    });
  }
});

// GET endpoint - Fetch Breezy Subscriptions (custom object) associated with a specific contact
app.get('/api/contacts/:contactId/subscriptions', async (req, res) => {
  try {
    const { contactId } = req.params;
    
    // Get associations between contact and Breezy Subscriptions custom object
    // Using the object type ID for the Breezy Subscriptions custom object
    const objectType = '2-53381506';
    
    const associationsResponse = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}/associations/${objectType}`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // If there are associated subscriptions, fetch their full details
    if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
      const subscriptionIds = associationsResponse.data.results.map(r => r.id);
      
      // Fetch subscription properties - adjust property names based on your custom object schema
      // Common property names: hs_object_id (record ID), status, subscription_id, etc.
      const subscriptionsResponse = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/${objectType}/batch/read`,
        {
          inputs: subscriptionIds.map(id => ({ id })),
          properties: ['hs_object_id', 'status', 'subscription_id', 'active_date', 'cancellation_date', 'trial_id'] // Fetch subscription properties including dates and trial_id
        },
        {
          headers: {
            'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.json(subscriptionsResponse.data);
    } else {
      res.json({ results: [] });
    }
  } catch (error) {
    console.error('Error fetching subscriptions for contact:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch subscriptions for contact',
      details: error.response?.data || error.message
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log('\n✅ Server running successfully!');
  console.log(`🌐 API available at: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Static files served from: /public`);
  console.log('\n💡 Using hot-reload? Run: npm run dev');
  console.log('🛑 To stop server: Press Ctrl+C\n');
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  Received ${signal}, closing server gracefully...`);
  
  server.close(() => {
    console.log('✅ Server closed successfully');
    console.log('👋 Goodbye!\n');
    process.exit(0);
  });

  // Force close after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

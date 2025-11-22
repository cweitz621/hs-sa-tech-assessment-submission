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

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

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
          properties: 'firstname,lastname,email,phone,address'
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
    
    // Check if this is a duplicate email error
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || '';
    const errorStatus = error.response?.status;
    
    // HubSpot typically returns 409 Conflict or 400 Bad Request for duplicate emails
    // Check for common duplicate email indicators
    const isDuplicateEmail = 
      errorStatus === 409 || 
      errorStatus === 400 ||
      errorMessage.toLowerCase().includes('already exists') ||
      errorMessage.toLowerCase().includes('duplicate') ||
      errorMessage.toLowerCase().includes('unique constraint') ||
      (errorData?.errors && errorData.errors.some(err => 
        err.message?.toLowerCase().includes('already exists') ||
        err.message?.toLowerCase().includes('duplicate') ||
        err.message?.toLowerCase().includes('unique constraint')
      ));
    
    if (isDuplicateEmail) {
      return res.status(409).json({
        error: 'Contact already exists',
        message: 'A contact with this email address already exists in HubSpot. This form is only for creating new contacts. Please use the existing contact in HubSpot to update information or create deals.',
        details: errorData
      });
    }
    
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
    const { dealProperties, contactId, billingFrequency, lineItemPrice } = req.body;
    
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
    
    const dealId = dealResponse.data.id;
    
    // Create line item if billing frequency and price are provided
    if (billingFrequency && lineItemPrice) {
      try {
        // Find or create the "Breezy Premium" product
        let productId;
        try {
          console.log('Searching for Breezy Premium product...');
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
                    value: 'Breezy Premium'
                  }]
                }]
              }
            }
          );
          
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
                  name: 'Breezy Premium',
                  price: lineItemPrice.toString()
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
          // Continue without line item if product creation fails
        }
        
        // Create the line item
        if (productId) {
          const price = parseFloat(lineItemPrice) || 0;
          
          const lineItemResponse = await axios.post(
            `${HUBSPOT_API_BASE}/crm/v3/objects/line_items`,
            {
              properties: {
                name: 'Breezy Premium',
                price: price.toString(),
                amount: price.toString(),
                quantity: '1',
                recurringbillingfrequency: billingFrequency, // monthly or annually
                hs_product_id: productId
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const lineItemId = lineItemResponse.data.id;
          console.log('Line item created:', lineItemId);
          
          // Associate line item to deal
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
        }
      } catch (lineItemError) {
        console.error('Error creating line item:', lineItemError.response?.data || lineItemError.message);
        // Continue even if line item creation fails
      }
    }
    
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

// POST endpoint - Get AI Customer Health Insight for a contact
app.post('/api/contacts/:contactId/ai-insight', async (req, res) => {
  try {
    const { contactId } = req.params;
    
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key not configured',
        details: 'Please set GEMINI_API_KEY in your .env file'
      });
    }
    
    // Get contact details
    let contactData = null;
    try {
      const contactRes = await axios.get(
        `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`,
        {
          headers: {
            'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          params: {
            properties: 'firstname,lastname,email,createdate'
          }
        }
      );
      contactData = contactRes.data;
    } catch (error) {
      console.error('Error fetching contact:', error);
    }
    
    // Get all deals for the contact
    let allDeals = [];
    try {
      const assocRes = await axios.get(
        `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}/associations/deals`,
        {
          headers: {
            'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (assocRes.data.results && assocRes.data.results.length > 0) {
        const dealIds = assocRes.data.results.map(r => r.id);
        const dealsRes = await axios.post(
          `${HUBSPOT_API_BASE}/crm/v3/objects/deals/batch/read`,
          {
            inputs: dealIds.map(id => ({ id })),
            properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline', 'createdate', 'converted_subscription_id']
          },
          {
            headers: {
              'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        allDeals = dealsRes.data.results || [];
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
    
    // Separate thermostat and trial deals
    const thermostatDeals = allDeals.filter(d => d.properties.pipeline === '829155852');
    const trialDeals = allDeals.filter(d => d.properties.pipeline !== '829155852');
    
    // Get subscriptions
    let subscriptions = [];
    try {
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
      
      if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
        const subscriptionIds = associationsResponse.data.results.map(r => r.id);
        const subscriptionsResponse = await axios.post(
          `${HUBSPOT_API_BASE}/crm/v3/objects/${objectType}/batch/read`,
          {
            inputs: subscriptionIds.map(id => ({ id })),
            properties: ['hs_object_id', 'status', 'subscription_id', 'active_date', 'cancellation_date', 'trial_id']
          },
          {
            headers: {
              'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        subscriptions = subscriptionsResponse.data.results || [];
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
    
    // Calculate metrics - get actual quantities from line items
    let hardwareCount = 0;
    for (const deal of thermostatDeals) {
      try {
        const lineItemsRes = await axios.get(
          `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${deal.id}/associations/line_items`,
          {
            headers: {
              'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (lineItemsRes.data.results && lineItemsRes.data.results.length > 0) {
          const lineItemIds = lineItemsRes.data.results.map(r => r.id);
          const lineItemsDetails = await axios.post(
            `${HUBSPOT_API_BASE}/crm/v3/objects/line_items/batch/read`,
            {
              inputs: lineItemIds.map(id => ({ id })),
              properties: ['quantity']
            },
            {
              headers: {
                'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          hardwareCount += (lineItemsDetails.data.results || []).reduce((sum, item) => {
            return sum + parseInt(item.properties.quantity || '0');
          }, 0);
        } else {
          hardwareCount += 1; // Fallback to 1 if no line items
        }
      } catch (error) {
        hardwareCount += 1; // Fallback to 1 if error
      }
    }
    
    const totalHardwareValue = thermostatDeals.reduce((sum, deal) => {
      return sum + (parseFloat(deal.properties.amount || 0));
    }, 0);
    
    const activeSubscriptions = subscriptions.filter(s => s.properties?.status?.toLowerCase() === 'active');
    const cancelledSubscriptions = subscriptions.filter(s => s.properties?.status?.toLowerCase() === 'cancelled');
    
    const convertedTrials = trialDeals.filter(d => d.properties.converted_subscription_id);
    const unconvertedTrials = trialDeals.filter(d => !d.properties.converted_subscription_id);
    
    const totalTrialValue = trialDeals.reduce((sum, deal) => {
      return sum + (parseFloat(deal.properties.amount || 0));
    }, 0);
    
    // Get dates
    const contactCreatedDate = contactData?.properties?.createdate || 'Unknown';
    const latestHardwarePurchase = thermostatDeals.length > 0 
      ? thermostatDeals.sort((a, b) => new Date(b.properties.createdate || 0) - new Date(a.properties.createdate || 0))[0].properties.createdate
      : null;
    const latestTrialDate = trialDeals.length > 0
      ? trialDeals.sort((a, b) => new Date(b.properties.createdate || 0) - new Date(a.properties.createdate || 0))[0].properties.createdate
      : null;
    
    // Build prompt for Gemini
    const customerSummary = `
Customer Profile for ${contactData?.properties?.firstname || ''} ${contactData?.properties?.lastname || ''} (${contactData?.properties?.email || 'N/A'}):

Hardware Purchases:
- Total thermostats purchased: ${hardwareCount}
- Total hardware value: $${totalHardwareValue.toFixed(2)}
- Latest purchase date: ${latestHardwarePurchase || 'No purchases'}

Subscription Status:
- Active subscriptions: ${activeSubscriptions.length}
- Cancelled subscriptions: ${cancelledSubscriptions.length}
- Total subscriptions: ${subscriptions.length}

Trial Activity:
- Total trials: ${trialDeals.length}
- Converted trials: ${convertedTrials.length}
- Unconverted trials: ${unconvertedTrials.length}
- Total trial value: $${totalTrialValue.toFixed(2)}
- Latest trial date: ${latestTrialDate || 'No trials'}

Key Dates:
- Customer since: ${contactCreatedDate}
- Days since last hardware purchase: ${latestHardwarePurchase ? Math.floor((new Date() - new Date(latestHardwarePurchase)) / (1000 * 60 * 60 * 24)) : 'N/A'}
- Days since last trial: ${latestTrialDate ? Math.floor((new Date() - new Date(latestTrialDate)) / (1000 * 60 * 60 * 24)) : 'N/A'}

Conversion Pattern:
${convertedTrials.length > 0 ? `- Has converted ${convertedTrials.length} trial(s) to paid subscription` : '- No trial conversions yet'}
${unconvertedTrials.length > 0 ? `- Has ${unconvertedTrials.length} unconverted trial(s)` : ''}
${latestHardwarePurchase && !latestTrialDate ? '- Purchased hardware but has not started a trial' : ''}
${latestTrialDate && unconvertedTrials.length > 0 ? '- Started trial but has not converted to paid subscription' : ''}
`;

    const prompt = `${customerSummary}

Based on this customer data, provide a concise AI Customer Health Insight analysis. Return your response as a JSON object with the following structure:
{
  "likelihoodToUpgrade": "Low/Medium/High with percentage (e.g., 'High (85%)')",
  "riskOfChurn": "Low/Medium/High with percentage (e.g., 'Medium (45%)')",
  "suggestedAction": "A specific, actionable marketing or sales recommendation that includes which HubSpot AI tools to use for execution (e.g., 'Use HubSpot AI Content Writer to create personalized email campaign', 'Leverage ChatSpot AI to analyze customer engagement patterns', 'Use HubSpot AI Email Assistant to draft follow-up sequences', 'Utilize HubSpot AI-powered workflows to automate re-engagement')",
  "justification": "A brief 2-3 sentence explanation of the insights"
}

Focus on:
- Their engagement level (hardware ownership, trial activity)
- Conversion patterns (trial to subscription)
- Time-based signals (recent activity vs. inactivity)
- Risk factors (unconverted trials, no recent activity)
- Opportunities (upsell potential, re-engagement needs)

IMPORTANT: In your suggestedAction field, you MUST recommend specific HubSpot AI tools that sales and marketing teams can use to tactically execute on the suggestion. Examples include:
- HubSpot AI Content Writer (for creating personalized content)
- ChatSpot AI (for data analysis and insights)
- HubSpot AI Email Assistant (for drafting emails)
- HubSpot AI-powered Workflows (for automation)
- HubSpot AI Chatbot (for customer engagement)
- HubSpot AI Sales Assistant (for sales recommendations)
- HubSpot AI Marketing Hub features (for campaign optimization)

Be specific and actionable in your recommendations, always tying them to HubSpot AI tool capabilities.`;

    // Call Gemini 2.0 Flash API (experimental)
    const geminiResponse = await axios.post(
      `${GEMINI_API_BASE}/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract the response text
    const responseText = geminiResponse.data.candidates[0].content.parts[0].text;
    
    // Try to parse JSON from the response (it might be wrapped in markdown code blocks)
    let insightData;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      insightData = JSON.parse(jsonText);
    } catch (parseError) {
      // If parsing fails, create a structured response from the text
      console.error('Error parsing Gemini response:', parseError);
      insightData = {
        likelihoodToUpgrade: "Analysis unavailable",
        riskOfChurn: "Analysis unavailable",
        suggestedAction: "Review customer data manually",
        justification: responseText.substring(0, 200) + "..."
      };
    }
    
    res.json({
      success: true,
      insight: insightData,
      rawResponse: responseText
    });
    
  } catch (error) {
    console.error('Error generating AI insight:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to generate AI insight',
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

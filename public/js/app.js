const API_BASE = 'http://localhost:3001/api';

// Utility functions
function showMessage(containerId, message, type = 'error') {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function setLoading(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (isLoading) {
        element.disabled = true;
        element.textContent = 'Loading...';
    } else {
        element.disabled = false;
    }
}

// Store pipeline stages mapping for display
let pipelineStagesMap = {};

// Load pipeline stages and populate dropdown
async function loadPipelineStages() {
    try {
        const response = await fetch(`${API_BASE}/pipelines`);
        if (!response.ok) throw new Error('Failed to fetch pipelines');
        
        const data = await response.json();
        const select = document.getElementById('dealstage');
        
        // Clear existing options
        select.innerHTML = '';
        
        // Build mapping of stage IDs to labels for display
        pipelineStagesMap = {};
        
        if (data.results && data.results.length > 0) {
            // Get the default pipeline (usually the first one, or marked as default)
            const defaultPipeline = data.results.find(p => p.archived === false) || data.results[0];
            
            if (defaultPipeline && defaultPipeline.stages) {
                // Populate dropdown with stages
                defaultPipeline.stages.forEach(stage => {
                    const option = document.createElement('option');
                    option.value = stage.id;
                    option.textContent = stage.label;
                    
                    // Store mapping for display
                    pipelineStagesMap[stage.id] = stage.label;
                    
                    // Mark "closedwon" equivalent as selected if it exists
                    if (stage.label.toLowerCase().includes('won') || 
                        stage.label.toLowerCase().includes('closed won') ||
                        stage.id === 'closedwon') {
                        option.selected = true;
                    }
                    
                    select.appendChild(option);
                });
                
                // If no stage was selected, select the first one
                if (!select.value && select.options.length > 0) {
                    select.options[0].selected = true;
                }
            } else {
                select.innerHTML = '<option value="">No stages available</option>';
            }
        } else {
            select.innerHTML = '<option value="">No pipelines found</option>';
        }
    } catch (error) {
        console.error('Error loading pipeline stages:', error);
        const select = document.getElementById('dealstage');
        select.innerHTML = '<option value="">Error loading stages</option>';
    }
}

// Load contacts into select dropdown
async function loadContactsForSelect() {
    try {
        const response = await fetch(`${API_BASE}/contacts`);
        if (!response.ok) throw new Error('Failed to fetch contacts');
        
        const data = await response.json();
        const select = document.getElementById('contact-select');
        
        select.innerHTML = '<option value="">Select a contact...</option>';
        
        if (data.results && data.results.length > 0) {
            data.results.forEach(contact => {
                const option = document.createElement('option');
                option.value = contact.id;
                const name = `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || 
                            contact.properties.email || 'Unknown';
                option.textContent = `${name} (${contact.properties.email || 'No email'})`;
                select.appendChild(option);
            });
        } else {
            select.innerHTML = '<option value="">No contacts available</option>';
        }
    } catch (error) {
        console.error('Error loading contacts for select:', error);
        const select = document.getElementById('contact-select');
        select.innerHTML = '<option value="">Error loading contacts</option>';
    }
}

// Load and display contacts
async function loadContacts() {
    const container = document.getElementById('contacts-container');
    container.innerHTML = '<div class="loading">Loading contacts</div>';
    
    try {
        const response = await fetch(`${API_BASE}/contacts`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch contacts');
        }
        
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No contacts found in HubSpot.</p>
                    <p>Create your first contact using the form above.</p>
                </div>
            `;
            return;
        }
        
        let tableHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Job Title</th>
                            <th>Company</th>
                            <th>Thermostat Purchase</th>
                            <th>Trial</th>
                            <th>Breezy Subscriptions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Load deals, thermostat deals, and subscriptions for each contact
        for (const contact of data.results) {
            const deals = await loadDealsForContact(contact.id);
            const thermostatDeals = await loadThermostatDealsForContact(contact.id);
            const subscriptions = await loadSubscriptionsForContact(contact.id);
            
            tableHTML += `
                <tr>
                    <td>${contact.properties.firstname || '-'}</td>
                    <td>${contact.properties.lastname || '-'}</td>
                    <td>${contact.properties.email || '-'}</td>
                    <td>${contact.properties.jobtitle || '-'}</td>
                    <td>${contact.properties.company || '-'}</td>
                    <td>${renderThermostatDeals(thermostatDeals)}</td>
                    <td>${renderDeals(deals)}</td>
                    <td>${renderSubscriptions(subscriptions)}</td>
                </tr>
            `;
        }
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = tableHTML;
    } catch (error) {
        console.error('Error loading contacts:', error);
        container.innerHTML = `<div class="error">Error loading contacts: ${error.message}</div>`;
        showMessage('contacts-message', `Error: ${error.message}`, 'error');
    }
}

// Load deals for a specific contact
async function loadDealsForContact(contactId) {
    try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}/deals`);
        if (!response.ok) return [];
        
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error(`Error loading deals for contact ${contactId}:`, error);
        return [];
    }
}

// Load thermostat purchase deals for a specific contact
async function loadThermostatDealsForContact(contactId) {
    try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}/thermostat-deals`);
        if (!response.ok) return [];
        
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error(`Error loading thermostat deals for contact ${contactId}:`, error);
        return [];
    }
}

// Load Breezy Subscriptions for a specific contact
async function loadSubscriptionsForContact(contactId) {
    try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}/subscriptions`);
        if (!response.ok) return [];
        
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error(`Error loading subscriptions for contact ${contactId}:`, error);
        return [];
    }
}

// Render deals (trials) for a contact
function renderDeals(deals) {
    if (!deals || deals.length === 0) {
        return '<span class="no-deals">No trials</span>';
    }
    
    return deals.map(deal => {
        const amount = deal.properties.amount ? `$${parseFloat(deal.properties.amount).toFixed(2)}` : 'N/A';
        // Use stage label from mapping if available, otherwise use the stage ID
        const stageId = deal.properties.dealstage || 'Unknown';
        const stageLabel = pipelineStagesMap[stageId] || stageId;
        const recordId = deal.id || 'N/A';
        
        return `
            <div class="deal-item">
                <strong>${deal.properties.dealname || 'Unnamed Deal'}</strong><br>
                <span class="amount">${amount}</span> • Stage: ${stageLabel}<br>
                Record ID: ${recordId}
            </div>
        `;
    }).join('');
}

// Render thermostat purchase deals for a contact
function renderThermostatDeals(thermostatDeals) {
    if (!thermostatDeals || thermostatDeals.length === 0) {
        return '<span class="no-deals">No purchases</span>';
    }
    
    return thermostatDeals.map(deal => {
        const amount = deal.properties.amount ? `$${parseFloat(deal.properties.amount).toFixed(2)}` : 'N/A';
        const quantity = deal.quantity || 0;
        
        return `
            <div class="deal-item">
                <strong>${deal.properties.dealname || 'Thermostat Purchase'}</strong><br>
                Quantity: <span style="color: #667eea; font-weight: 600;">${quantity}</span><br>
                Total: <span class="amount">${amount}</span>
            </div>
        `;
    }).join('');
}

// Render Breezy Subscriptions for a contact
function renderSubscriptions(subscriptions) {
    if (!subscriptions || subscriptions.length === 0) {
        return '<span class="no-deals">No subscriptions</span>';
    }
    
    return subscriptions.map(subscription => {
        // Try multiple possible property names for subscription ID
        const subscriptionId = subscription.properties?.subscription_id || 
                              subscription.properties?.hs_object_id || 
                              subscription.id || 
                              'N/A';
        const status = subscription.properties?.status || 'Unknown';
        const trialId = subscription.properties?.trial_id || 'N/A';
        
        // Format date for display
        function formatDate(dateString) {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            } catch (e) {
                return dateString;
            }
        }
        
        // Determine which date to show based on status
        let dateDisplay = '';
        if (status.toLowerCase() === 'active') {
            const activeDate = subscription.properties?.active_date;
            if (activeDate) {
                dateDisplay = `<br>Active Date: <span style="color: #28a745; font-weight: 600;">${formatDate(activeDate)}</span>`;
            }
        } else if (status.toLowerCase() === 'cancelled') {
            const cancellationDate = subscription.properties?.cancellation_date;
            if (cancellationDate) {
                dateDisplay = `<br>Cancelled Date: <span style="color: #dc3545; font-weight: 600;">${formatDate(cancellationDate)}</span>`;
            }
        }
        
        return `
            <div class="deal-item">
                <strong>Subscription: ${subscriptionId}</strong><br>
                Trial ID: ${trialId}<br>
                Status: <span style="color: #667eea; font-weight: 600;">${status}</span>${dateDisplay}
            </div>
        `;
    }).join('');
}

// Handle contact form submission
document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const thermostatQuantity = document.getElementById('thermostat-quantity').value;
    
    const formData = {
        properties: {
            firstname: document.getElementById('firstname').value,
            lastname: document.getElementById('lastname').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value || undefined,
            address: document.getElementById('address').value || undefined
        }
    };
    
    // Include thermostat quantity if provided
    if (thermostatQuantity && parseInt(thermostatQuantity) > 0) {
        formData.thermostatQuantity = parseInt(thermostatQuantity);
    }
    
    // Remove undefined properties
    Object.keys(formData.properties).forEach(key => {
        if (formData.properties[key] === undefined) {
            delete formData.properties[key];
        }
    });
    
    const submitBtn = document.getElementById('contact-submit-btn');
    setLoading('contact-submit-btn', true);
    
    try {
        const response = await fetch(`${API_BASE}/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create contact');
        }
        
        const data = await response.json();
        let successMessage = `✅ Success! Contact "${data.properties.firstname} ${data.properties.lastname}" has been synced to HubSpot.`;
        
        // If a thermostat deal was created, mention it
        if (data.thermostatDeal) {
            successMessage += ` Thermostat purchase deal created (${data.thermostatDeal.quantity} thermostat${data.thermostatDeal.quantity > 1 ? 's' : ''} - $${data.thermostatDeal.amount.toFixed(2)}).`;
        }
        
        showMessage('contact-form-message', successMessage, 'success');
        
        // Reset form
        document.getElementById('contact-form').reset();
        
        // Refresh contacts list and select
        await Promise.all([loadContacts(), loadContactsForSelect()]);
    } catch (error) {
        console.error('Error creating contact:', error);
        showMessage('contact-form-message', `Error: ${error.message}`, 'error');
    } finally {
        setLoading('contact-submit-btn', false);
    }
});

// Handle deal form submission
document.getElementById('deal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const amountValue = document.getElementById('amount').value;
    const dealProperties = {
        dealname: document.getElementById('dealname').value,
        dealstage: document.getElementById('dealstage').value
    };
    
    // Only include amount if provided
    if (amountValue && amountValue.trim() !== '') {
        dealProperties.amount = amountValue;
    }
    
    const formData = {
        dealProperties: dealProperties,
        contactId: document.getElementById('contact-select').value
    };
    
    const submitBtn = document.getElementById('deal-submit-btn');
    setLoading('deal-submit-btn', true);
    
    try {
        const response = await fetch(`${API_BASE}/deals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create trial');
        }
        
        const data = await response.json();
        showMessage('deal-form-message', 
            `✅ Success! Trial "${data.properties.dealname}" has been created and associated with the contact.`, 
            'success');
        
        // Reset form
        document.getElementById('deal-form').reset();
        
        // Refresh pipeline stages and contacts list to show new deal
        await Promise.all([loadPipelineStages(), loadContacts()]);
    } catch (error) {
        console.error('Error creating trial:', error);
        showMessage('deal-form-message', `Error: ${error.message}`, 'error');
    } finally {
        setLoading('deal-submit-btn', false);
    }
});

// Refresh contacts button
document.getElementById('refresh-contacts-btn').addEventListener('click', async () => {
    await Promise.all([loadPipelineStages(), loadContacts(), loadContactsForSelect()]);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Load pipeline stages first, then contacts
    await loadPipelineStages();
    await Promise.all([loadContacts(), loadContactsForSelect()]);
});


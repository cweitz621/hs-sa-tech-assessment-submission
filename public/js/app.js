const API_BASE = 'http://localhost:3001/api';

// Store contacts for searchable dropdown
let allContacts = [];

// Utility functions
function showMessage(containerId, message, type = 'error') {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Store original button text for restoration
const buttonTexts = {};

function setLoading(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (isLoading) {
        // Store original text if not already stored
        if (!buttonTexts[elementId]) {
            buttonTexts[elementId] = element.textContent;
        }
        element.disabled = true;
        element.textContent = 'Loading...';
    } else {
        element.disabled = false;
        // Restore original text
        if (buttonTexts[elementId]) {
            element.textContent = buttonTexts[elementId];
        }
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
// Load contacts for searchable dropdown
async function loadContactsForSelect() {
    try {
        const response = await fetch(`${API_BASE}/contacts`);
        if (!response.ok) throw new Error('Failed to fetch contacts');
        
        const data = await response.json();
        allContacts = data.results || [];
        
        const searchInput = document.getElementById('contact-search');
        const hiddenInput = document.getElementById('contact-select');
        
        if (allContacts.length === 0) {
            searchInput.placeholder = 'No contacts available';
            searchInput.disabled = true;
            return;
        }
        
        searchInput.placeholder = 'Search contacts by name or email...';
        searchInput.disabled = false;
        
        // Set up search functionality
        setupSearchableDropdown();
    } catch (error) {
        console.error('Error loading contacts for select:', error);
        const searchInput = document.getElementById('contact-search');
        searchInput.placeholder = 'Error loading contacts';
        searchInput.disabled = true;
    }
}

// Set up searchable dropdown functionality
function setupSearchableDropdown() {
    const searchInput = document.getElementById('contact-search');
    const hiddenInput = document.getElementById('contact-select');
    const dropdown = document.getElementById('contact-dropdown');
    let selectedIndex = -1;
    
    // Filter and display contacts
    function filterContacts(searchTerm = '') {
        const term = searchTerm.toLowerCase().trim();
        const filtered = term === '' 
            ? allContacts 
            : allContacts.filter(contact => {
                const name = `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim().toLowerCase();
                const email = (contact.properties.email || '').toLowerCase();
                return name.includes(term) || email.includes(term);
            });
        
        dropdown.innerHTML = '';
        selectedIndex = -1;
        
        if (filtered.length === 0) {
            dropdown.innerHTML = '<div class="dropdown-empty">No contacts found</div>';
            dropdown.classList.add('show');
            return;
        }
        
        filtered.forEach((contact, index) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.contactId = contact.id;
            
            const name = `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || 
                        contact.properties.email || 'Unknown';
            const email = contact.properties.email || 'No email';
            
            item.innerHTML = `
                <div class="contact-name">${name}</div>
                <div class="contact-email">${email}</div>
            `;
            
            item.addEventListener('click', () => {
                selectContact(contact, name, email);
            });
            
            item.addEventListener('mouseenter', () => {
                // Remove previous selection
                dropdown.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                selectedIndex = index;
            });
            
            dropdown.appendChild(item);
        });
        
        dropdown.classList.add('show');
    }
    
    // Select a contact
    function selectContact(contact, name, email) {
        hiddenInput.value = contact.id;
        searchInput.value = `${name} (${email})`;
        dropdown.classList.remove('show');
        selectedIndex = -1;
    }
    
    // Search input event
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value;
        if (term === '') {
            hiddenInput.value = '';
        }
        filterContacts(term);
    });
    
    // Focus event
    searchInput.addEventListener('focus', () => {
        if (searchInput.value && !hiddenInput.value) {
            filterContacts(searchInput.value);
        } else if (!searchInput.value) {
            filterContacts('');
        }
    });
    
    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.dropdown-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
            items.forEach((el, idx) => {
                el.classList.toggle('selected', idx === selectedIndex);
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            if (selectedIndex >= 0) {
                items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
            }
            items.forEach((el, idx) => {
                el.classList.toggle('selected', idx === selectedIndex);
            });
        } else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
            e.preventDefault();
            items[selectedIndex].click();
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('show');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
    
    // Clear selection when input is cleared
    searchInput.addEventListener('input', (e) => {
        if (e.target.value === '') {
            hiddenInput.value = '';
        }
    });
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
                            <th>Phone</th>
                            <th>Thermostat Purchases</th>
                            <th>Trials</th>
                            <th>Breezy Subscriptions</th>
                            <th>AI Customer Health</th>
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
                    <td>${contact.properties.phone || '-'}</td>
                    <td>${renderThermostatDeals(thermostatDeals)}</td>
                    <td>${renderDeals(deals)}</td>
                    <td>${renderSubscriptions(subscriptions)}</td>
                    <td>${renderAIInsightButton(contact.id)}</td>
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
        
        // Determine stage color based on stage label
        const stageLabelLower = stageLabel.toLowerCase();
        let stageColor = '#667eea'; // Default purple
        if (stageLabelLower.includes('converted')) {
            stageColor = '#28a745'; // Green
        } else if (stageLabelLower.includes('lost') || stageLabelLower.includes('ended')) {
            stageColor = '#dc3545'; // Red
        } else if (stageLabelLower.includes('active')) {
            stageColor = '#ff9800'; // Orange
        }
        
        return `
            <div class="deal-item">
                <strong>${deal.properties.dealname || 'Unnamed Deal'}</strong><br>
                <span class="amount">${amount}</span><br>
                <span style="color: ${stageColor}; font-weight: 600;">${stageLabel}</span><br>
                <span style="font-size: 0.75em; color: #888;">ID: ${recordId}</span>
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
                Status: <span style="color: #667eea; font-weight: 600;">${status}</span>${dateDisplay}<br>
                <span style="font-size: 0.75em; color: #888;">Trial ID: ${trialId}</span>
            </div>
        `;
    }).join('');
}

// Render AI Insight button for a contact
function renderAIInsightButton(contactId) {
    return `
        <div class="ai-insight-container">
            <button class="btn ai-insight-btn" onclick="generateAIInsight('${contactId}')" id="ai-btn-${contactId}">
                🤖 Get AI Insight
            </button>
        </div>
    `;
}

// Generate AI insight for a contact (make it globally accessible)
window.generateAIInsight = async function(contactId) {
    const button = document.getElementById(`ai-btn-${contactId}`);
    const modal = document.getElementById('ai-insight-modal');
    const modalBody = document.getElementById('ai-insight-modal-body');
    
    // Show modal and disable button
    modal.style.display = 'block';
    button.disabled = true;
    button.textContent = 'Analyzing...';
    modalBody.innerHTML = '<div class="loading">Generating AI insights...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}/ai-insight`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate AI insight');
        }
        
        const data = await response.json();
        
        if (data.success && data.insight) {
            const insight = data.insight;
            
            // Determine risk color
            const riskColor = insight.riskOfChurn?.toLowerCase().includes('high') ? '#dc3545' :
                            insight.riskOfChurn?.toLowerCase().includes('medium') ? '#ffc107' : '#28a745';
            
            // Determine upgrade color
            const upgradeColor = insight.likelihoodToUpgrade?.toLowerCase().includes('high') ? '#28a745' :
                                insight.likelihoodToUpgrade?.toLowerCase().includes('medium') ? '#ffc107' : '#6c757d';
            
            modalBody.innerHTML = `
                <div class="ai-insight-card">
                    <div class="ai-insight-metrics">
                        <div class="ai-metric">
                            <label>Likelihood to Upgrade:</label>
                            <span style="color: ${upgradeColor}; font-weight: 600; font-size: 1.1em;">${insight.likelihoodToUpgrade || 'N/A'}</span>
                        </div>
                        <div class="ai-metric">
                            <label>Risk of Churn:</label>
                            <span style="color: ${riskColor}; font-weight: 600; font-size: 1.1em;">${insight.riskOfChurn || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="ai-insight-action">
                        <strong>💡 Suggested Action:</strong>
                        <p>${insight.suggestedAction || 'No recommendation available'}</p>
                    </div>
                    <div class="ai-insight-justification">
                        <strong>📊 Justification:</strong>
                        <p>${insight.justification || 'No justification provided'}</p>
                    </div>
                </div>
            `;
        } else {
            throw new Error('Invalid response from AI service');
        }
    } catch (error) {
        console.error('Error generating AI insight:', error);
        modalBody.innerHTML = `
            <div class="error">
                <strong>Error generating insight:</strong>
                <p>${error.message}</p>
            </div>
        `;
    } finally {
        // Re-enable button
        button.disabled = false;
        button.textContent = '🤖 Get AI Insight';
    }
}

// Close AI modal (make it globally accessible)
window.closeAIModal = function() {
    const modal = document.getElementById('ai-insight-modal');
    modal.style.display = 'none';
}

// Close modal when clicking outside of it
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('ai-insight-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAIModal();
            }
        });
    }
});

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
            // Use the detailed message if available, otherwise use the error field
            const errorMessage = errorData.message || errorData.error || 'Failed to create contact';
            throw new Error(errorMessage);
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
    const billingFrequency = document.getElementById('billing-frequency').value;
    
    const dealProperties = {
        dealname: document.getElementById('dealname').value,
        dealstage: document.getElementById('dealstage').value
    };
    
    // Include amount (required field)
    if (amountValue && amountValue.trim() !== '') {
        dealProperties.amount = amountValue;
    }
    
    const formData = {
        dealProperties: dealProperties,
        contactId: document.getElementById('contact-select').value,
        billingFrequency: billingFrequency,
        lineItemPrice: amountValue // Price for the line item
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
        // Clear searchable dropdown
        document.getElementById('contact-search').value = '';
        document.getElementById('contact-select').value = '';
        document.getElementById('contact-dropdown').classList.remove('show');
        
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


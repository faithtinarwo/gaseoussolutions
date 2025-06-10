// Global variables
let selectedProduct = null;
let selectedPayment = null;
let orderData = {};

// Local storage simulation (in-memory storage)
const storage = {
    orders: [],
    customers: []
};

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = ['products', 'order', 'payment', 'invoice'];
    const currentIndex = sections.indexOf(sectionId);
    if (currentIndex !== -1) {
        navButtons[currentIndex].classList.add('active');
    }
}

// Gas selection
function selectGas(element) {
    document.querySelectorAll('.gas-option').forEach(option => {
        option.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedProduct = {
        name: element.dataset.product,
        price: element.dataset.price
    };
    calculateTotal();
}

// Payment selection
function selectPayment(element) {
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedPayment = element.dataset.payment;
}

// Toggle address field
function toggleAddressField() {
    const deliveryType = document.getElementById('delivery').value;
    const addressSection = document.getElementById('addressSection');
    if (deliveryType === 'collection') {
        addressSection.style.display = 'none';
    } else {
        addressSection.style.display = 'block';
    }
}

// Calculate total
function calculateTotal() {
    if (!selectedProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    let price = 0;
    
    if (selectedProduct.price !== 'custom') {
        price = parseInt(selectedProduct.price) * quantity;
    }
    
    document.getElementById('totalAmount').textContent = 
        selectedProduct.price === 'custom' ? 'Total: Contact for Quote' : `Total: R${price.toLocaleString()}`;
}

// Process order
function processOrder() {
    if (!selectedProduct || !selectedPayment) {
        alert('Please select a product and payment method.');
        return;
    }

    const customerName = document.getElementById('customerName').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const quantity = document.getElementById('quantity').value;
    const deliveryType = document.getElementById('delivery').value;
    const address = document.getElementById('address').value;

    if (!customerName || !phone) {
        alert('Please fill in all required fields.');
        return;
    }

    if (deliveryType === 'delivery' && !address) {
        alert('Please provide a delivery address.');
        return;
    }

    // Generate order
    orderData = {
        id: 'GS' + Date.now(),
        date: new Date().toLocaleDateString(),
        customer: {
            name: customerName,
            phone: phone,
            email: email,
            address: deliveryType === 'delivery' ? address : 'Depot Collection'
        },
        product: selectedProduct.name,
        quantity: quantity,
        price: selectedProduct.price === 'custom' ? 'Quote' : selectedProduct.price,
        total: selectedProduct.price === 'custom' ? 'Contact for Quote' : 
               (parseInt(selectedProduct.price) * parseInt(quantity)).toLocaleString(),
        paymentMethod: selectedPayment,
        deliveryType: deliveryType
    };

    // Store order
    storage.orders.push(orderData);

    // Generate invoice
    generateInvoice();
    showSection('invoice');
}

// Generate invoice
function generateInvoice() {
    const invoiceContent = document.getElementById('invoiceContent');
    invoiceContent.innerHTML = `
        <div class="invoice-header">
            <div>
                <h3 style="color: #dc2626;">GASEOUS SOLUTIONS</h3>
                <p>Corner Station & Doris Road<br>Endicott Springs</p>
                <p>Tel: 074 515 0903</p>
            </div>
            <div style="text-align: right;">
                <h4>INVOICE</h4>
                <p><strong>Order #:</strong> ${orderData.id}</p>
                <p><strong>Date:</strong> ${orderData.date}</p>
            </div>
        </div>
        
        <div class="invoice-details">
            <div>
                <h4 style="color: #dc2626;">Bill To:</h4>
                <p><strong>${orderData.customer.name}</strong></p>
                <p>${orderData.customer.phone}</p>
                <p>${orderData.customer.email}</p>
                <p>${orderData.customer.address}</p>
            </div>
            <div>
                <h4 style="color: #dc2626;">Order Details:</h4>
                <p><strong>Product:</strong> ${orderData.product} LP Gas</p>
                <p><strong>Quantity:</strong> ${orderData.quantity}</p>
                <p><strong>Service:</strong> ${orderData.deliveryType === 'delivery' ? 'Home Delivery' : 'Depot Collection'}</p>
                <p><strong>Payment:</strong> ${selectedPayment === 'online' ? 'Online Payment' : 
                                             selectedPayment === 'cod' ? 'Cash on Delivery' : 'Cash on Collection'}</p>
            </div>
        </div>
        
        <div style="border-top: 2px solid #f97316; padding-top: 20px; text-align: right;">
            <h3 style="color: #dc2626;">Total: R${orderData.total}</h3>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
            <h4 style="color: #dc2626;">Terms & Conditions:</h4>
            <ul style="margin-left: 20px;">
                <li>Delivery within 24 hours for in-stock items</li>
                <li>Cash on delivery orders require exact amount</li>
                <li>All gas cylinders remain property of Gaseous Solutions</li>
                <li>Empty cylinders must be returned for refill service</li>
                <li>Delivery charges may apply to remote areas</li>
                <li>For bulk orders, custom pricing and delivery schedules apply</li>
            </ul>
        </div>
        
        <div style="margin-top: 20px; padding: 20px; background: #e0f2fe; border-radius: 10px; text-align: center;">
            <h4 style="color: #0277bd;">Thank you for choosing Gaseous Solutions!</h4>
            <p>For any inquiries, please contact us at 074 515 0903</p>
            <p style="margin-top: 10px; font-weight: bold;">Your order will be processed within 2 hours</p>
        </div>
    `;
}

// Start new order
function startNewOrder() {
    // Reset all selections
    selectedProduct = null;
    selectedPayment = null;
    orderData = {};
    
    // Reset form fields
    document.getElementById('customerName').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('delivery').value = 'delivery';
    document.getElementById('address').value = '';
    
    // Clear selections
    document.querySelectorAll('.gas-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Reset total display
    document.getElementById('totalAmount').textContent = 'Select a product to see total';
    
    // Show address section
    document.getElementById('addressSection').style.display = 'block';
    
    // Go back to products section
    showSection('products');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    toggleAddressField();
});

// Additional utility functions

// Get all orders from storage
function getAllOrders() {
    return storage.orders;
}

// Get order by ID
function getOrderById(orderId) {
    return storage.orders.find(order => order.id === orderId);
}

// Add customer to storage
function addCustomer(customerData) {
    storage.customers.push(customerData);
}

// Get customer by phone
function getCustomerByPhone(phone) {
    return storage.customers.find(customer => customer.phone === phone);
}

// Format currency
function formatCurrency(amount) {
    return `R${parseInt(amount).toLocaleString()}`;
}

// Validate phone number (South African format)
function validatePhoneNumber(phone) {
    const phoneRegex = /^(\+27|0)[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Validate email
function validateEmail(email) {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Enhanced form validation
function validateOrderForm() {
    const customerName = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const deliveryType = document.getElementById('delivery').value;
    const address = document.getElementById('address').value.trim();

    const errors = [];

    if (!customerName) {
        errors.push('Customer name is required');
    }

    if (!phone) {
        errors.push('Phone number is required');
    } else if (!validatePhoneNumber(phone)) {
        errors.push('Please enter a valid South African phone number');
    }

    if (email && !validateEmail(email)) {
        errors.push('Please enter a valid email address');
    }

    if (deliveryType === 'delivery' && !address) {
        errors.push('Delivery address is required for home delivery');
    }

    return errors;
}

// Enhanced process order with better validation
function processOrderEnhanced() {
    if (!selectedProduct || !selectedPayment) {
        alert('Please select a product and payment method.');
        return;
    }

    const validationErrors = validateOrderForm();
    if (validationErrors.length > 0) {
        alert('Please fix the following errors:\n' + validationErrors.join('\n'));
        return;
    }

    // Process order with the existing logic
    processOrder();
}

// Export order data as JSON
function exportOrderData() {
    const dataStr = JSON.stringify({
        orders: storage.orders,
        customers: storage.customers,
        exportDate: new Date().toISOString()
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gaseous_solutions_orders_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Print invoice
function printInvoice() {
    window.print();
}

// Send invoice via email (placeholder function)
function sendInvoiceEmail() {
    if (!orderData.customer.email) {
        alert('No email address provided for this order.');
        return;
    }
    
    // This would typically integrate with an email service
    alert(`Invoice would be sent to: ${orderData.customer.email}\n(Email integration required)`);
}

// Calculate delivery fee based on area (placeholder)
function calculateDeliveryFee(address) {
    // Simple logic - in reality this would integrate with mapping service
    const remoteAreas = ['Cullinan', 'Bronkhorstspruit', 'Rayton'];
    const isRemote = remoteAreas.some(area => 
        address.toLowerCase().includes(area.toLowerCase())
    );
    
    return isRemote ? 50 : 0; // R50 for remote areas
}

// Search orders
function searchOrders(searchTerm) {
    const term = searchTerm.toLowerCase();
    return storage.orders.filter(order => 
        order.id.toLowerCase().includes(term) ||
        order.customer.name.toLowerCase().includes(term) ||
        order.customer.phone.includes(term) ||
        order.product.toLowerCase().includes(term)
    );
}
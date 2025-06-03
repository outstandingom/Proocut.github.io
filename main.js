// Firebase configuration and initialization
const firebaseConfig = {
    apiKey: "AIzaSyCsJR-aYy0VGSPvb7pXHaK3EmGsJWcvdDo",
    authDomain: "login-fa2eb.firebaseapp.com",
    projectId: "login-fa2eb",
    storageBucket: "login-fa2eb.appspot.com",
    messagingSenderId: "1093052500996",
    appId: "1:1093052500996:web:05a13485172c455e93b951",
    measurementId: "G-9TC2J0YQ3R"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ️ moCK DATA HERE (development only)
if (window.location.hostname === "localhost") {
  const mockSalon = {
    name: "Test Salon",
    ownerId: "test",
    location: "Test Location",
    openTime: "09:00",
    closeTime: "19:00"
  };
    

// Global variables
let currentUser = null;
let selectedSalon = null;
let selectedService = null;
let selectedDateTime = null;

// DOM Ready Handler
document.addEventListener('DOMContentLoaded', function() {
    // Initialize based on current page
    const path = window.location.pathname.split('/').pop();
    
    if (path === 'register.html') {
        initRegistration();
    } else if (path === 'signin.html') {
        initLogin();
    } else if (path === 'index.html') {
        initHomePage();
    } else if (path === 'userbookings.html') {
        initUserBookings();
    } else if (path === 'userprofile.html') {
        initUserProfile();
    } else if (path === 'merchantdashboard.html') {
        initMerchantDashboard();
    } else if (path === 'bookservice.html') {
        initBookService();
    }
    
    // Check auth state for all pages
    checkAuthState();
});

// Initialize Home Page
function initHomePage() {
    // Load salons and services
    loadSalons();
    loadServices();
    
    // Initialize location selector
    initLocationSelector();
    
    // Search functionality
    document.querySelector('.search-button').addEventListener('click', handleSearch);
    
    // Category filtering
    document.querySelectorAll('.category').forEach(category => {
        category.addEventListener('click', function() {
            document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            filterServicesByCategory(this.textContent);
        });
    });
    
    // Book Now buttons
    document.querySelectorAll('.service-card .btn-primary').forEach(button => {
        button.addEventListener('click', function() {
            const serviceId = this.closest('.service-card').getAttribute('data-service-id');
            startBookingProcess(serviceId);
        });
    });
}

// Initialize Booking Page
function initBookService() {
    // Load service details if ID is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('serviceId');
    
    if (serviceId) {
        loadServiceDetails(serviceId);
    }
    
    // Initialize date/time picker
    initDateTimePicker();
    
    // Handle booking form submission
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmission);
}

// Initialize User Bookings Page
function initUserBookings() {
    // Load user bookings
    loadUserBookings();
    
    // Tab switching
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterBookings(this.textContent.trim());
        });
    });
}

// Initialize Merchant Dashboard
function initMerchantDashboard() {
    // Load merchant bookings
    loadMerchantBookings();
    
    // Tab switching
    document.querySelectorAll('.merchant-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.merchant-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterMerchantBookings(this.textContent.trim());
        });
    });
    
    // Handle status updates
    document.querySelectorAll('.update-status').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            const newStatus = this.getAttribute('data-status');
            updateBookingStatus(bookingId, newStatus);
        });
    });
}

// Load Salons from Firestore
async function loadSalons() {
    try {
        const querySnapshot = await db.collection('salons').get();
        const salonsContainer = document.getElementById('salonsContainer');
        
        if (querySnapshot.empty) {
            salonsContainer.innerHTML = '<p>No salons found in your area.</p>';
            return;
        }
        
        querySnapshot.forEach(doc => {
            const salon = doc.data();
            const salonCard = createSalonCard(salon, doc.id);
            salonsContainer.appendChild(salonCard);
        });
    } catch (error) {
        console.error('Error loading salons:', error);
        showAlert('error', 'Failed to load salons. Please try again.');
    }
}

// Load Services from Firestore
async function loadServices() {
    try {
        const querySnapshot = await db.collection('services').get();
        const servicesContainer = document.getElementById('servicesContainer');
        
        if (querySnapshot.empty) {
            servicesContainer.innerHTML = '<p>No services available at this time.</p>';
            return;
        }
        
        querySnapshot.forEach(doc => {
            const service = doc.data();
            const serviceCard = createServiceCard(service, doc.id);
            servicesContainer.appendChild(serviceCard);
        });
    } catch (error) {
        console.error('Error loading services:', error);
        showAlert('error', 'Failed to load services. Please try again.');
    }
}

// Filter Services by Category
function filterServicesByCategory(category) {
    const services = document.querySelectorAll('.service-card');
    
    services.forEach(service => {
        const serviceCategory = service.getAttribute('data-category');
        
        if (category === 'All Services' || serviceCategory === category) {
            service.style.display = 'block';
        } else {
            service.style.display = 'none';
        }
    });
}

// Start Booking Process
function startBookingProcess(serviceId) {
    if (!currentUser) {
        window.location.href = 'signin.html?redirect=bookservice.html?serviceId=' + serviceId;
        return;
    }
    
    window.location.href = 'bookservice.html?serviceId=' + serviceId;
}

// Handle Booking Submission
async function handleBookingSubmission(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showAlert('error', 'Please login to book a service.');
        return;
    }
    
    const formData = {
        userId: currentUser.uid,
        serviceId: selectedService.id,
        salonId: selectedService.salonId,
        dateTime: selectedDateTime,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        price: selectedService.price,
        duration: selectedService.duration,
        notes: document.getElementById('bookingNotes').value.trim()
    };
    
    try {
        // Save booking to Firestore
        const docRef = await db.collection('bookings').add(formData);
        
        // Update user's bookings array
        await db.collection('users').doc(currentUser.uid).update({
            bookings: firebase.firestore.FieldValue.arrayUnion(docRef.id)
        });
        
        showAlert('success', 'Booking successful! Redirecting to your bookings...');
        setTimeout(() => {
            window.location.href = 'userbookings.html';
        }, 2000);
    } catch (error) {
        console.error('Error creating booking:', error);
        showAlert('error', 'Failed to create booking. Please try again.');
    }
}

// Load User Bookings
async function loadUserBookings() {
    if (!currentUser) return;
    
    try {
        const bookingsContainer = document.getElementById('bookingsContainer');
        bookingsContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        const querySnapshot = await db.collection('bookings')
            .where('userId', '==', currentUser.uid)
            .orderBy('dateTime', 'desc')
            .get();
        
        if (querySnapshot.empty) {
            bookingsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="far fa-calendar-check"></i>
                    <h4>No Bookings Found</h4>
                    <p class="text-muted">You haven't made any bookings yet.</p>
                    <a href="index.html" class="btn btn-primary">Book a Service</a>
                </div>
            `;
            return;
        }
        
        bookingsContainer.innerHTML = '';
        
        querySnapshot.forEach(doc => {
            const booking = doc.data();
            const bookingCard = createBookingCard(booking, doc.id);
            bookingsContainer.appendChild(bookingCard);
        });
    } catch (error) {
        console.error('Error loading bookings:', error);
        showAlert('error', 'Failed to load bookings. Please try again.');
    }
}

// Load Merchant Bookings
async function loadMerchantBookings() {
    if (!currentUser) return;
    
    try {
        // First get merchant's salon
        const salonQuery = await db.collection('salons')
            .where('ownerId', '==', currentUser.uid)
            .limit(1)
            .get();
        
        if (salonQuery.empty) {
            showAlert('error', 'You are not registered as a merchant.');
            return;
        }
        
        const salonId = salonQuery.docs[0].id;
        const bookingsContainer = document.getElementById('merchantBookingsContainer');
        bookingsContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        const querySnapshot = await db.collection('bookings')
            .where('salonId', '==', salonId)
            .orderBy('dateTime', 'desc')
            .get();
        
        if (querySnapshot.empty) {
            bookingsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="far fa-calendar-check"></i>
                    <h4>No Bookings Yet</h4>
                    <p class="text-muted">You haven't received any bookings yet.</p>
                </div>
            `;
            return;
        }
        
        bookingsContainer.innerHTML = '';
        
        querySnapshot.forEach(doc => {
            const booking = doc.data();
            const bookingCard = createMerchantBookingCard(booking, doc.id);
            bookingsContainer.appendChild(bookingCard);
        });
    } catch (error) {
        console.error('Error loading merchant bookings:', error);
        showAlert('error', 'Failed to load bookings. Please try again.');
    }
}

// Update Booking Status (for merchants)
async function updateBookingStatus(bookingId, newStatus) {
    try {
        await db.collection('bookings').doc(bookingId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showAlert('success', 'Booking status updated successfully!');
        loadMerchantBookings();
    } catch (error) {
        console.error('Error updating booking status:', error);
        showAlert('error', 'Failed to update booking status. Please try again.');
    }
}

// Helper Functions
function createSalonCard(salon, id) {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 mb-4';
    card.innerHTML = `
        <div class="card h-100">
            <img src="${salon.imageUrl || 'https://via.placeholder.com/300x200'}" class="card-img-top" alt="${salon.name}">
            <div class="card-body">
                <h5 class="card-title">${salon.name}</h5>
                <p class="card-text text-muted">
                    <i class="fas fa-map-marker-alt"></i> ${salon.address}
                </p>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="text-warning">
                        <i class="fas fa-star"></i> ${salon.rating || '4.5'} (${salon.reviewCount || '100+'})
                    </div>
                    <a href="#" class="btn btn-sm btn-outline-primary view-salon" data-salon-id="${id}">View</a>
                </div>
            </div>
        </div>
    `;
    
    card.querySelector('.view-salon').addEventListener('click', function(e) {
        e.preventDefault();
        viewSalonDetails(id);
    });
    
    return card;
}

function createServiceCard(service, id) {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 mb-4';
    card.setAttribute('data-service-id', id);
    card.setAttribute('data-category', service.category);
    card.innerHTML = `
        <div class="card h-100">
            <div class="service-img">
                <img src="${service.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${service.name}">
                <div class="category-tag">${service.category}</div>
            </div>
            <div class="card-body">
                <h5 class="card-title">${service.name}</h5>
                <p class="card-text text-muted small">${service.description}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-clock"></i> ${service.duration} mins
                    </div>
                    <div class="h5">₹${service.price}</div>
                </div>
                <button class="btn btn-primary w-100 mt-3 book-now">Book Now</button>
            </div>
        </div>
    `;
    
    card.querySelector('.book-now').addEventListener('click', function() {
        startBookingProcess(id);
    });
    
    return card;
}

function createBookingCard(booking, id) {
    const statusClass = getStatusClass(booking.status);
    const date = booking.dateTime.toDate();
    const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const card = document.createElement('div');
    card.className = 'booking-card mb-4';
    card.innerHTML = `
        <div class="booking-card-header d-flex justify-content-between align-items-center">
            <div>
                <span class="booking-status ${statusClass}">${booking.status}</span>
                <span class="text-muted ms-2">Booking ID: ${id.substring(0, 8)}</span>
            </div>
            <div class="text-muted">${formattedDate}</div>
        </div>
        <div class="booking-card-body">
            <div class="row">
                <div class="col-md-4 mb-3 mb-md-0">
                    <img src="${booking.serviceImage || 'https://via.placeholder.com/300x200'}" class="booking-image" alt="Service">
                </div>
                <div class="col-md-5">
                    <h5>${booking.serviceName}</h5>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Salon</div>
                        <div class="booking-detail-value">${booking.salonName}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Professional</div>
                        <div class="booking-detail-value">${booking.stylist || 'Not assigned'}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Notes</div>
                        <div class="booking-detail-value">${booking.notes || 'None'}</div>
                    </div>
                </div>
                <div class="col-md-3 d-flex flex-column justify-content-between">
                    <div class="text-end mb-3">
                        <div class="booking-detail-label">Total Amount</div>
                        <div class="h4">₹${booking.price}</div>
                    </div>
                    <div class="d-flex flex-column gap-2">
                        <button class="btn btn-dark">View Details</button>
                        ${booking.status === 'pending' ? 
                            `<button class="btn btn-outline-dark cancel-booking" data-booking-id="${id}">Cancel Booking</button>` : 
                            `<button class="btn btn-outline-dark">Book Again</button>`
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (booking.status === 'pending') {
        card.querySelector('.cancel-booking').addEventListener('click', function() {
            cancelBooking(id);
        });
    }
    
    return card;
}

function createMerchantBookingCard(booking, id) {
    const statusClass = getStatusClass(booking.status);
    const date = booking.dateTime.toDate();
    const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const card = document.createElement('div');
    card.className = 'booking-card mb-4';
    card.innerHTML = `
        <div class="booking-card-header d-flex justify-content-between align-items-center">
            <div>
                <span class="booking-status ${statusClass}">${booking.status}</span>
                <span class="text-muted ms-2">Booking ID: ${id.substring(0, 8)}</span>
            </div>
            <div class="text-muted">${formattedDate}</div>
        </div>
        <div class="booking-card-body">
            <div class="row">
                <div class="col-md-4 mb-3 mb-md-0">
                    <img src="${booking.serviceImage || 'https://via.placeholder.com/300x200'}" class="booking-image" alt="Service">
                </div>
                <div class="col-md-5">
                    <h5>${booking.serviceName}</h5>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Customer</div>
                        <div class="booking-detail-value">${booking.userName}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Contact</div>
                        <div class="booking-detail-value">${booking.userPhone || 'Not provided'}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Notes</div>
                        <div class="booking-detail-value">${booking.notes || 'None'}</div>
                    </div>
                </div>
                <div class="col-md-3 d-flex flex-column justify-content-between">
                    <div class="text-end mb-3">
                        <div class="booking-detail-label">Total Amount</div>
                        <div class="h4">₹${booking.price}</div>
                    </div>
                    <div class="d-flex flex-column gap-2">
                        ${booking.status === 'pending' ? `
                            <button class="btn btn-success update-status" data-booking-id="${id}" data-status="confirmed">Confirm</button>
                            <button class="btn btn-danger update-status" data-booking-id="${id}" data-status="cancelled">Cancel</button>
                        ` : ''}
                        ${booking.status === 'confirmed' ? `
                            <button class="btn btn-primary update-status" data-booking-id="${id}" data-status="completed">Mark Complete</button>
                        ` : ''}
                        <button class="btn btn-dark">View Details</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    card.querySelectorAll('.update-status').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            const newStatus = this.getAttribute('data-status');
            updateBookingStatus(bookingId, newStatus);
        });
    });
    
    return card;
}

function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'confirmed':
            return 'status-confirmed';
        case 'pending':
            return 'status-pending';
        case 'cancelled':
            return 'status-cancelled';
        case 'completed':
            return 'status-completed';
        default:
            return '';
    }
}

async function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        try {
            await db.collection('bookings').doc(bookingId).update({
                status: 'cancelled',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showAlert('success', 'Booking cancelled successfully!');
            loadUserBookings();
        } catch (error) {
            console.error('Error cancelling booking:', error);
            showAlert('error', 'Failed to cancel booking. Please try again.');
        }
    }
}

function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            alertDiv.remove();
        }, 150);
    }, 3000);
    }

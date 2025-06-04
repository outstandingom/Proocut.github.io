//register
// Initialize Firebase
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

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const registerForm = document.getElementById('registerForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('registerEmail');
const passwordInput = document.getElementById('registerPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsCheckbox = document.getElementById('termsAgree');
const registerButton = document.getElementById('registerButton');
const successMessage = document.getElementById('successMessage');

// Password toggle functionality
const passwordToggles = document.querySelectorAll('.password-toggle');
passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
});

// Password strength indicator
passwordInput.addEventListener('input', function() {
    const password = this.value;
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');
    
    // Reset
    strengthBar.style.width = '0%';
    strengthBar.style.backgroundColor = 'transparent';
    strengthText.textContent = '';
    strengthText.className = 'password-strength-text';
    
    if (password.length === 0) return;
    
    // Calculate strength
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 15; // Uppercase
    if (/[0-9]/.test(password)) strength += 15; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 15; // Special chars
    
    // Common pattern checks
    if (!/(.)\1{2,}/.test(password)) strength += 15; // No repeated chars
    
    // Cap at 100
    strength = Math.min(strength, 100);
    
    // Update UI
    strengthBar.style.width = strength + '%';
    
    if (strength < 40) {
        strengthBar.style.backgroundColor = '#d32f2f'; // Red
        strengthText.textContent = 'Weak';
        strengthText.classList.add('strength-weak');
    } else if (strength < 70) {
        strengthBar.style.backgroundColor = '#ff9800'; // Orange
        strengthText.textContent = 'Medium';
        strengthText.classList.add('strength-medium');
    } else {
        strengthBar.style.backgroundColor = '#4caf50'; // Green
        strengthText.textContent = 'Strong';
        strengthText.classList.add('strength-strong');
    }
});

// Form validation
function validateForm() {
    let isValid = true;
    
    // Reset error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
    });
    
    // Name validation
    if (fullNameInput.value.trim() === '') {
        document.getElementById('nameError').textContent = 'Full name is required';
        document.getElementById('nameError').style.display = 'block';
        isValid = false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
        document.getElementById('emailError').textContent = 'Please enter a valid email address';
        document.getElementById('emailError').style.display = 'block';
        isValid = false;
    }
    
    // Password validation
    const password = passwordInput.value;
    if (password.length < 8) {
        document.getElementById('passwordError').textContent = 'Password must be at least 8 characters';
        document.getElementById('passwordError').style.display = 'block';
        isValid = false;
    } else if (!/[A-Z]/.test(password)) {
        document.getElementById('passwordError').textContent = 'Password must contain at least one uppercase letter';
        document.getElementById('passwordError').style.display = 'block';
        isValid = false;
    } else if (!/[0-9]/.test(password)) {
        document.getElementById('passwordError').textContent = 'Password must contain at least one number';
        document.getElementById('passwordError').style.display = 'block';
        isValid = false;
    } else if (!/[^A-Za-z0-9]/.test(password)) {
        document.getElementById('passwordError').textContent = 'Password must contain at least one special character';
        document.getElementById('passwordError').style.display = 'block';
        isValid = false;
    }
    
    // Confirm password validation
    if (passwordInput.value !== confirmPasswordInput.value) {
        document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
        document.getElementById('confirmPasswordError').style.display = 'block';
        isValid = false;
    }
    
    // Terms agreement validation
    if (!termsCheckbox.checked) {
        document.getElementById('termsError').textContent = 'You must agree to the terms and conditions';
        document.getElementById('termsError').style.display = 'block';
        isValid = false;
    }
    
    return isValid;
}

// Register user with email and password
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Disable button to prevent multiple submissions
    registerButton.disabled = true;
    registerButton.textContent = 'Creating account...';
    
    try {
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Save additional user data to Firestore
        await db.collection('users').doc(user.uid).set({
            fullName: fullName,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'customer' // Default role
        });
        
        // Send email verification
        await user.sendEmailVerification();
        
        // Show success message
        successMessage.textContent = `Account created successfully! Verification email sent to ${email}`;
        successMessage.style.display = 'block';
        
        // Reset form
        registerForm.reset();
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle different error cases
        let errorMessage = 'An error occurred during registration. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered. Please use a different email or login.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        }
        
        document.getElementById('emailError').textContent = errorMessage;
        document.getElementById('emailError').style.display = 'block';
        
    } finally {
        // Re-enable button
        registerButton.disabled = false;
        registerButton.textContent = 'Create Account';
    }
});

// Google Sign-In
document.getElementById('googleSignIn').addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Check if user is new or existing
        if (result.additionalUserInfo.isNewUser) {
            // Save user data to Firestore for new users
            await db.collection('users').doc(user.uid).set({
                fullName: user.displayName || 'Google User',
                email: user.email,
                photoURL: user.photoURL || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'customer'
            });
        } else {
            // Update last login for existing users
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Redirect to dashboard or appropriate page
        window.location.href = 'userprofile.html';
        
    } catch (error) {
        console.error('Google sign-in error:', error);
        alert('Google sign-in failed. Please try again.');
    }
});

// Facebook Sign-In
document.getElementById('facebookSignIn').addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.FacebookAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Check if user is new or existing
        if (result.additionalUserInfo.isNewUser) {
            // Save user data to Firestore for new users
            await db.collection('users').doc(user.uid).set({
                fullName: user.displayName || 'Facebook User',
                email: user.email,
                photoURL: user.photoURL || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'customer'
            });
        } else {
            // Update last login for existing users
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Redirect to dashboard or appropriate page
        window.location.href = 'userprofile.html';
        
    } catch (error) {
        console.error('Facebook sign-in error:', error);
        alert('Facebook sign-in failed. Please try again.');
    }
});

// Auth state observer (optional)
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('User is logged in:', user.email);
        // You might want to redirect if user is already logged in
        // window.location.href = 'userprofile.html';
    } else {
        console.log('User is logged out');
    }
});
  //register finish
//login logic
// Login functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Login Form Elements
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginPasswordToggle = document.getElementById('loginPasswordToggle');
    const rememberMe = document.getElementById('rememberMe');
    
    // Check if elements exist (for login page)
    if (loginPasswordToggle) {
        // Password toggle functionality for login page
        loginPasswordToggle.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (loginPassword.type === 'password') {
                loginPassword.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                loginPassword.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }
    
    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = loginEmail.value.trim();
            const password = loginPassword.value;
            const remember = rememberMe.checked;
            
            // Set persistence based on "Remember me" checkbox
            const persistence = remember ? 
                firebase.auth.Auth.Persistence.LOCAL : 
                firebase.auth.Auth.Persistence.SESSION;
            
            try {
                // Set persistence before signing in
                await auth.setPersistence(persistence);
                
                // Sign in with email and password
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Check if email is verified
                if (!user.emailVerified) {
                    await auth.signOut();
                    showLoginError('Please verify your email before logging in. Check your inbox for the verification link.');
                    return;
                }
                
                // Update last login timestamp in Firestore
                await db.collection('users').doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Redirect based on user role (you'll need to implement this logic)
                redirectAfterLogin(user.uid);
                
            } catch (error) {
                console.error('Login error:', error);
                handleLoginError(error);
            }
        });
    }
    
    // Handle social login buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    if (socialButtons.length > 0) {
        // Google login
        socialButtons[0].addEventListener('click', async function() {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await auth.signInWithPopup(provider);
                const user = result.user;
                
                // Check if user is new or existing
                if (result.additionalUserInfo.isNewUser) {
                    await db.collection('users').doc(user.uid).set({
                        fullName: user.displayName || 'Google User',
                        email: user.email,
                        photoURL: user.photoURL || '',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                        role: 'customer'
                    });
                } else {
                    await db.collection('users').doc(user.uid).update({
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
                redirectAfterLogin(user.uid);
                
            } catch (error) {
                console.error('Google login error:', error);
                showLoginError('Google login failed. Please try again.');
            }
        });
        
        // Facebook login
        socialButtons[1].addEventListener('click', async function() {
            try {
                const provider = new firebase.auth.FacebookAuthProvider();
                const result = await auth.signInWithPopup(provider);
                const user = result.user;
                
                // Check if user is new or existing
                if (result.additionalUserInfo.isNewUser) {
                    await db.collection('users').doc(user.uid).set({
                        fullName: user.displayName || 'Facebook User',
                        email: user.email,
                        photoURL: user.photoURL || '',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                        role: 'customer'
                    });
                } else {
                    await db.collection('users').doc(user.uid).update({
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
                redirectAfterLogin(user.uid);
                
            } catch (error) {
                console.error('Facebook login error:', error);
                showLoginError('Facebook login failed. Please try again.');
            }
        });
    }
    
    // Forgot password link
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'forgotpassword.html';
        });
    }
    
    // Helper function to show login errors
    function showLoginError(message) {
        // You can implement a more sophisticated error display
        alert(message);
    }
    
    // Helper function to handle different login errors
    function handleLoginError(error) {
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled. Please contact support.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email. Please register first.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
                break;
            default:
                errorMessage = error.message || 'Login failed. Please try again.';
        }
        
        showLoginError(errorMessage);
    }
    
    // Helper function to redirect after successful login
    async function redirectAfterLogin(userId) {
        try {
            // Get user role from Firestore
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();
            const role = userData?.role || 'customer';
            
            // Redirect based on role
            if (role === 'merchant') {
                window.location.href = 'merchantdashboard.html';
            } else {
                window.location.href = 'userprofile.html';
            }
        } catch (error) {
            console.error('Error getting user role:', error);
            // Default redirect if there's an error
            window.location.href = 'userprofile.html';
        }
    }
    
    // Check if user is already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is logged in, redirect based on role
            redirectAfterLogin(user.uid);
        }
    });
});
// login finish

//user profile // User Profile Management
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication state
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            // If no user is logged in, redirect to login page
            window.location.href = 'login.html';
        }
    });

    // Tab switching functionality
    const setupProfileTabs = () => {
        const profileTab = document.getElementById('profileTab');
        const settingsTab = document.getElementById('settingsTab');
        const tabItems = document.querySelectorAll('.profile-nav-item');

        tabItems.forEach(tab => {
            tab.addEventListener('click', function() {
                // Update active tab styling
                tabItems.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Show the corresponding tab content
                if (this.textContent.trim() === 'Profile') {
                    profileTab.style.display = 'block';
                    settingsTab.style.display = 'none';
                } else if (this.textContent.trim() === 'Settings') {
                    profileTab.style.display = 'none';
                    settingsTab.style.display = 'block';
                }
            });
        });
    };

    // Logout functionality
    const setupLogout = () => {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                firebase.auth().signOut().then(() => {
                    window.location.href = 'login.html';
                }).catch((error) => {
                    console.error('Logout error:', error);
                    alert('Error during logout. Please try again.');
                });
            });
        }
    };

    // Password reset functionality
    const setupPasswordReset = () => {
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                const user = firebase.auth().currentUser;
                if (user && user.email) {
                    firebase.auth().sendPasswordResetEmail(user.email)
                        .then(() => {
                            alert('Password reset email sent. Please check your inbox.');
                        })
                        .catch((error) => {
                            console.error('Password reset error:', error);
                            alert('Error sending password reset email. Please try again.');
                        });
                } else {
                    alert('No authenticated user found. Please login again.');
                }
            });
        }
    };

    // Load user profile data
    const loadUserProfile = () => {
        const user = firebase.auth().currentUser;
        if (user) {
            const db = firebase.firestore();
            
            // Get user data from Firestore
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        
                        // Update profile info in the header
                        document.getElementById('profileName').textContent = userData.fullName || 'User';
                        document.getElementById('profileEmail').textContent = user.email || '';
                        
                        // Update profile details
                        document.getElementById('profileFullName').textContent = userData.fullName || 'Not provided';
                        document.getElementById('profileEmailDetail').textContent = user.email || 'Not provided';
                        
                        // Format and display join date
                        if (user.metadata && user.metadata.creationTime) {
                            const joinDate = new Date(user.metadata.creationTime);
                            document.getElementById('profileJoinDate').textContent = joinDate.toLocaleDateString();
                        }
                        
                        // Set profile image if available
                        if (userData.photoURL) {
                            document.getElementById('profileImage').src = userData.photoURL;
                        }
                    } else {
                        console.log("No user document found in Firestore");
                        // Fallback to auth data if Firestore doc doesn't exist
                        document.getElementById('profileName').textContent = user.displayName || 'User';
                        document.getElementById('profileEmail').textContent = user.email || '';
                        document.getElementById('profileFullName').textContent = user.displayName || 'Not provided';
                        document.getElementById('profileEmailDetail').textContent = user.email || 'Not provided';
                    }
                })
                .catch((error) => {
                    console.error("Error getting user document:", error);
                    alert('Error loading profile data. Please refresh the page.');
                });
        }
    };

    // Initialize all functionality
    const initProfilePage = () => {
        setupProfileTabs();
        setupLogout();
        setupPasswordReset();
        loadUserProfile();
    };

    // Wait for auth state to be confirmed before initializing
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            initProfilePage();
        } else {
            window.location.href = 'login.html';
        }
    });
});

// Navigation helper function
function navigateTo(page) {
    window.location.href = page;
}  
//user proifile end

// index.html start
// Initialize Firebase
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
const storage = firebase.storage();

// Main Application Logic
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication state
    auth.onAuthStateChanged(user => {
        if (!user && !['login.html', 'register.html', 'forgotpassword.html', 'resetpassword.html'].includes(window.location.pathname.split('/').pop())) {
            window.location.href = 'login.html';
        }
    });

    // Initialize page-specific functionality based on current page
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'index.html':
        case '':
            initHomePage();
            break;
        case 'login.html':
            initLoginPage();
            break;
        case 'register.html':
            initRegisterPage();
            break;
        case 'userprofile.html':
            initUserProfilePage();
            break;
        case 'userbookings.html':
            initUserBookingsPage();
            break;
        // Add other page initializers as needed
    }
});

// ==================== HOME PAGE FUNCTIONALITY ====================
function initHomePage() {
    // Location selection functionality
    const locationModal = document.getElementById('locationModal');
    if (locationModal) {
        const locationOptions = document.querySelectorAll('.location-option');
        const locationText = document.querySelector('.location-text');
        
        locationOptions.forEach(option => {
            option.addEventListener('click', function() {
                const selectedLocation = this.getAttribute('data-location');
                locationText.textContent = selectedLocation;
                localStorage.setItem('selectedLocation', selectedLocation);
                
                // Close the modal
                const modal = bootstrap.Modal.getInstance(locationModal);
                modal.hide();
                
                // Show success feedback
                showToast('Location updated successfully');
            });
        });
    }

    // Search functionality
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const searchInput = document.getElementById('searchInput');
            if (searchInput.value.trim() === '') {
                showToast('Please enter a search term');
                searchInput.focus();
                return;
            }
            
            // In a real app, you would filter services based on search term
            showToast(`Searching for "${searchInput.value}"`);
            // You would typically redirect to a search results page or filter the current page
        });
    }

    // Category filtering
    const categories = document.querySelectorAll('.category');
    categories.forEach(category => {
        category.addEventListener('click', function() {
            categories.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            const categoryName = this.textContent.trim();
            // In a real app, you would filter services based on category
            showToast(`Showing ${categoryName} services`);
        });
    });

    // Service booking buttons
    const bookButtons = document.querySelectorAll('.service-card .btn-primary');
    bookButtons.forEach(button => {
        button.addEventListener('click', function() {
            const serviceCard = this.closest('.service-card');
            const serviceName = serviceCard.querySelector('h5').textContent;
            
            // Check if user is logged in
            auth.onAuthStateChanged(user => {
                if (user) {
                    // User is logged in, proceed to booking
                    window.location.href = `bookservice.html?service=${encodeURIComponent(serviceName)}`;
                } else {
                    // User not logged in, redirect to login
                    window.location.href = 'login.html?redirect=bookservice.html';
                }
            });
        });
    });

    // Featured banner booking button
    const featuredBookButton = document.querySelector('.featured-banner .btn-light');
    if (featuredBookButton) {
        featuredBookButton.addEventListener('click', function() {
            auth.onAuthStateChanged(user => {
                if (user) {
                    window.location.href = 'bookservice.html?service=Premium+Hair+Spa+Treatment';
                } else {
                    window.location.href = 'login.html?redirect=bookservice.html';
                }
            });
        });
    }
}

// ==================== LOGIN PAGE FUNCTIONALITY ====================
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Check if there's a redirect parameter
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get('redirect');
                    
                    if (redirect) {
                        window.location.href = redirect;
                    } else {
                        window.location.href = 'index.html';
                    }
                })
                .catch((error) => {
                    showToast(error.message, 'error');
                });
        });
    }

    // Forgot password link
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'forgotpassword.html';
        });
    }

    // Register link
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'register.html';
        });
    }
}

// ==================== REGISTER PAGE FUNCTIONALITY ====================
function initRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = registerForm.querySelector('input[type="email"]').value;
            const password = registerForm.querySelector('input[type="password"]').value;
            const fullName = registerForm.querySelector('input[name="fullName"]').value;
            
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Save additional user data to Firestore
                    return db.collection('users').doc(userCredential.user.uid).set({
                        fullName: fullName,
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        userType: 'customer' // Default to customer
                    });
                })
                .then(() => {
                    showToast('Registration successful!');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                })
                .catch((error) => {
                    showToast(error.message, 'error');
                });
        });
    }

    // Login link
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'login.html';
        });
    }
}

// ==================== USER PROFILE PAGE FUNCTIONALITY ====================
function initUserProfilePage() {
    // Tab switching
    const profileTab = document.getElementById('profileTab');
    const settingsTab = document.getElementById('settingsTab');
    const tabItems = document.querySelectorAll('.profile-nav-item');

    tabItems.forEach(tab => {
        tab.addEventListener('click', function() {
            tabItems.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            if (this.textContent.trim() === 'Profile') {
                profileTab.style.display = 'block';
                settingsTab.style.display = 'none';
            } else {
                profileTab.style.display = 'none';
                settingsTab.style.display = 'block';
            }
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            auth.signOut().then(() => {
                window.location.href = 'login.html';
            }).catch((error) => {
                showToast('Logout failed. Please try again.', 'error');
            });
        });
    }

    // Change Password button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            const user = auth.currentUser;
            if (user && user.email) {
                auth.sendPasswordResetEmail(user.email)
                    .then(() => {
                        showToast('Password reset email sent. Please check your inbox.');
                    })
                    .catch((error) => {
                        showToast(error.message, 'error');
                    });
            } else {
                showToast('No authenticated user found. Please login again.', 'error');
                window.location.href = 'login.html';
            }
        });
    }

    // Load user data
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const userData = doc.data();
                        
                        // Update profile info
                        document.getElementById('profileName').textContent = userData.fullName || 'User';
                        document.getElementById('profileEmail').textContent = user.email || '';
                        document.getElementById('profileFullName').textContent = userData.fullName || 'Not provided';
                        document.getElementById('profileEmailDetail').textContent = user.email || 'Not provided';
                        
                        // Format join date
                        if (user.metadata && user.metadata.creationTime) {
                            const joinDate = new Date(user.metadata.creationTime);
                            document.getElementById('profileJoinDate').textContent = joinDate.toLocaleDateString();
                        }
                    }
                })
                .catch(error => {
                    console.error("Error loading user data:", error);
                    showToast('Error loading profile data', 'error');
                });
        }
    });
}

// ==================== USER BOOKINGS PAGE FUNCTIONALITY ====================
function initUserBookingsPage() {
    // This would load and display the user's bookings from Firestore
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('bookings')
                .where('userId', '==', user.uid)
                .orderBy('bookingDate', 'desc')
                .get()
                .then(querySnapshot => {
                    const bookingsContainer = document.getElementById('bookingsContainer');
                    
                    if (querySnapshot.empty) {
                        bookingsContainer.innerHTML = '<p class="text-muted">You have no bookings yet.</p>';
                        return;
                    }
                    
                    querySnapshot.forEach(doc => {
                        const booking = doc.data();
                        // Create and append booking cards
                        // This would be more elaborate in a real app
                        const bookingCard = document.createElement('div');
                        bookingCard.className = 'booking-card';
                        bookingCard.innerHTML = `
                            <h5>${booking.serviceName}</h5>
                            <p>${booking.bookingDate.toDate().toLocaleString()}</p>
                            <p>Status: ${booking.status || 'Confirmed'}</p>
                        `;
                        bookingsContainer.appendChild(bookingCard);
                    });
                })
                .catch(error => {
                    console.error("Error loading bookings:", error);
                    showToast('Error loading bookings', 'error');
                });
        }
    });
}

// ==================== UTILITY FUNCTIONS ====================
function showToast(message, type = 'success') {
    // In a real app, you would implement a proper toast notification system
    console.log(`${type.toUpperCase()}: ${message}`);
    alert(message); // Simple fallback
}

// Helper function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
} 
//inedex.html logic end
// addservices 
// Add Service Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the add service page
    if (document.getElementById('addServiceForm')) {
        // Initialize Firebase services if not already available
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        const auth = firebase.auth();
        const db = firebase.firestore();
        const storage = firebase.storage();

        // Service image preview
        document.getElementById('serviceImageUpload').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('serviceImagePreview');
                    preview.src = event.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        // Add service form submission
        document.getElementById('addServiceForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get current merchant/user
            const user = auth.currentUser;
            if (!user) {
                alert('Please login first');
                window.location.href = 'login.html';
                return;
            }

            // Get form values
            const serviceName = document.getElementById('serviceName').value.trim();
            const serviceCategory = document.getElementById('serviceCategory').value;
            const serviceDescription = document.getElementById('serviceDescription').value.trim();
            const servicePrice = parseFloat(document.getElementById('servicePrice').value);
            const serviceDuration = parseInt(document.getElementById('serviceDuration').value);
            const imageFile = document.getElementById('serviceImageUpload').files[0];

            // Validate form
            if (!serviceName) {
                alert('Please enter a service name');
                return;
            }
            if (!serviceCategory) {
                alert('Please select a category');
                return;
            }
            if (isNaN(servicePrice) || servicePrice <= 0) {
                alert('Please enter a valid price');
                return;
            }
            if (isNaN(serviceDuration) || serviceDuration < 15) {
                alert('Duration must be at least 15 minutes');
                return;
            }

            // Show loading state
            const submitBtn = document.getElementById('saveServiceBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

            try {
                let imageUrl = '';
                
                // Upload image if exists
                if (imageFile) {
                    const storageRef = storage.ref(`services/${user.uid}/${Date.now()}_${imageFile.name}`);
                    const snapshot = await storageRef.put(imageFile);
                    imageUrl = await snapshot.ref.getDownloadURL();
                }

                // Save service data to Firestore
                await db.collection('services').add({
                    merchantId: user.uid,
                    name: serviceName,
                    category: serviceCategory,
                    description: serviceDescription,
                    price: servicePrice,
                    duration: serviceDuration,
                    imageUrl: imageUrl,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('Service added successfully!');
                window.location.href = 'merchantservices.html';
                
            } catch (error) {
                console.error('Error adding service:', error);
                alert('Failed to add service. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Service';
            }
        });

        // Back button functionality
        const backButton = document.querySelector('.fa-arrow-left');
        if (backButton) {
            backButton.addEventListener('click', function() {
                history.back();
            });
        }
    }
});
// add services end 
//bookservices
// DOM Elements
const serviceDetailsSection = document.getElementById('serviceDetails');
const dateTimeSelectionSection = document.getElementById('dateTimeSelection');
const confirmBookingSection = document.getElementById('confirmBooking');
const nextStepBtn = document.getElementById('nextStepBtn');
const backToServiceBtn = document.getElementById('backToServiceBtn');
const nextToConfirmBtn = document.getElementById('nextToConfirmBtn');
const backToTimeBtn = document.getElementById('backToTimeBtn');
const bookingForm = document.getElementById('bookingForm');
const timeSlotsContainer = document.getElementById('timeSlotsContainer');
const bookingDateInput = document.getElementById('bookingDate');

// Service details elements
const serviceImage = document.getElementById('serviceImage');
const serviceName = document.getElementById('serviceName');
const serviceCategory = document.getElementById('serviceCategory');
const serviceDuration = document.getElementById('serviceDuration');
const servicePrice = document.getElementById('servicePrice');
const serviceDescription = document.getElementById('serviceDescription');

// Summary elements
const summaryServiceName = document.getElementById('summaryServiceName');
const summaryServiceDuration = document.getElementById('summaryServiceDuration');
const summaryServicePrice = document.getElementById('summaryServicePrice');
const summaryDateTime = document.getElementById('summaryDateTime');

// Confirmation elements
const confirmServiceName = document.getElementById('confirmServiceName');
const confirmDateTime = document.getElementById('confirmDateTime');
const confirmDuration = document.getElementById('confirmDuration');
const confirmPrice = document.getElementById('confirmPrice');
const bookingNotes = document.getElementById('bookingNotes');

// Payment elements
const paymentServicePrice = document.getElementById('paymentServicePrice');
const paymentTotalAmount = document.getElementById('paymentTotalAmount');

// Global variables
let selectedService = null;
let selectedDateTime = null;
let currentUser = null;

// Initialize Flatpickr for date selection
const datePicker = flatpickr("#bookingDate", {
    minDate: "today",
    maxDate: new Date().fp_incr(30), // 30 days from now
    disable: [
        function(date) {
            // Disable Sundays
            return (date.getDay() === 0);
        }
    ],
    onChange: function(selectedDates) {
        if (selectedDates.length > 0) {
            generateTimeSlots();
            summaryDateTime.textContent = 'Not selected';
            nextToConfirmBtn.disabled = true;
        }
    }
});

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            loadServiceDetails();
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
        }
    });
});

// Load service details from URL parameters
function loadServiceDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('id');
    
    if (!serviceId) {
        showError('No service selected. Redirecting...');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }

    // Fetch service details from Firestore
    db.collection('services').doc(serviceId).get()
        .then(doc => {
            if (doc.exists) {
                selectedService = {
                    id: doc.id,
                    ...doc.data()
                };
                displayServiceDetails(selectedService);
            } else {
                showError('Service not found. Redirecting...');
                setTimeout(() => window.location.href = 'index.html', 2000);
            }
        })
        .catch(error => {
            console.error('Error fetching service:', error);
            showError('Error loading service details. Please try again.');
        });
}

// Display service details on the page
function displayServiceDetails(service) {
    serviceImage.src = service.imageUrl || 'https://via.placeholder.com/300x200';
    serviceName.textContent = service.name;
    serviceCategory.textContent = service.category;
    serviceDuration.textContent = `${service.duration} mins`;
    servicePrice.textContent = `₹${service.price}`;
    serviceDescription.textContent = service.description || 'No description available.';
    
    // Update summary section
    summaryServiceName.textContent = service.name;
    summaryServiceDuration.textContent = `${service.duration} mins`;
    summaryServicePrice.textContent = `₹${service.price}`;
    
    // Update confirmation section
    confirmServiceName.textContent = service.name;
    confirmDuration.textContent = `${service.duration} mins`;
    confirmPrice.textContent = `₹${service.price}`;
    
    // Update payment section
    paymentServicePrice.textContent = `₹${service.price}`;
    paymentTotalAmount.textContent = `₹${service.price}`;
}

// Generate available time slots
function generateTimeSlots() {
    timeSlotsContainer.innerHTML = '';
    
    // Salon working hours: 10AM to 8PM
    const startHour = 10;
    const endHour = 20;
    
    for (let hour = startHour; hour < endHour; hour++) {
        // Create slots every 30 minutes
        for (let minutes of ['00', '30']) {
            const time = `${hour.toString().padStart(2, '0')}:${minutes}`;
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = time;
            timeSlot.addEventListener('click', function() {
                selectTimeSlot(timeSlot, time);
            });
            timeSlotsContainer.appendChild(timeSlot);
        }
    }
}

// Handle time slot selection
function selectTimeSlot(slot, time) {
    // Deselect all slots
    document.querySelectorAll('.time-slot').forEach(s => {
        s.classList.remove('selected');
    });
    
    // Select clicked slot
    slot.classList.add('selected');
    
    // Update selected time
    const selectedDate = datePicker.selectedDates[0];
    if (selectedDate) {
        const [hours, mins] = time.split(':');
        selectedDate.setHours(parseInt(hours), parseInt(mins));
        selectedDateTime = selectedDate;
        
        summaryDateTime.textContent = selectedDate.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        confirmDateTime.textContent = selectedDate.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        nextToConfirmBtn.disabled = false;
    }
}

// Handle form submission for booking
bookingForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!selectedService || !selectedDateTime) {
        showError('Please select a service and time slot');
        return;
    }
    
    if (!document.getElementById('termsAgree').checked) {
        showError('Please agree to the terms and conditions');
        return;
    }
    
    // Create booking object
    const booking = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'User',
        dateTime: selectedDateTime,
        duration: selectedService.duration,
        notes: bookingNotes.value || '',
        status: 'confirmed',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Save booking to Firestore
    db.collection('bookings').add(booking)
        .then(docRef => {
            showSuccess('Booking confirmed successfully!');
            // Redirect to bookings page after 2 seconds
            setTimeout(() => {
                window.location.href = 'userbookings.html';
            }, 2000);
        })
        .catch(error => {
            console.error('Error creating booking:', error);
            showError('Failed to confirm booking. Please try again.');
        });
});

// Navigation between steps
nextStepBtn.addEventListener('click', function() {
    serviceDetailsSection.style.display = 'none';
    dateTimeSelectionSection.style.display = 'block';
    updateStepIndicator(1);
});

backToServiceBtn.addEventListener('click', function() {
    dateTimeSelectionSection.style.display = 'none';
    serviceDetailsSection.style.display = 'block';
    updateStepIndicator(0);
});

nextToConfirmBtn.addEventListener('click', function() {
    dateTimeSelectionSection.style.display = 'none';
    confirmBookingSection.style.display = 'block';
    updateStepIndicator(2);
});

backToTimeBtn.addEventListener('click', function() {
    confirmBookingSection.style.display = 'none';
    dateTimeSelectionSection.style.display = 'block';
    updateStepIndicator(1);
});

// Update step indicator UI
function updateStepIndicator(activeIndex) {
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index === activeIndex) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// Show error message
function showError(message) {
    // You can implement a more sophisticated error display
    alert(message);
}

// Show success message
function showSuccess(message) {
    // You can implement a more sophisticated success display
    alert(message);
} 
// bookservices end 

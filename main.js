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
//merchant rtegister 
// Merchant Registration Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the merchant registration page
    if (document.getElementById('merchantRegistrationForm')) {
        // Initialize Firebase services if not already available
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        const auth = firebase.auth();
        const db = firebase.firestore();
        const storage = firebase.storage();

        // Salon image preview
        document.getElementById('salonImageUpload').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('salonImagePreview');
                    preview.src = event.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        // Add service button functionality
        document.getElementById('addServiceBtn').addEventListener('click', function() {
            const serviceId = 'service-' + Date.now();
            const serviceItem = document.createElement('div');
            serviceItem.className = 'service-item';
            serviceItem.id = serviceId;
            serviceItem.innerHTML = `
                <div class="service-details">
                    <input type="text" class="form-control mb-2 service-name" placeholder="Service name" required>
                    <div class="row">
                        <div class="col-6">
                            <input type="number" class="form-control service-price" placeholder="Price (₹)" min="0" required>
                        </div>
                        <div class="col-6">
                            <input type="number" class="form-control service-duration" placeholder="Duration (mins)" min="15" required>
                        </div>
                    </div>
                </div>
                <i class="fas fa-times remove-service" data-service-id="${serviceId}"></i>
            `;
            
            document.getElementById('servicesList').appendChild(serviceItem);
            
            // Add event listener to remove button
            serviceItem.querySelector('.remove-service').addEventListener('click', function() {
                document.getElementById(this.getAttribute('data-service-id')).remove();
            });
        });

        // Merchant registration form submission
        document.getElementById('merchantRegistrationForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get current user
            const user = auth.currentUser;
            if (!user) {
                alert('Please login first');
                window.location.href = 'login.html';
                return;
            }

            // Validate terms agreement
            if (!document.getElementById('termsAgree').checked) {
                alert('Please agree to the Terms & Conditions');
                return;
            }

            // Validate at least one service
            const services = document.getElementById('servicesList').children;
            if (services.length === 0) {
                alert('Please add at least one service');
                return;
            }

            // Show loading state
            const submitBtn = document.getElementById('registerMerchantBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';

            try {
                // Collect salon data
                const salonData = {
                    ownerId: user.uid,
                    name: document.getElementById('salonName').value.trim(),
                    description: document.getElementById('salonDescription').value.trim(),
                    address: document.getElementById('salonAddress').value.trim(),
                    city: document.getElementById('salonCity').value.trim(),
                    location: document.getElementById('salonLocation').value,
                    contact: {
                        name: document.getElementById('contactName').value.trim(),
                        phone: document.getElementById('contactPhone').value.trim(),
                        email: document.getElementById('contactEmail').value.trim()
                    },
                    hours: {
                        opening: document.getElementById('openingTime').value,
                        closing: document.getElementById('closingTime').value,
                        closedOnSunday: document.getElementById('sundayClosed').checked
                    },
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Upload salon image if exists
                const imageFile = document.getElementById('salonImageUpload').files[0];
                if (imageFile) {
                    const storageRef = storage.ref(`salons/${user.uid}/${Date.now()}_${imageFile.name}`);
                    const snapshot = await storageRef.put(imageFile);
                    salonData.imageUrl = await snapshot.ref.getDownloadURL();
                }

                // Process services
                const servicesData = [];
                for (let service of services) {
                    const name = service.querySelector('.service-name').value.trim();
                    const price = parseFloat(service.querySelector('.service-price').value);
                    const duration = parseInt(service.querySelector('.service-duration').value);

                    if (!name || isNaN(price) || isNaN(duration)) {
                        throw new Error('Please fill all service fields correctly');
                    }

                    servicesData.push({
                        name,
                        price,
                        duration
                    });
                }

                // Save salon data to Firestore
                const salonRef = await db.collection('salons').add(salonData);
                
                // Save services to Firestore
                const batch = db.batch();
                servicesData.forEach(service => {
                    const serviceRef = db.collection('services').doc();
                    batch.set(serviceRef, {
                        ...service,
                        salonId: salonRef.id,
                        ownerId: user.uid,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();

                // Update user role to merchant
                await db.collection('users').doc(user.uid).update({
                    role: 'merchant',
                    merchantId: salonRef.id
                });

                alert('Merchant registration successful! Redirecting to dashboard...');
                window.location.href = 'merchantdashboard.html';
                
            } catch (error) {
                console.error('Registration error:', error);
                alert(error.message || 'Failed to register. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register as Merchant';
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
 //merchant register end
//user booking 
// DOM Elements
const upcomingTab = document.querySelector('.tab-item:nth-child(1)');
const completedTab = document.querySelector('.tab-item:nth-child(2)');
const cancelledTab = document.querySelector('.tab-item:nth-child(3)');
const bookingsContainer = document.querySelector('.container.py-4');
const emptyStateTemplate = `
    <div class="empty-state">
        <i class="far fa-calendar-check"></i>
        <h4>No Bookings Found</h4>
        <p class="text-muted">You don't have any bookings in this category.</p>
        <button class="btn btn-dark px-4" id="bookNowBtn">Book Now</button>
    </div>
`;

// Global variables
let currentUser = null;
let allBookings = [];
let currentTab = 'upcoming';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            loadUserBookings();
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
        }
    });

    // Set up tab event listeners
    setupTabs();
});

// Load user bookings from Firestore
function loadUserBookings() {
    showLoadingState();
    
    db.collection('bookings')
        .where('userId', '==', currentUser.uid)
        .orderBy('dateTime', 'desc')
        .get()
        .then(querySnapshot => {
            allBookings = [];
            querySnapshot.forEach(doc => {
                const booking = {
                    id: doc.id,
                    ...doc.data(),
                    // Convert Firestore timestamp to Date object
                    dateTime: doc.data().dateTime.toDate(),
                    createdAt: doc.data().createdAt.toDate()
                };
                allBookings.push(booking);
            });
            
            renderBookings(currentTab);
        })
        .catch(error => {
            console.error('Error loading bookings:', error);
            showError('Failed to load bookings. Please try again.');
            renderEmptyState();
        });
}

// Set up tab switching functionality
function setupTabs() {
    upcomingTab.addEventListener('click', () => switchTab('upcoming'));
    completedTab.addEventListener('click', () => switchTab('completed'));
    cancelledTab.addEventListener('click', () => switchTab('cancelled'));
}

// Switch between booking tabs
function switchTab(tab) {
    currentTab = tab;
    
    // Update active tab UI
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    switch(tab) {
        case 'upcoming':
            upcomingTab.classList.add('active');
            break;
        case 'completed':
            completedTab.classList.add('active');
            break;
        case 'cancelled':
            cancelledTab.classList.add('active');
            break;
    }
    
    renderBookings(tab);
}

// Render bookings based on current tab
function renderBookings(tab) {
    // Filter bookings based on tab
    let filteredBookings = [];
    const now = new Date();
    
    switch(tab) {
        case 'upcoming':
            filteredBookings = allBookings.filter(booking => 
                booking.status === 'confirmed' && booking.dateTime > now
            );
            break;
        case 'completed':
            filteredBookings = allBookings.filter(booking => 
                (booking.status === 'completed' || 
                 (booking.status === 'confirmed' && booking.dateTime <= now))
            );
            break;
        case 'cancelled':
            filteredBookings = allBookings.filter(booking => 
                booking.status === 'cancelled'
            );
            break;
    }
    
    // Clear current bookings
    bookingsContainer.innerHTML = '';
    
    if (filteredBookings.length === 0) {
        renderEmptyState();
        return;
    }
    
    // Render each booking
    filteredBookings.forEach(booking => {
        const bookingElement = createBookingElement(booking);
        bookingsContainer.appendChild(bookingElement);
    });
    
    // Add event listeners to booking buttons
    addBookingButtonListeners();
}

// Create HTML element for a booking
function createBookingElement(booking) {
    const bookingDate = booking.dateTime.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const bookingTime = booking.dateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const createdDate = booking.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Determine status class and text
    let statusClass, statusText;
    const now = new Date();
    
    if (booking.status === 'cancelled') {
        statusClass = 'status-cancelled';
        statusText = 'Cancelled';
    } else if (booking.dateTime <= now) {
        statusClass = 'status-confirmed';
        statusText = 'Completed';
    } else {
        statusClass = 'status-confirmed';
        statusText = 'Confirmed';
    }
    
    // Create booking card HTML
    const bookingElement = document.createElement('div');
    bookingElement.className = 'booking-card';
    bookingElement.dataset.bookingId = booking.id;
    
    bookingElement.innerHTML = `
        <div class="booking-card-header d-flex justify-content-between align-items-center">
            <div>
                <span class="booking-status ${statusClass}">${statusText}</span>
                <span class="text-muted ms-2">Booking ID: #${booking.id.substring(0, 6).toUpperCase()}</span>
            </div>
            <div class="text-muted">Booked on: ${createdDate}</div>
        </div>
        <div class="booking-card-body">
            <div class="row">
                <div class="col-md-4 mb-3 mb-md-0">
                    <img src="${booking.serviceImage || 'https://via.placeholder.com/300x200'}" alt="Service" class="booking-image">
                </div>
                <div class="col-md-5">
                    <h5>${booking.serviceName}</h5>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Salon</div>
                        <div class="booking-detail-value">${booking.salonName || 'ProCut Salon'}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Date & Time</div>
                        <div class="booking-detail-value">${bookingDate}, ${bookingTime}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Professional</div>
                        <div class="booking-detail-value">${booking.professionalName || 'Stylist'}</div>
                    </div>
                </div>
                <div class="col-md-3 d-flex flex-column justify-content-between">
                    <div class="text-end mb-3">
                        <div class="booking-detail-label">Total Amount</div>
                        <div class="h4">₹${booking.servicePrice || '0'}</div>
                    </div>
                    <div class="d-flex flex-column gap-2">
                        <button class="btn btn-dark view-details-btn">View Details</button>
                        ${booking.status === 'confirmed' && booking.dateTime > now ? 
                            `<button class="btn btn-outline-dark cancel-booking-btn">Cancel Booking</button>` : 
                            `<button class="btn btn-outline-dark book-again-btn">Book Again</button>`
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return bookingElement;
}

// Add event listeners to booking buttons
function addBookingButtonListeners() {
    // View Details buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookingId = this.closest('.booking-card').dataset.bookingId;
            viewBookingDetails(bookingId);
        });
    });
    
    // Cancel Booking buttons
    document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookingId = this.closest('.booking-card').dataset.bookingId;
            cancelBooking(bookingId);
        });
    });
    
    // Book Again buttons
    document.querySelectorAll('.book-again-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookingId = this.closest('.booking-card').dataset.bookingId;
            bookAgain(bookingId);
        });
    });
}

// View booking details
function viewBookingDetails(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) {
        // In a real app, you might show a modal or navigate to a details page
        alert(`Booking Details:\n\nService: ${booking.serviceName}\nDate: ${booking.dateTime.toLocaleString()}\nStatus: ${booking.status}`);
    }
}

// Cancel a booking
function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        showLoadingState();
        
        db.collection('bookings').doc(bookingId).update({
            status: 'cancelled',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            showSuccess('Booking cancelled successfully');
            loadUserBookings(); // Refresh the list
        })
        .catch(error => {
            console.error('Error cancelling booking:', error);
            showError('Failed to cancel booking. Please try again.');
        });
    }
}

// Book again functionality
function bookAgain(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) {
        // Redirect to booking page with service details
        window.location.href = `bookservice.html?serviceId=${booking.serviceId}`;
    }
}

// Show empty state
function renderEmptyState() {
    bookingsContainer.innerHTML = emptyStateTemplate;
    
    // Add event listener to Book Now button
    const bookNowBtn = document.getElementById('bookNowBtn');
    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
}

// Show loading state
function showLoadingState() {
    bookingsContainer.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-secondary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading your bookings...</p>
        </div>
    `;
}

// Show success message
function showSuccess(message) {
    // In a real app, you might use a toast notification
    alert(message);
}

// Show error message
function showError(message) {
    // In a real app, you might use a toast notification
    alert(message);
    
}
// end user bookings
// reset password
// DOM Elements
const newPasswordForm = document.getElementById('newPasswordForm');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordError = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmError');
const successMessage = document.getElementById('successMessage');
const resetButton = document.getElementById('resetButton');
const newPasswordToggle = document.getElementById('newPasswordToggle');
const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');

// Firebase Auth instance
const auth = firebase.auth();

// Function to handle password reset
async function handlePasswordReset(newPassword) {
    try {
        // Get the password reset code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const oobCode = urlParams.get('oobCode');
        
        if (!oobCode) {
            throw new Error('Invalid password reset link. Please request a new one.');
        }
        
        // Confirm the password reset with Firebase
        await auth.confirmPasswordReset(oobCode, newPassword);
        
        // Show success message
        showSuccess('Password reset successfully! Redirecting to login...');
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        // Handle specific Firebase errors
        let errorMessage = 'Error resetting password. Please try again.';
        
        switch (error.code) {
            case 'auth/expired-action-code':
                errorMessage = 'The password reset link has expired. Please request a new one.';
                break;
            case 'auth/invalid-action-code':
                errorMessage = 'The password reset link is invalid. Please request a new one.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password should be at least 6 characters.';
                break;
        }
        
        showError(confirmError, errorMessage);
        resetButton.disabled = false;
        resetButton.textContent = 'Reset Password';
    }
}

// Show error message
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    successMessage.style.display = 'none';
}

// Show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    passwordError.style.display = 'none';
    confirmError.style.display = 'none';
}

// Toggle password visibility
function togglePasswordVisibility(inputElement, toggleElement) {
    if (inputElement.type === 'password') {
        inputElement.type = 'text';
        toggleElement.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        inputElement.type = 'password';
        toggleElement.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

// Form submission handler
newPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Reset error messages
    passwordError.style.display = 'none';
    confirmError.style.display = 'none';
    
    // Validate password
    if (newPassword.length < 6) {
        showError(passwordError, 'Password must be at least 6 characters');
        return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
        showError(confirmError, 'Passwords do not match');
        return;
    }
    
    // Show loading state
    resetButton.disabled = true;
    resetButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Resetting...';
    
    // Handle password reset
    await handlePasswordReset(newPassword);
});

// Password toggle event listeners
newPasswordToggle.addEventListener('click', () => {
    togglePasswordVisibility(newPasswordInput, newPasswordToggle);
});

confirmPasswordToggle.addEventListener('click', () => {
    togglePasswordVisibility(confirmPasswordInput, confirmPasswordToggle);
});

// Check if the page is loaded with a valid reset code
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const oobCode = urlParams.get('oobCode');
    
    if (!oobCode) {
        showError(confirmError, 'Invalid password reset link. Please request a new one.');
        newPasswordInput.disabled = true;
        confirmPasswordInput.disabled = true;
        resetButton.disabled = true;
    }
});
//  reset password end 
//merchant profile.html
// DOM Elements
const merchantNameEl = document.getElementById('merchantName');
const merchantEmailEl = document.getElementById('merchantEmail');
const profileFullNameEl = document.getElementById('profileFullName');
const profileEmailEl = document.getElementById('profileEmail');
const profilePhoneEl = document.getElementById('profilePhone');
const profileJoinDateEl = document.getElementById('profileJoinDate');
const salonNameEl = document.getElementById('salonName');
const salonDescriptionEl = document.getElementById('salonDescription');
const salonAddressEl = document.getElementById('salonAddress');
const salonHoursEl = document.getElementById('salonHours');
const salonImageEl = document.getElementById('salonImage');
const emailNotificationsEl = document.getElementById('emailNotifications');
const pushNotificationsEl = document.getElementById('pushNotifications');

// Firebase Auth State Listener
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        loadMerchantProfile(user.uid);
        loadSalonInfo(user.uid);
        loadNotificationPreferences(user.uid);
    } else {
        // No user is signed in, redirect to login
        window.location.href = 'login.html';
    }
});

/**
 * Loads merchant profile data from Firestore
 * @param {string} userId - The user ID of the logged-in merchant
 */
function loadMerchantProfile(userId) {
    db.collection('merchants').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                
                // Update profile header
                merchantNameEl.textContent = data.fullName || 'No name provided';
                merchantEmailEl.textContent = user.email;
                
                // Update profile tab
                profileFullNameEl.textContent = data.fullName || 'No name provided';
                profileEmailEl.textContent = user.email;
                profilePhoneEl.textContent = data.phoneNumber || 'Not provided';
                
                // Format and display join date
                if (data.createdAt) {
                    const joinDate = data.createdAt.toDate();
                    profileJoinDateEl.textContent = joinDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                } else {
                    profileJoinDateEl.textContent = 'Unknown';
                }
            } else {
                console.error('No merchant profile found');
                showToast('No merchant profile found', 'error');
            }
        })
        .catch((error) => {
            console.error('Error loading merchant profile:', error);
            showToast('Error loading profile data', 'error');
        });
}

/**
 * Loads salon information from Firestore
 * @param {string} userId - The user ID of the logged-in merchant
 */
function loadSalonInfo(userId) {
    db.collection('salons').where('ownerId', '==', userId).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const salonDoc = querySnapshot.docs[0];
                const salonData = salonDoc.data();
                
                // Update salon information
                salonNameEl.textContent = salonData.name || 'No salon name';
                salonDescriptionEl.textContent = salonData.description || 'No description provided';
                salonAddressEl.textContent = salonData.address || 'No address provided';
                
                // Format business hours
                if (salonData.businessHours) {
                    salonHoursEl.textContent = formatBusinessHours(salonData.businessHours);
                } else {
                    salonHoursEl.textContent = 'Not specified';
                }
                
                // Load salon image if available
                if (salonData.imageUrl) {
                    salonImageEl.src = salonData.imageUrl;
                }
            } else {
                console.log('No salon information found');
                salonNameEl.textContent = 'No salon information found';
            }
        })
        .catch((error) => {
            console.error('Error loading salon info:', error);
            showToast('Error loading salon information', 'error');
        });
}

/**
 * Formats business hours for display
 * @param {Object} hours - Business hours object
 * @returns {string} Formatted business hours string
 */
function formatBusinessHours(hours) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let formattedHours = '';
    
    days.forEach(day => {
        if (hours[day] && hours[day].open && hours[day].close) {
            formattedHours += `${day}: ${hours[day].open} - ${hours[day].close}\n`;
        } else {
            formattedHours += `${day}: Closed\n`;
        }
    });
    
    return formattedHours;
}

/**
 * Loads notification preferences from Firestore
 * @param {string} userId - The user ID of the logged-in merchant
 */
function loadNotificationPreferences(userId) {
    db.collection('merchant_preferences').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const prefs = doc.data();
                emailNotificationsEl.checked = prefs.emailNotifications !== false;
                pushNotificationsEl.checked = prefs.pushNotifications !== false;
            }
        })
        .catch((error) => {
            console.error('Error loading preferences:', error);
        });
}

/**
 * Saves notification preferences to Firestore
 */
function saveNotificationPreferences() {
    const userId = firebase.auth().currentUser.uid;
    const preferences = {
        emailNotifications: emailNotificationsEl.checked,
        pushNotifications: pushNotificationsEl.checked,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('merchant_preferences').doc(userId).set(preferences, { merge: true })
        .then(() => {
            showToast('Notification preferences saved', 'success');
        })
        .catch((error) => {
            console.error('Error saving preferences:', error);
            showToast('Error saving preferences', 'error');
        });
}

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, etc.)
 */
function showToast(message, type = 'success') {
    // Implement toast notification UI here
    // This could use a library or custom implementation
    console.log(`${type.toUpperCase()}: ${message}`);
    alert(`${type.toUpperCase()}: ${message}`); // Temporary implementation
}

/**
 * Handles account deletion
 */
function deleteAccount() {
    const user = firebase.auth().currentUser;
    
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        // First delete user data from Firestore
        const batch = db.batch();
        
        // Delete merchant profile
        batch.delete(db.collection('merchants').doc(user.uid));
        
        // Delete salon information (if exists)
        db.collection('salons').where('ownerId', '==', user.uid).get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                
                return batch.commit();
            })
            .then(() => {
                // Then delete the auth account
                return user.delete();
            })
            .then(() => {
                showToast('Account deleted successfully', 'success');
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Error deleting account:', error);
                showToast('Error deleting account', 'error');
            });
    }
}

/**
 * Initializes event listeners
 */
function initEventListeners() {
    // Notification preference changes
    emailNotificationsEl.addEventListener('change', saveNotificationPreferences);
    pushNotificationsEl.addEventListener('change', saveNotificationPreferences);
    
    // Delete account button
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', deleteAccount);
    }
    
    // Change password button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            window.location.href = 'resetpassword.html';
        });
    }
    
    // Edit salon button
    const editSalonBtn = document.getElementById('editSalonBtn');
    if (editSalonBtn) {
        editSalonBtn.addEventListener('click', () => {
            window.location.href = 'editsalon.html';
        });
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
});
// merchant profileend 
// merchant service
// DOM Elements
const servicesContainer = document.getElementById('servicesContainer');
const addServiceBtn = document.getElementById('addServiceBtn');

// Current user and salon reference
let currentUser = null;
let currentSalonId = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadMerchantData();
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
        }
    });

    // Add service button event
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => {
            window.location.href = 'addservices.html';
        });
    }
});

// Load merchant data and services
function loadMerchantData() {
    // Get merchant's salon data
    db.collection('merchants').doc(currentUser.uid).get()
        .then(doc => {
            if (doc.exists) {
                currentSalonId = doc.data().salonId;
                loadMerchantServices();
            } else {
                console.error('No merchant data found');
                showEmptyState();
            }
        })
        .catch(error => {
            console.error('Error getting merchant data:', error);
            showErrorState();
        });
}

// Load merchant services
function loadMerchantServices() {
    if (!currentSalonId) {
        showEmptyState();
        return;
    }

    servicesContainer.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    db.collection('services')
        .where('salonId', '==', currentSalonId)
        .get()
        .then(querySnapshot => {
            if (querySnapshot.empty) {
                showEmptyState();
                return;
            }

            servicesContainer.innerHTML = '';
            querySnapshot.forEach(doc => {
                const service = doc.data();
                renderServiceCard(doc.id, service);
            });
        })
        .catch(error => {
            console.error('Error loading services:', error);
            showErrorState();
        });
}

// Render a service card
function renderServiceCard(serviceId, service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML = `
        <div class="d-flex">
            <div class="flex-shrink-0 me-3">
                <img src="${service.imageUrl || 'https://via.placeholder.com/150'}" 
                     alt="${service.name}" 
                     class="service-image" style="width: 100px; height: 100px;">
            </div>
            <div class="flex-grow-1">
                <h5>${service.name}</h5>
                <p class="text-muted mb-1">${service.description || 'No description'}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold">$${service.price.toFixed(2)}</span>
                    <span class="badge bg-light text-dark">${service.duration} mins</span>
                </div>
                <div class="service-actions">
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${serviceId}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${serviceId}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;

    servicesContainer.appendChild(card);

    // Add event listeners to the buttons
    card.querySelector('.edit-btn').addEventListener('click', () => {
        window.location.href = `editsalon.html?id=${serviceId}`;
    });

    card.querySelector('.delete-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this service?')) {
            deleteService(serviceId);
        }
    });
}

// Delete a service
function deleteService(serviceId) {
    db.collection('services').doc(serviceId).delete()
        .then(() => {
            alert('Service deleted successfully');
            loadMerchantServices();
        })
        .catch(error => {
            console.error('Error deleting service:', error);
            alert('Failed to delete service');
        });
}

// Show empty state
function showEmptyState() {
    servicesContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-scissors"></i>
            <h4>No Services Added</h4>
            <p class="text-muted">You haven't added any services yet. Click the button above to get started.</p>
            <button class="btn btn-primary" id="addServiceBtnEmpty">
                <i class="fas fa-plus me-2"></i> Add Your First Service
            </button>
        </div>
    `;

    // Add event listener to the empty state button
    const addServiceBtnEmpty = document.getElementById('addServiceBtnEmpty');
    if (addServiceBtnEmpty) {
        addServiceBtnEmpty.addEventListener('click', () => {
            window.location.href = 'addservices.html';
        });
    }
}

// Show error state
function showErrorState() {
    servicesContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle text-danger"></i>
            <h4>Error Loading Services</h4>
            <p class="text-muted">We couldn't load your services. Please try again later.</p>
            <button class="btn btn-outline-primary" id="retryBtn">
                <i class="fas fa-sync-alt me-2"></i> Try Again
            </button>
        </div>
    `;

    // Add event listener to the retry button
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', loadMerchantServices);
    }
}

// Navigation guard - prevent unauthorized access
function checkAuthState() {
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            // Check if user is a merchant
            db.collection('merchants').doc(user.uid).get()
                .then(doc => {
                    if (!doc.exists) {
                        window.location.href = '404error.html';
                    }
                });
        }
    });
}

// Initialize auth check
checkAuthState();
// merchnat service 

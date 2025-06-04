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

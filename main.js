?//register
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

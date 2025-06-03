// Firebase configuration
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

// DOM Elements
const registerForm = document.getElementById('registerForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('registerEmail');
const passwordInput = document.getElementById('registerPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsCheckbox = document.getElementById('termsAgree');
const registerButton = document.getElementById('registerButton');
const passwordStrengthBar = document.getElementById('passwordStrengthBar');
const passwordStrengthText = document.getElementById('passwordStrengthText');
const passwordToggle = document.getElementById('registerPasswordToggle');
const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
const successMessage = document.getElementById('successMessage');

// Password Visibility Toggle
passwordToggle.addEventListener('click', () => {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  passwordToggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
});

confirmPasswordToggle.addEventListener('click', () => {
  const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  confirmPasswordInput.setAttribute('type', type);
  confirmPasswordToggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
});

// Password Strength Checker
passwordInput.addEventListener('input', () => {
  const password = passwordInput.value;
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength += 25;
  
  // Uppercase check
  if (/[A-Z]/.test(password)) strength += 25;
  
  // Number check
  if (/\d/.test(password)) strength += 25;
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
  
  // Update UI
  passwordStrengthBar.style.width = `${strength}%`;
  
  // Set color and text
  if (strength < 50) {
    passwordStrengthBar.style.backgroundColor = '#d32f2f';
    passwordStrengthText.textContent = 'Weak';
    passwordStrengthText.className = 'password-strength-text strength-weak';
  } else if (strength < 75) {
    passwordStrengthBar.style.backgroundColor = '#ff9800';
    passwordStrengthText.textContent = 'Medium';
    passwordStrengthText.className = 'password-strength-text strength-medium';
  } else {
    passwordStrengthBar.style.backgroundColor = '#4caf50';
    passwordStrengthText.textContent = 'Strong';
    passwordStrengthText.className = 'password-strength-text strength-strong';
  }
});

// Form Validation
function validateForm() {
  let isValid = true;
  
  // Reset errors
  document.querySelectorAll('.error-message').forEach(el => {
    el.style.display = 'none';
    el.textContent = '';
  });
  
  // Name validation
  if (fullNameInput.value.trim().length < 3) {
    document.getElementById('nameError').textContent = 'Name must be at least 3 characters';
    document.getElementById('nameError').style.display = 'block';
    isValid = false;
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value)) {
    document.getElementById('emailError').textContent = 'Please enter a valid email address';
    document.getElementById('emailError').style.display = 'block';
    isValid = false;
  }
  
  // Password validation
  if (passwordInput.value.length < 8) {
    document.getElementById('passwordError').textContent = 'Password must be at least 8 characters';
    document.getElementById('passwordError').style.display = 'block';
    isValid = false;
  }
  
  // Password match validation
  if (passwordInput.value !== confirmPasswordInput.value) {
    document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
    document.getElementById('confirmPasswordError').style.display = 'block';
    isValid = false;
  }
  
  // Terms validation
  if (!termsCheckbox.checked) {
    document.getElementById('termsError').textContent = 'You must agree to the terms and conditions';
    document.getElementById('termsError').style.display = 'block';
    isValid = false;
  }
  
  return isValid;
}

// Registration Handler
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  // Get form values
  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  try {
    // Disable button during registration
    registerButton.disabled = true;
    registerButton.textContent = 'Creating account...';
    
    // Create user with Firebase Authentication
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    
    // Add user details to Firestore
    await db.collection('users').doc(userCredential.user.uid).set({
      fullName: fullName,
      email: email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Show success message
    successMessage.textContent = 'Account created successfully! Redirecting...';
    successMessage.style.display = 'block';
    
    // Redirect to index.html after 2 seconds
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    
  } catch (error) {
    // Handle errors
    console.error('Registration error:', error);
    registerButton.disabled = false;
    registerButton.textContent = 'Create Account';
    
    let errorMessage = 'Registration failed. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already in use.';
        document.getElementById('emailError').textContent = errorMessage;
        document.getElementById('emailError').style.display = 'block';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        document.getElementById('emailError').textContent = errorMessage;
        document.getElementById('emailError').style.display = 'block';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters.';
        document.getElementById('passwordError').textContent = errorMessage;
        document.getElementById('passwordError').style.display = 'block';
        break;
      default:
        successMessage.textContent = errorMessage;
        successMessage.style.color = '#d32f2f';
        successMessage.style.display = 'block';
    }
  }
});

// Social Login Handlers (Placeholder - would need actual implementation)
document.getElementById('googleSignIn').addEventListener('click', (e) => {
  e.preventDefault();
  alert('Google login would be implemented here');
});

document.getElementById('facebookSignIn').addEventListener('click', (e) => {
  e.preventDefault();
  alert('Facebook login would be implemented here');
});

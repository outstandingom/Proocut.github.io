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

// Common Functions
function checkAuthState() {
  auth.onAuthStateChanged(user => {
    const protectedPages = ['userprofile.html', 'userbookings.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) {
      if (!user) {
        window.location.href = 'login.html';
      } else {
        // Load user data if on profile page
        if (currentPage === 'userprofile.html') {
          loadUserProfile(user);
        }
      }
    } else if (currentPage === 'login.html' || currentPage === 'register.html') {
      if (user) {
        window.location.href = 'index.html';
      }
    }
  });
}

function loadUserProfile(user) {
  db.collection('users').doc(user.uid).get().then(doc => {
    if (doc.exists) {
      const userData = doc.data();
      
      // Update profile information
      document.getElementById('profileName').textContent = userData.fullName || 'User';
      document.getElementById('profileEmail').textContent = user.email;
      document.getElementById('profileFullName').textContent = userData.fullName || 'Not provided';
      document.getElementById('profileEmailDetail').textContent = user.email;
      document.getElementById('profilePhone').textContent = userData.phone || 'Not provided';
      
      // Format and display join date
      if (userData.createdAt) {
        const joinDate = userData.createdAt.toDate();
        document.getElementById('profileJoinDate').textContent = joinDate.toLocaleDateString();
      }
      
      // Check if user is merchant
      if (userData.isMerchant) {
        document.getElementById('customerActions').style.display = 'none';
        document.getElementById('merchantActions').style.display = 'block';
        document.getElementById('accountType').textContent = 'Merchant';
      }
    }
  }).catch(error => {
    console.error("Error loading user profile:", error);
  });
}

// Register Page Logic
if (document.getElementById('registerForm')) {
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
    
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
    
    passwordStrengthBar.style.width = `${strength}%`;
    
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
    
    document.querySelectorAll('.error-message').forEach(el => {
      el.style.display = 'none';
      el.textContent = '';
    });
    
    if (fullNameInput.value.trim().length < 3) {
      document.getElementById('nameError').textContent = 'Name must be at least 3 characters';
      document.getElementById('nameError').style.display = 'block';
      isValid = false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      document.getElementById('emailError').textContent = 'Please enter a valid email address';
      document.getElementById('emailError').style.display = 'block';
      isValid = false;
    }
    
    if (passwordInput.value.length < 8) {
      document.getElementById('passwordError').textContent = 'Password must be at least 8 characters';
      document.getElementById('passwordError').style.display = 'block';
      isValid = false;
    }
    
    if (passwordInput.value !== confirmPasswordInput.value) {
      document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
      document.getElementById('confirmPasswordError').style.display = 'block';
      isValid = false;
    }
    
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
    
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    try {
      registerButton.disabled = true;
      registerButton.textContent = 'Creating account...';
      
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      
      await db.collection('users').doc(userCredential.user.uid).set({
        fullName: fullName,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isMerchant: false
      });
      
      successMessage.textContent = 'Account created successfully! Redirecting...';
      successMessage.style.display = 'block';
      
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      
    } catch (error) {
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
}

// Login Page Logic
if (document.getElementById('loginForm')) {
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginPasswordToggle = document.getElementById('loginPasswordToggle');

  // Password Toggle
  loginPasswordToggle.addEventListener('click', () => {
    const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    loginPassword.setAttribute('type', type);
    loginPasswordToggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
  });

  // Login Handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    try {
      // Set persistence based on remember me selection
      const persistence = rememberMe ? 
        firebase.auth.Auth.Persistence.LOCAL : 
        firebase.auth.Auth.Persistence.SESSION;
      
      await auth.setPersistence(persistence);
      
      await auth.signInWithEmailAndPassword(email, password);
      
      window.location.href = 'index.html';
      
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
  });
}

// User Profile Page Logic
if (document.getElementById('logoutBtn')) {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
      window.location.href = 'login.html';
    }).catch(error => {
      console.error('Logout error:', error);
      alert('Logout failed. Please try again.');
    });
  });
}

// Initialize auth state check on all pages
document.addEventListener('DOMContentLoaded', checkAuthState);

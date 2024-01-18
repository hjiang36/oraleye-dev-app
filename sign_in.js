import { app, auth } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

document.getElementById('sign-in-button').addEventListener('click', () => {
  window.api.send('open-auth-window', '');
});

document.getElementById('email-sign-in-button').addEventListener('click', () => {
  // Use Firebase Auth to sign in with email and password
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (email.length == 0 || password.length == 0) {
    alert('Please enter an email and password');
    return;
  }
  signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
    console.log('User signed in successfully');
    // window.location.href = 'index.html';
  }).catch((error) => {
    console.log('Error signing in:', error);
  });
});
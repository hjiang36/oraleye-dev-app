import { app, auth } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";


document.getElementById('register-button').addEventListener('click', () => {
    // Use Firebase Auth to create a user
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (email.length == 0 || password.length == 0) {
        alert('Please enter an email and password');
        return;
    }
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('User created successfully');
            window.location.href = 'sign_in_page.html';
        })
        .catch((error) => {
            console.log('Error creating user:', error);
        });
});
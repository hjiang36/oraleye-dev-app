import { app, auth } from './firebase.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const db = getFirestore(app);

document.getElementById('register-button').addEventListener('click', () => {
    // Use Firebase Auth to create a user
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('name').value;
    if (email.length == 0 || password.length == 0) {
        alert('Please enter an email and password');
        return;
    }
    createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
        // Set user information to Firestore
        const user = userCredential.user;

        // Set default profile photo URL
        const defaultPhotoUrl = 'https://identicons.github.com/jasonlong.png';

        // Create a user profile in Firestore
        setDoc(doc(db, "users", user.uid), {
            username: username,
            photoUrl: defaultPhotoUrl,
            email: email,
        }).then(() => {
            window.location.href = 'sign_in_page.html';
        }).catch((error) => {
            console.log('Error creating user:', error);
        });
    }).catch((error) => {
        console.log('Error creating user:', error);
    });
});
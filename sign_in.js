import { app, auth } from './firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

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
    const user = userCredential.user;
    const userId = user.uid;
    const db = getFirestore(app);
    console.log(userId);
    const docRef = doc(db, "users", userId);
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();

        // Extract username and photoUrl
        const username = userData.username;
        const photoUrl = userData.photoUrl;
        window.electronStore.set('userName', username);
        window.electronStore.set('userPhoto', photoUrl);
        window.location.href = 'index.html';
      } else {
        document.getElementById('login-failed-warning').setAttribute('style', 'display: block;');
      }
    });

    // window.location.href = 'index.html';
  }).catch((error) => {
    document.getElementById('login-failed-warning').setAttribute('style', 'display: block;');
  });
});
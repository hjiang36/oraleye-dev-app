// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCqtLtFhGNsXbJxnFfYov-CVBLX9TRSbY0",
  authDomain: "oraleyedev.firebaseapp.com",
  projectId: "oraleyedev",
  storageBucket: "oraleyedev.appspot.com",
  messagingSenderId: "1046688975280",
  appId: "1:1046688975280:web:fd56a80bdefaac509eee75",
  measurementId: "G-8M7FFBG3BV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Get a reference to the Firebase Auth object
const auth = getAuth(app);

export {app, auth};
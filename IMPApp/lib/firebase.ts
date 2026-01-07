// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB_rJumgvjsWhIy-dMZ5xhgk6-vHOJ-Kbg",
  authDomain: "impapp-d564f.firebaseapp.com",
  projectId: "impapp-d564f",
  storageBucket: "impapp-d564f.firebasestorage.app",
  messagingSenderId: "264171324108",
  appId: "1:264171324108:web:20f0abdcf6103724663869",
  measurementId: "G-41QKRM7JD7"
};

const app = initializeApp(firebaseConfig);

// Use getAuth() without initializeAuth for Expo Go
export const auth = getAuth(app);
export const db = getFirestore(app);
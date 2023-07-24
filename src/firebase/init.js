// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { FacebookAuthProvider, GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyANf6MlTI8O5ERxDyalYf8tUih9eET7fmA",
  authDomain: "rhycon-trades.firebaseapp.com",
  projectId: "rhycon-trades",
  storageBucket: "rhycon-trades.appspot.com",
  messagingSenderId: "411982849288",
  appId: "1:411982849288:web:2f38324cd1fa9c6fe338bd",
  measurementId: "G-H1E6DV9957"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage(app)

export const fAuthProvider = new FacebookAuthProvider() ;
export const googleAuthProvider = new GoogleAuthProvider();

export const googleAuth = () => {
  const gAuth = signInWithPopup(auth, googleAuthProvider)
  return gAuth;
}

export const facebookAuth = () => {
  const fbAuth = signInWithPopup(auth, fAuthProvider);
  return fbAuth;
}
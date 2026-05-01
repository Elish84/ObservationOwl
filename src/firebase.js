import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBfP8VL2dPhXGs_8Nuce5Xik4HjC6sneiE",
  authDomain: "shomron-6aba2.firebaseapp.com",
  projectId: "shomron-6aba2",
  storageBucket: "shomron-6aba2.firebasestorage.app",
  messagingSenderId: "855372671262",
  appId: "1:855372671262:web:b67541955f37c6be37410f",
  measurementId: "G-J53ETYWPTP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'me-west1'); // matched backend region

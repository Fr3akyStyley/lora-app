import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Ovi podaci nisu tajni za web aplikacije — bezbednost se podešava
// preko Firebase Authentication i Firestore pravila pristupa.
const firebaseConfig = {
  apiKey: "AIzaSyDG42_CZoScnpgfAQPJVV8oQ3c4zyabZSg",
  authDomain: "lora-score.firebaseapp.com",
  projectId: "lora-score",
  storageBucket: "lora-score.firebasestorage.app",
  messagingSenderId: "336198548491",
  appId: "1:336198548491:web:8aec9cd76a85f830a05b0e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMQW59pFle0vVp0xotmnpVTYqAlTbdbQQ",
  authDomain: "eco-share-92ef1.firebaseapp.com",
  databaseURL: "https://eco-share-92ef1-default-rtdb.firebaseio.com",
  projectId: "eco-share-92ef1",
  storageBucket: "eco-share-92ef1.firebasestorage.app",
  messagingSenderId: "747419763478",
  appId: "1:747419763478:web:a12bb5f1d9e6fa082c8637",
  measurementId: "G-WX3CXQJGMP",
};

// Initialize the Firebase app
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app); // Firestore

// Initialize auth with React Native persistence only
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const rtdb = getDatabase(app); // Realtime Database

export default app;
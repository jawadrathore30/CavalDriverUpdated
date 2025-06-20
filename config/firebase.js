// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.firebaseApiKey,
  authDomain: Constants.expoConfig.extra.firebaseAuthDomain,
  projectId: Constants.expoConfig.extra.firebaseProjectId,
  storageBucket: Constants.expoConfig.extra.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig.extra.firebaseMessagingSenderId,
  appId: Constants.expoConfig.extra.firebaseAppId,
  measurementId: Constants.expoConfig.extra.firebaseMeasurementId
};

console.log("Firebase config:", {
  apiKey: firebaseConfig.apiKey ? "present" : "missing",
  authDomain: firebaseConfig.authDomain ? "present" : "missing",
  projectId: firebaseConfig.projectId ? "present" : "missing",
  storageBucket: firebaseConfig.storageBucket ? "present" : "missing",
  messagingSenderId: firebaseConfig.messagingSenderId ? "present" : "missing",
  appId: firebaseConfig.appId ? "present" : "missing",
  measurementId: firebaseConfig.measurementId ? "present" : "missing"
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

console.log("Firebase initialization complete");

export { db, auth, storage }; 
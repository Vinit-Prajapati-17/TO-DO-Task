import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCJocw7cvWU0zK4s9zI1kmO0c7i1KvD0UE",
  authDomain: "to-do-task-543f0.firebaseapp.com",
  projectId: "to-do-task-543f0",
  storageBucket: "to-do-task-543f0.firebasestorage.app",
  messagingSenderId: "124024297718",
  appId: "1:124024297718:web:2f3a96174e6707d447f4d7",
  measurementId: "G-ZR92FS96FD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

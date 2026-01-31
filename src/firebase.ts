import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp, writeBatch, getDocs, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyasBGyhfKsWJVeUYAaVDqmPznZo100v0uvg",
  authDomain: "corretorcerto-76933.firebaseapp.com",
  databaseURL: "https://corretorcerto-76933-default-rtdb.firebaseio.com",
  projectId: "corretorcerto-76933",
  storageBucket: "corretorcerto-76933.firebasestorage.app",
  messagingSenderId: "357149829474",
  appId: "1:35714982239474:web:324b232005d8x2eabbce5e43b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Helper para converter timestamps
export const convertTimestamp = (timestamp: any): string => {
  if (!timestamp) return new Date().toLocaleString('pt-BR');
  if (timestamp.toDate) {
    return timestamp.toDate().toLocaleString('pt-BR');
  }
  return new Date(timestamp).toLocaleString('pt-BR');
};

export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  writeBatch,
  getDocs,
  addDoc,
  Timestamp
};

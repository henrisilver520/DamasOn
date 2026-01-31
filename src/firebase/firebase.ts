import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

// Config fornecida pelo usuário (Firebase v8 compat via npm)
const firebaseConfig = {
  apiKey: "AIzaSyCNr5JoKsWJVeUYAaVDqmPznZo100v0uvg",
  authDomain: "corretorcerto-76933.firebaseapp.com",
  databaseURL: "https://corretorcerto-76933-default-rtdb.firebaseio.com",
  projectId: "corretorcerto-76933",
  storageBucket: "corretorcerto-76933.firebasestorage.app",
  messagingSenderId: "357149829474",
  appId: "1:357149829474:web:324b2005d82eabbce5e43b",
};

export const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = firebase.firestore();

export { firebase };

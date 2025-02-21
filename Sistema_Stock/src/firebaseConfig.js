import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyC34xsz6ZdMgFwY_tG6egzXZG-DtYAnpUM",
  authDomain: "control-de-stock-ad426.firebaseapp.com",
  projectId: "control-de-stock-ad426",
  storageBucket: "control-de-stock-ad426.firebasestorage.app",
  messagingSenderId: "241256509463",
  appId: "1:241256509463:web:b50a0292da4481c9816c52"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Función para registrar usuario
const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error en registro:", error.message);
    return null;
  }
};

// Función para iniciar sesión
const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error en login:", error.message);
    return null;
  }
};

// Función para cerrar sesión
const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error cerrando sesión:", error.message);
  }
};

export { auth, db, registerUser, loginUser, logoutUser };
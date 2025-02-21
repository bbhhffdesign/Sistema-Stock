import { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function Auth({ usuario }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registrar = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar el email en Firestore usando el UID del usuario
      await setDoc(doc(db, "usuarios", user.uid), {
        email: user.email
      });

      console.log("Usuario registrado:", user);
    } catch (error) {
      console.error("Error registrando usuario:", error.message);
    }
  };

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error iniciando sesión:", error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error cerrando sesión:", error.message);
    }
  };

  return (
    <div>
      <h2>Autenticación</h2>

      {usuario ? (
        // Si hay usuario, solo mostramos el botón de cerrar sesión
        <button onClick={logout}>Cerrar Sesión</button>
      ) : (
        // Si NO hay usuario, mostramos los campos y botones de login/registro
        <>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={registrar}>Registrar</button>
          <button onClick={login}>Iniciar Sesión</button>
        </>
      )}
    </div>
  );
}

export default Auth;

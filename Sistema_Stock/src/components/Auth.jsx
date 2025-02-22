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
    <div className="auth">
      {!usuario ?  (<h1>Control de Stock</h1>) : null}
     

      {usuario ? (
        <button onClick={logout}>Cerrar Sesión</button>
      ) : (
        <div className="auth__form">
          {!usuario ?  ( <h2>Autenticación</h2>) : null}
          <div className="auth__inputs">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
            {!usuario ? (<p>Inicia sesión para ver tu stock.</p>) : null}
          </div>
          <hr />
          <div className="auth__buttons">
          <button onClick={login}><span>Iniciar Sesión</span></button>
          <button onClick={registrar}><span>Registrarse</span></button>
          </div>
          <div>
       
          </div>
        </div> 
      )}
      <div><p>acá va el fla del copy y la marca </p></div>
   
    </div>
  );
}

export default Auth;

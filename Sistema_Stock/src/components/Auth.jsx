import { useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function Auth({ usuario }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Función para transformar el email en un ID válido
  const transformarEmail = (email) => {
    return email.replace(/[@.]/g, "_"); // Reemplaza "@" y "." por "_"
  };

  const registrar = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const emailTransformado = transformarEmail(user.email);

      // Guardar los datos del usuario en la colección "usuarios" con el email como ID
      await setDoc(doc(db, "usuarios", emailTransformado), {
        usuarioId: user.uid,
        email: user.email,
      });

      console.log("✅ Usuario registrado:", user.email);
    } catch (error) {
      console.error("❌ Error registrando usuario:", error.message);
    }
  };

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("❌ Error iniciando sesión:", error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("❌ Error cerrando sesión:", error.message);
    }
  };

  return (
    <div className={!usuario ? "auth" : "auth auth-sm"}>
      {!usuario ? <h1 className="text-amber-300">Control de Stock</h1> : null}

      {usuario ? (
        <button onClick={logout}>Cerrar Sesión</button>
      ) : (
        <div className="auth__form">
          {!usuario ? <h2 className="text-red-300 text-2xl">Autenticación</h2> : null}
          <div className="auth__inputs">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {!usuario ? <p className="text-green-200">Inicia sesión para ver tu stock.</p> : null}
          </div>
          <hr />
          <div className="auth__buttons">
            <button onClick={login}>
              <span>Iniciar Sesión</span>
            </button>
            <button onClick={registrar}>
              <span>Registrarse</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Auth;
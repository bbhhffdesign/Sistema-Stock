import { useState, useEffect } from "react";
import { db, auth } from "./firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

import Auth from "./components/Auth";
import Distribuidores from "./components/Distribuidores";
import ListaProductos from "./components/ListaProductos";
import FaltantesStock from "./components/FaltantesStock";

function App() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Detectar cambios en la autenticación
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user); // Guardar usuario al iniciar sesión
        await fetchData(user.uid); // Cargar datos de Firebase
      } else {
        setUsuario(null); // Borrar usuario al cerrar sesión
      }
    });

    return () => unsubscribe(); // Limpiar listener cuando se desmonte el componente
  }, []);

  // Cargar datos desde Firestore al iniciar sesión
  const fetchData = async (userId) => {
    try {
      const querySnapshot = await getDocs(
        collection(db, `stocks/${userId}/test`)
      );
      querySnapshot.forEach((doc) => {
        console.log(doc.id, " => ", doc.data());
      });
    } catch (error) {
      console.error("Error conectando a Firestore:", error);
    }
  };

  return (
    <div>
      <h1>Control de Stock</h1>
      <Auth />
      {usuario ? (
        <>
          <Distribuidores />
          <hr />
          <ListaProductos />
          <hr />
          <FaltantesStock />
        </>
      ) : (
        <p>Inicia sesión para ver tu stock.</p>
      )}
    </div>
  );
}

export default App;

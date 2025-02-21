import { useState, useEffect } from "react";
import { db, auth } from "./firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import Auth from "./components/Auth";
import Distribuidores from "./components/Distribuidores";
import ListaProductos from "./components/ListaProductos";
import FaltantesStock from "./components/FaltantesStock";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [componenteActivo, setComponenteActivo] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user);
        await fetchData(user.uid);
      } else {
        setUsuario(null);
        setComponenteActivo(null); //Oculto el componete si no hay usuario activo 
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async (userId) => {
    try {
      const querySnapshot = await getDocs(collection(db, `stocks/${userId}/test`));
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
      <Auth usuario={usuario} />

      {usuario ? (
        <>
          <div>
            <button onClick={() => setComponenteActivo(componenteActivo === "distribuidores" ? null : "distribuidores")}>
              Distribuidores
            </button>
            <button onClick={() => setComponenteActivo(componenteActivo === "productos" ? null : "productos")}>
              Lista de Productos
            </button>
            <button onClick={() => setComponenteActivo(componenteActivo === "faltantes" ? null : "faltantes")}>
              Faltantes de Stock
            </button>
          </div>

          <hr />
          {componenteActivo === "distribuidores" && <Distribuidores />}
          {componenteActivo === "productos" && <ListaProductos />}
          {componenteActivo === "faltantes" && <FaltantesStock />}
        </>
      ) : (
        <p>Inicia sesión para ver tu stock.</p>
      )}
    </div>
  );
}

export default App;

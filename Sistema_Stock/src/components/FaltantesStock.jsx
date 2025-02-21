import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, onSnapshot, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function FaltantesStock() {
  const [productosFaltantes, setProductosFaltantes] = useState([]);
  const [distribuidores, setDistribuidores] = useState({});
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (usuario) {
      obtenerDistribuidores(usuario.uid);
      obtenerProductosFaltantes(usuario.uid);
    } else {
      setProductosFaltantes([]);
      setDistribuidores({});
    }
  }, [usuario]);

  const obtenerDistribuidores = async (userId) => {
    const distribuidoresRef = collection(db, `stocks/${userId}/distribuidores`);
    const snapshot = await getDocs(distribuidoresRef);
    const distData = {};

    snapshot.forEach((doc) => {
      distData[doc.id] = {
        nombre: doc.data().nombre,
        color: doc.data().color,
      };
    });

    setDistribuidores(distData);
  };

  const obtenerProductosFaltantes = (userId) => {
    const productosRef = collection(db, `stocks/${userId}/productos`);
    const q = query(productosRef);

    return onSnapshot(q, async (querySnapshot) => {
      const productosFaltantesTemp = [];

      for (const productoDoc of querySnapshot.docs) {
        const producto = productoDoc.data();

        if (producto.cantidadActual < producto.cantidadDeseada) {
          const distribuidorRef = doc(db, `stocks/${userId}/distribuidores`, producto.distribuidorId);
          const distribuidorSnap = await getDoc(distribuidorRef);
          const distribuidorNombre = distribuidorSnap.exists() ? distribuidorSnap.data().nombre : "Desconocido";

          productosFaltantesTemp.push({
            nombre: producto.nombre,
            faltante: producto.cantidadDeseada - producto.cantidadActual,
            distribuidorId: producto.distribuidorId,
            distribuidorNombre,
          });
        }
      }

      //acá ordeno los porductos por distribuidor
      productosFaltantesTemp.sort((a, b) => a.distribuidorNombre.localeCompare(b.distribuidorNombre));

      setProductosFaltantes(productosFaltantesTemp);
    });
  };

  return (
    <div>
      <h2>Productos Faltantes de Stock</h2>
      <table border="1">
        <thead>
          <tr>
            <th>Distribuidor</th>
            <th>Nombre Producto</th>
            <th>Faltante</th>
          </tr>
        </thead>
        <tbody>
          {productosFaltantes.length === 0 ? (
            <tr>
              <td colSpan="3">No hay productos faltantes.</td>
            </tr>
          ) : (
            productosFaltantes.map((producto, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: distribuidores[producto.distribuidorId]?.color || "white",
                }}
              >
                <td>{producto.distribuidorNombre}</td>
                <td>{producto.nombre}</td>
                <td>{producto.faltante}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default FaltantesStock;

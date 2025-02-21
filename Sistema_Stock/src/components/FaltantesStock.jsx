import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function FaltantesStock() {
  const [productosFaltantes, setProductosFaltantes] = useState([]);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (usuario) {
      obtenerProductosFaltantes(usuario.uid);
    } else {
      setProductosFaltantes([]); // Si no hay usuario, limpiar los productos faltantes
    }
  }, [usuario]); // Se ejecuta cuando cambia el usuario

  const obtenerProductosFaltantes = (userId) => {
    const productosRef = collection(db, `stocks/${userId}/productos`);
    const q = query(productosRef);

    return onSnapshot(q, (querySnapshot) => {
      const productosFaltantesTemp = [];

      querySnapshot.forEach((productoDoc) => {
        const producto = productoDoc.data();

        if (producto.cantidadActual !== undefined && producto.cantidadDeseada !== undefined) {
          if (producto.cantidadActual < producto.cantidadDeseada) {
            productosFaltantesTemp.push({
              nombre: producto.nombre,
              faltante: producto.cantidadDeseada - producto.cantidadActual,
            });
          }
        }
      });

      setProductosFaltantes(productosFaltantesTemp);
    });
  };

  return (
    <div>
      <h2>Productos Faltantes de Stock</h2>
      <table border="1">
        <thead>
          <tr>
            <th>Nombre Producto</th>
            <th>Faltante</th>
          </tr>
        </thead>
        <tbody>
          {productosFaltantes.length === 0 ? (
            <tr>
              <td colSpan="2">No hay productos faltantes.</td>
            </tr>
          ) : (
            productosFaltantes.map((producto, index) => (
              <tr key={index}>
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

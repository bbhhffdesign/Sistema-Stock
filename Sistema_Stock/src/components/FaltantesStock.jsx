import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, onSnapshot, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function FaltantesStock() {
  const [productosFaltantes, setProductosFaltantes] = useState([]);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      if (user) {
        obtenerProductosFaltantes(user.uid); // Traer productos faltantes si el usuario está logueado
      } else {
        setProductosFaltantes([]); // Limpiar productos faltantes si el usuario no está logueado
      }
    });

    return () => unsubscribeAuth(); // Limpiar la suscripción al cambiar el estado del usuario
  }, []);

  // Función para obtener los productos faltantes
  const obtenerProductosFaltantes = async (userId) => {
    const distribuidorRef = collection(db, `stocks/${userId}/distribuidores`);
    const q = query(distribuidorRef);

    // Escuchar en tiempo real los cambios en los distribuidores
    onSnapshot(q, async (querySnapshot) => {
      const productosFaltantesTemp = [];

      // Iterar sobre los distribuidores
      for (const distDoc of querySnapshot.docs) {
        const distribuidor = distDoc.data();
        const productosRef = collection(db, `stocks/${userId}/distribuidores/${distDoc.id}/productos`);
        
        // Obtener todos los productos del distribuidor
        const productosSnapshot = await getDocs(productosRef);

        // Filtrar productos faltantes
        productosSnapshot.forEach((productoDoc) => {
          const producto = productoDoc.data();
          
          // Asegurémonos de que los campos cantidadActual y cantidadDeseada existen
          if (producto.cantidadActual !== undefined && producto.cantidadDeseada !== undefined) {
            if (producto.cantidadActual < producto.cantidadDeseada) {
              const faltante = producto.cantidadDeseada - producto.cantidadActual;
              productosFaltantesTemp.push({
                nombre: producto.nombre,
                faltante: faltante,
                color: distribuidor.color, // Asignamos el color del distribuidor
              });
            }
          }
        });
      }

      // Actualizamos el estado con los productos faltantes
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
              <tr key={index} style={{ backgroundColor: producto.color }}>
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

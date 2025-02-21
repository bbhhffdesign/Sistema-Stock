import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function ListaProductos() {
  const [productos, setProductos] = useState([]);
  const [distribuidores, setDistribuidores] = useState([]);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      if (user) {
        escucharDistribuidores(user.uid);
        escucharProductos(user.uid);
      } else {
        setDistribuidores([]);
        setProductos([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 🔹 Escuchar cambios en la colección de distribuidores en tiempo real
  const escucharDistribuidores = (userId) => {
    const q = query(collection(db, `stocks/${userId}/distribuidores`));
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDistribuidores(data);
    });
  };

  // 🔹 Escuchar cambios en la colección de productos en tiempo real
  const escucharProductos = (userId) => {
    const q = query(collection(db, `stocks/${userId}/productos`));
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProductos(data);
    });
  };

  // Modificar cantidad actual
  const modificarCantidad = async (id, nuevaCantidad) => {
    if (nuevaCantidad < 0 || !Number.isInteger(nuevaCantidad)) return;
    try {
      const productoRef = doc(db, `stocks/${usuario.uid}/productos`, id);
      await updateDoc(productoRef, { cantidadActual: nuevaCantidad });
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
    }
  };

  return (
    <div>
      <h2>Lista de Productos</h2>
      {distribuidores.map((dist) => (
        <div key={dist.id}>
          <h3 style={{ backgroundColor: dist.color, padding: "5px", color: "#fff" }}>
            {dist.nombre}
          </h3>
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Deseado</th>
                <th>Actual</th>
              </tr>
            </thead>
            <tbody>
              {productos
                .filter((prod) => prod.distribuidorId === dist.id)
                .map((prod) => (
                  <tr key={prod.id} style={{ backgroundColor: dist.color + "20" }}>
                    <td>{prod.nombre}</td>
                    <td>{prod.cantidadDeseada}</td>
                    <td>
                      <button onClick={() => modificarCantidad(prod.id, prod.cantidadActual - 1)}>
                        -
                      </button>
                      <input
                        type="number"
                        value={prod.cantidadActual}
                        onChange={(e) => modificarCantidad(prod.id, parseInt(e.target.value))}
                        min="0"
                      />
                      <button onClick={() => modificarCantidad(prod.id, prod.cantidadActual + 1)}>
                        +
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default ListaProductos;

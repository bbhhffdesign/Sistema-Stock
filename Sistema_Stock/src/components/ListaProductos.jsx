import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
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

  const escucharDistribuidores = (userId) => {
    const q = query(collection(db, `stocks/${userId}/distribuidores`));
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDistribuidores(data);
    });
  };

  const escucharProductos = (userId) => {
    const q = query(collection(db, `stocks/${userId}/productos`));
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProductos(data);
    });
  };

  const modificarCantidad = async (id, nuevaCantidad) => {
    if (nuevaCantidad < 0 || !Number.isInteger(nuevaCantidad)) return;
    try {
      const productoRef = doc(db, `stocks/${usuario.uid}/productos`, id);
      await updateDoc(productoRef, { cantidadActual: nuevaCantidad });
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
    }
  };

  const editarProducto = async (id, nuevoNombre, nuevaCantidadDeseada) => {
    try {
      const productoRef = doc(db, `stocks/${usuario.uid}/productos`, id);
      await updateDoc(productoRef, { nombre: nuevoNombre, cantidadDeseada: nuevaCantidadDeseada });
    } catch (error) {
      console.error("Error al editar producto:", error);
    }
  };

  const eliminarProducto = async (id) => {
    const confirmar = window.confirm("¿Seguro que quieres eliminar este producto?");
    if (!confirmar) return;

    try {
      const productoRef = doc(db, `stocks/${usuario.uid}/productos`, id);
      await deleteDoc(productoRef);
    } catch (error) {
      console.error("Error eliminando producto:", error);
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
                <th>Cantidad Deseada</th>
                <th>Cantidad Actual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos
                .filter((prod) => prod.distribuidorId === dist.id)
                .map((prod) => (
                  <tr key={prod.id} style={{ backgroundColor: dist.color + "20" }}>
                    <td>
                      <input
                        type="text"
                        value={prod.nombre}
                        disabled={!prod.editando} // Habilitar solo si está editando
                        onChange={(e) => {
                          const nuevoNombre = e.target.value;
                          setProductos((prevProductos) =>
                            prevProductos.map((p) =>
                              p.id === prod.id ? { ...p, nombre: nuevoNombre } : p
                            )
                          );
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={prod.cantidadDeseada}
                        disabled={!prod.editando} // Habilitar solo si está editando
                        onChange={(e) => {
                          const nuevaCantidadDeseada = parseInt(e.target.value);
                          setProductos((prevProductos) =>
                            prevProductos.map((p) =>
                              p.id === prod.id ? { ...p, cantidadDeseada: nuevaCantidadDeseada } : p
                            )
                          );
                        }}
                      />
                    </td>
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
                    <td>
                      <button
                        onClick={() => {
                          if (prod.editando) {
                            // Si estamos editando, guardamos la información
                            editarProducto(prod.id, prod.nombre, prod.cantidadDeseada);
                          }
                          // Cambiar estado de edición
                          setProductos((prevProductos) =>
                            prevProductos.map((p) =>
                              p.id === prod.id ? { ...p, editando: !p.editando } : p
                            )
                          );
                        }}
                      >
                        {prod.editando ? "Guardar" : "Editar"}
                      </button>
                      <button onClick={() => eliminarProducto(prod.id)}>🗑️</button>
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

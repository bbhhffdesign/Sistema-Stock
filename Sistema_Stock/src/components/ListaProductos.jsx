import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, onSnapshot, updateDoc, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function ListaProductos() {
  const [distribuidores, setDistribuidores] = useState([]);
  const [productos, setProductos] = useState({});
  const [usuario, setUsuario] = useState(null);
  const [modoEdicion, setModoEdicion] = useState({}); // Guarda qué productos están en edición

  // Función para transformar el email en un ID válido
  const transformarEmail = (email) => email.replace(/[@.]/g, "_");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userId = transformarEmail(user.email);
        setUsuario(user);
        escucharDistribuidores(userId);
      } else {
        setDistribuidores([]);
        setProductos({});
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const escucharDistribuidores = (userId) => {
    const q = query(collection(db, `stocks/${userId}/distribuidores`));
    return onSnapshot(q, (querySnapshot) => {
      const distribs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDistribuidores(distribs);

      distribs.forEach((dist) => escucharProductos(userId, dist.id));
    });
  };

  const escucharProductos = (userId, distribuidorId) => {
    const q = query(collection(db, `stocks/${userId}/distribuidores/${distribuidorId}/productos`));
    return onSnapshot(q, (querySnapshot) => {
      setProductos((prevProductos) => ({
        ...prevProductos,
        [distribuidorId]: querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      }));
    });
  };

  const modificarCantidad = async (distribuidorId, productoId, nuevaCantidad) => {
    if (nuevaCantidad < 0 || !Number.isInteger(nuevaCantidad) || !usuario) return;

    try {
      const userId = transformarEmail(usuario.email);
      const productoRef = doc(db, `stocks/${userId}/distribuidores/${distribuidorId}/productos`, productoId);
      await updateDoc(productoRef, { cantidadActual: nuevaCantidad });
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
    }
  };

  const habilitarEdicion = (distribuidorId, producto) => {
    setModoEdicion((prev) => ({
      ...prev,
      [`${distribuidorId}-${producto.id}`]: { ...producto }, // Guarda los valores originales para editar
    }));
  };

  const manejarCambio = (distribuidorId, productoId, campo, valor) => {
    setModoEdicion((prev) => ({
      ...prev,
      [`${distribuidorId}-${productoId}`]: {
        ...prev[`${distribuidorId}-${productoId}`],
        [campo]: valor,
      },
    }));
  };

  const guardarEdicion = async (distribuidorId, productoId) => {
    if (!usuario || !modoEdicion[`${distribuidorId}-${productoId}`]) return;

    try {
      const userId = transformarEmail(usuario.email);
      const productoRef = doc(db, `stocks/${userId}/distribuidores/${distribuidorId}/productos`, productoId);
      await updateDoc(productoRef, {
        nombre: modoEdicion[`${distribuidorId}-${productoId}`].nombre,
        cantidadDeseada: Number(modoEdicion[`${distribuidorId}-${productoId}`].cantidadDeseada),
      });

      setModoEdicion((prev) => {
        const nuevoEstado = { ...prev };
        delete nuevoEstado[`${distribuidorId}-${productoId}`];
        return nuevoEstado;
      });
    } catch (error) {
      console.error("Error al guardar la edición:", error);
    }
  };

  const registrarPedido = (dist) => {
    const fechaActual = new Date().toLocaleString(); // Fecha actual
    let mensaje = `${fechaActual}\n${dist.nombre}\n`;
  
    // Verificamos los productos con faltantes (cantidad actual < cantidad deseada)
    productos[dist.id]?.forEach((prod) => {
      const diferencia = prod.cantidadDeseada - prod.cantidadActual;
      if (diferencia > 0) { // Solo si la diferencia es mayor a 0
        mensaje += `${prod.nombre}   ${diferencia}\n`;
      }
    });
  
    console.log(mensaje);
  };
  return (
    <div>
      <h2>Lista de Productos</h2>
      {distribuidores.map((dist) => (
        <div key={dist.id}>
          <h3 style={{ backgroundColor: dist.color, padding: "10px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {dist.nombre}
            <button onClick={() => registrarPedido(dist)}>Registrar Pedido</button>
          </h3>

          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Deseado</th>
                <th>Actual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos[dist.id]?.map((prod) => (
                <tr key={prod.id} style={{ backgroundColor: dist.color + "20" }}>
                  <td>
                    {modoEdicion[`${dist.id}-${prod.id}`] ? (
                      <input
                        type="text"
                        value={modoEdicion[`${dist.id}-${prod.id}`].nombre}
                        onChange={(e) => manejarCambio(dist.id, prod.id, "nombre", e.target.value)}
                      />
                    ) : (
                      prod.nombre
                    )}
                  </td>
                  <td>
                    {modoEdicion[`${dist.id}-${prod.id}`] ? (
                      <input
                        type="number"
                        value={modoEdicion[`${dist.id}-${prod.id}`].cantidadDeseada}
                        onChange={(e) => manejarCambio(dist.id, prod.id, "cantidadDeseada", e.target.value)}
                        min="0"
                      />
                    ) : (
                      prod.cantidadDeseada
                    )}
                  </td>
                  <td>
                    <button onClick={() => modificarCantidad(dist.id, prod.id, prod.cantidadActual - 1)}>-</button>
                    <input
                      type="number"
                      value={prod.cantidadActual}
                      onChange={(e) => modificarCantidad(dist.id, prod.id, parseInt(e.target.value))}
                      min="0"
                      disabled
                    />
                    <button onClick={() => modificarCantidad(dist.id, prod.id, prod.cantidadActual + 1)}>+</button>
                  </td>
                  <td>
                    {modoEdicion[`${dist.id}-${prod.id}`] ? (
                      <button onClick={() => guardarEdicion(dist.id, prod.id)}>💾 Guardar</button>
                    ) : (
                      <button onClick={() => habilitarEdicion(dist.id, prod)}>✏️ Editar</button>
                    )}
                    <button onClick={() => console.log("Eliminar", prod.id)}>🗑️</button>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="4">No hay productos en este distribuidor.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default ListaProductos;

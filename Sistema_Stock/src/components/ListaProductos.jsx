import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, onSnapshot, updateDoc, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function ListaProductos() {
  const [distribuidores, setDistribuidores] = useState([]);
  const [productos, setProductos] = useState({});
  const [usuario, setUsuario] = useState(null);
  const [modoEdicion, setModoEdicion] = useState({});

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

  const registrarPedido = async (dist) => {
    const fecha = new Date();
    const fechaFormato = `${fecha.getDate()}_${fecha.getMonth() + 1}_${fecha.getFullYear()}`;
    const fechaMostrar = fecha.toLocaleString();
    const pedidoId = `${dist.nombre} ${fechaFormato}`;

    let productosFaltantes = {};

    productos[dist.id]?.forEach((prod) => {
      const diferencia = prod.cantidadDeseada - prod.cantidadActual;
      if (diferencia > 0) {
        productosFaltantes[prod.nombre] = diferencia;
      }
    });

    console.log(fechaMostrar, dist.nombre, productosFaltantes);

    if (usuario) {
      const userId = transformarEmail(usuario.email);
      const pedidosRef = collection(db, `stocks/${userId}/pedidos`);

      try {
        await setDoc(doc(pedidosRef, pedidoId), productosFaltantes);
        console.log("Pedido registrado con éxito en la base de datos.");
      } catch (error) {
        console.error("Error al guardar el pedido:", error);
      }
    }
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
                  <td>{prod.nombre}</td>
                  <td>{prod.cantidadDeseada}</td>
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

import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, query, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function Productos() {
  const [nombre, setNombre] = useState("");
  const [cantidadDeseada, setCantidadDeseada] = useState(1);
  const [distribuidorId, setDistribuidorId] = useState("");
  const [distribuidores, setDistribuidores] = useState([]);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      if (user) {
        escucharDistribuidores(user.uid);
      } else {
        setDistribuidores([]);
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

  const agregarProducto = async () => {
    if (!nombre.trim() || !distribuidorId) return alert("Faltan datos");

    try {
      await addDoc(collection(db, `stocks/${usuario.uid}/productos`), {
        nombre,
        cantidadDeseada: parseInt(cantidadDeseada),
        cantidadActual: 0,
        distribuidorId,
      });

      // Limpiar formulario
      setNombre("");
      setCantidadDeseada(1);
      setDistribuidorId("");
    } catch (error) {
      console.error("Error agregando producto:", error);
    }
  };

  return (
    <div>
      <h2>Agregar Producto</h2>
      <input
        type="text"
        placeholder="Nombre del producto"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <input
        type="number"
        min="1"
        value={cantidadDeseada}
        onChange={(e) => setCantidadDeseada(parseInt(e.target.value))}
      />
      <select value={distribuidorId} onChange={(e) => setDistribuidorId(e.target.value)}>
        <option value="">Selecciona un distribuidor</option>
        {distribuidores.map((dist) => (
          <option key={dist.id} value={dist.id}>
            {dist.nombre}
          </option>
        ))}
      </select>
      <button onClick={agregarProducto}>Agregar</button>
    </div>
  );
}

export default Productos;

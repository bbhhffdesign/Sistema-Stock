import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Productos from "./Productos";

function Distribuidores() {
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#000000");
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

  const escucharDistribuidores = (userId) => {
    const q = query(collection(db, `stocks/${userId}/distribuidores`));
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDistribuidores(data);
    });
  };

  const agregarDistribuidor = async () => {
    if (!nombre.trim()) return alert("El nombre no puede estar vacío");

    try {
      await addDoc(collection(db, `stocks/${usuario.uid}/distribuidores`), {
        nombre,
        color,
      });

      setNombre("");
      setColor("#000000");
    } catch (error) {
      console.error("Error agregando distribuidor:", error);
    }
  };

  const editarDistribuidor = async (id, nuevoNombre) => {
    if (!nuevoNombre.trim()) return;

    try {
      const distribuidorRef = doc(db, `stocks/${usuario.uid}/distribuidores`, id);
      await updateDoc(distribuidorRef, { nombre: nuevoNombre });
    } catch (error) {
      console.error("Error editando distribuidor:", error);
    }
  };

  const actualizarColor = async (id, nuevoColor) => {
    try {
      const distribuidorRef = doc(db, `stocks/${usuario.uid}/distribuidores`, id);
      await updateDoc(distribuidorRef, { color: nuevoColor });

      // Actualizar estado localmente
      setDistribuidores((prevDistribuidores) =>
        prevDistribuidores.map((dist) =>
          dist.id === id ? { ...dist, color: nuevoColor } : dist
        )
      );
    } catch (error) {
      console.error("Error actualizando color:", error);
    }
  };

  const eliminarDistribuidor = async (id) => {
    const confirmar = window.confirm("¿Seguro que quieres eliminar este distribuidor?");
    if (!confirmar) return;

    try {
      const distribuidorRef = doc(db, `stocks/${usuario.uid}/distribuidores`, id);
      await deleteDoc(distribuidorRef);
    } catch (error) {
      console.error("Error eliminando distribuidor:", error);
    }
  };

  return (
    <div>
      <h2>Distribuidores</h2>
      <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      <button onClick={agregarDistribuidor}>Agregar</button>
      <Productos />

      <ul>
        {distribuidores.map((dist) => (
          <li key={dist.id} style={{ backgroundColor: dist.color, padding: "10px", margin: "5px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{dist.nombre}</span>

            {/* Input para cambiar color */}

            <div>
            <input
              type="color"
              value={dist.color}
              onChange={(e) => actualizarColor(dist.id, e.target.value)}
            />
              <button onClick={() => {
                const nuevoNombre = prompt("Nuevo nombre:", dist.nombre);
                if (nuevoNombre !== null) editarDistribuidor(dist.id, nuevoNombre);
              }}>✏️</button>
              <button onClick={() => eliminarDistribuidor(dist.id)}>🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Distribuidores;

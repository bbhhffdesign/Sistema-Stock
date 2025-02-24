import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, setDoc, updateDoc, deleteDoc, doc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Productos from "./Productos";

function Distribuidores() {
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#000000");
  const [distribuidores, setDistribuidores] = useState([]);
  const [usuario, setUsuario] = useState(null);

  // Función para transformar el email y el nombre en IDs válidos
  const transformarEmail = (email) => email.replace(/[@.]/g, "_");
  const transformarNombre = (nombre) => nombre.trim().toLowerCase().replace(/\s+/g, "_"); // Convierte espacios en "_"

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      if (user) {
        const emailTransformado = transformarEmail(user.email);
        escucharDistribuidores(emailTransformado);
      } else {
        setDistribuidores([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const escucharDistribuidores = (email) => {
    const q = query(collection(db, `stocks/${email}/distribuidores`));
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDistribuidores(data);
    });
  };

  const agregarDistribuidor = async () => {
    if (!nombre.trim()) return alert("El nombre no puede estar vacío");
    if (!usuario) return alert("Usuario no autenticado");

    try {
      const emailTransformado = transformarEmail(usuario.email);
      const distribuidorId = transformarNombre(nombre); // Usamos el nombre como ID único

      const distribuidorRef = doc(db, `stocks/${emailTransformado}/distribuidores`, distribuidorId);
      
      await setDoc(distribuidorRef, { 
        nombre, 
        color 
      });

      setNombre("");
      setColor("#000000");
    } catch (error) {
      console.error("Error agregando distribuidor:", error);
    }
  };

  const editarDistribuidor = async (id, nuevoNombre) => {
    if (!nuevoNombre.trim() || !usuario) return;

    try {
      const emailTransformado = transformarEmail(usuario.email);
      const distribuidorRef = doc(db, `stocks/${emailTransformado}/distribuidores`, id);
      await updateDoc(distribuidorRef, { nombre: nuevoNombre });
    } catch (error) {
      console.error("Error editando distribuidor:", error);
    }
  };

  const actualizarColor = async (id, nuevoColor) => {
    if (!usuario) return;

    try {
      const emailTransformado = transformarEmail(usuario.email);
      const distribuidorRef = doc(db, `stocks/${emailTransformado}/distribuidores`, id);
      await updateDoc(distribuidorRef, { color: nuevoColor });

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
    if (!usuario) return;
    const confirmar = window.confirm("¿Seguro que quieres eliminar este distribuidor y todos sus productos?");
    if (!confirmar) return;

    try {
      const emailTransformado = transformarEmail(usuario.email);

      // Eliminar productos asociados al distribuidor
      const productosRef = collection(db, `stocks/${emailTransformado}/productos`);
      const productosQuery = query(productosRef, where("distribuidorId", "==", id));
      const productosSnapshot = await getDocs(productosQuery);
      const deletePromises = productosSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Eliminar el distribuidor después de eliminar los productos
      const distribuidorRef = doc(db, `stocks/${emailTransformado}/distribuidores`, id);
      await deleteDoc(distribuidorRef);

      console.log("Distribuidor y productos eliminados correctamente");
    } catch (error) {
      console.error("Error eliminando distribuidor y productos:", error);
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

import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, setDoc, updateDoc, deleteDoc, doc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function Productos() {
  const [productos, setProductos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [cantidadDeseada, setCantidadDeseada] = useState(0);
  const [distribuidorId, setDistribuidorId] = useState("");
  const [distribuidores, setDistribuidores] = useState([]);
  const [usuario, setUsuario] = useState(null);

  // Función para transformar email y nombres en IDs válidos
  const transformarEmail = (email) => email.replace(/[@.]/g, "_");
  const transformarNombre = (nombre) => nombre.trim().toLowerCase().replace(/\s+/g, "_"); // Convierte espacios en "_"

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      if (user) {
        const emailTransformado = transformarEmail(user.email);
        escucharProductos(emailTransformado);
        escucharDistribuidores(emailTransformado);
      } else {
        setProductos([]);
        setDistribuidores([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const escucharProductos = (userId) => {
    const distribuidorRef = collection(db, `stocks/${userId}/distribuidores`);
  
    return onSnapshot(distribuidorRef, (querySnapshot) => {
      let productosMapeados = [];
  
      querySnapshot.forEach((distribuidorDoc) => {
        const productosRef = collection(db, `stocks/${userId}/distribuidores/${distribuidorDoc.id}/productos`);
        
        onSnapshot(productosRef, (productosSnapshot) => {
          const productos = productosSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            distribuidorId: distribuidorDoc.id,
          }));
  
          productosMapeados = [...productosMapeados, ...productos];
          setProductos(productosMapeados);
        });
      });
    });
  };

  const escucharDistribuidores = (email) => {
    const q = query(collection(db, `stocks/${email}/distribuidores`));
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDistribuidores(data);
    });
  };

  const agregarProducto = async () => {
    if (!nombre.trim() || !distribuidorId || cantidadDeseada <= 0) {
      return alert("Completa todos los campos correctamente.");
    }
    if (!usuario) return alert("Usuario no autenticado");
  
    try {
      const emailTransformado = transformarEmail(usuario.email);
      const productoId = transformarNombre(nombre); // ID basado en el nombre
  
      // Referencia a la subcolección "productos" dentro del distribuidor
      const productoRef = doc(db, `stocks/${emailTransformado}/distribuidores/${distribuidorId}/productos`, productoId);
      
      await setDoc(productoRef, {
        nombre,
        cantidadDeseada,
        cantidadActual: 0, // Por defecto inicia en 0
        distribuidorId
      });
  
      setNombre("");
      setCantidadDeseada(1);
      setDistribuidorId("");
    } catch (error) {
      console.error("Error agregando producto:", error);
    }
  };
  

  const eliminarProducto = async (id) => {
    if (!usuario) return;
    const confirmar = window.confirm("¿Seguro que quieres eliminar este producto?");
    if (!confirmar) return;

    try {
      const emailTransformado = transformarEmail(usuario.email);
      const productoRef = doc(db, `stocks/${emailTransformado}/productos`, id);
      await deleteDoc(productoRef);
      console.log("Producto eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando producto:", error);
    }
  };

  return (
    <div>
      <h2>Productos</h2>
      <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <input type="number" placeholder="Cantidad deseada" value={cantidadDeseada} onChange={(e) => setCantidadDeseada(e.target.value)} />

      <select value={distribuidorId} onChange={(e) => setDistribuidorId(e.target.value)}>
        <option value="">Selecciona un distribuidor</option>
        {distribuidores.map((dist) => (
          <option key={dist.id} value={dist.id}>
            {dist.nombre}
          </option>
        ))}
      </select>

      <button onClick={agregarProducto}>Agregar Producto</button>
    </div>
  );
}

export default Productos;

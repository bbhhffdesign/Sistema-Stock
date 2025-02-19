import React, { useState } from "react";

const App = () => {
  const [distribuidores, setDistribuidores] = useState([]);
  const [nuevoDistribuidor, setNuevoDistribuidor] = useState("");
  const [mostrarProductosFaltantes, setMostrarProductosFaltantes] = useState(false);

  const agregarDistribuidor = () => {
    if (!nuevoDistribuidor.trim()) return;
    setDistribuidores([...distribuidores, { name: nuevoDistribuidor, items: [] }]);
    setNuevoDistribuidor("");
  };

  const agregarProducto = (index, producto) => {
    const nuevosDistribuidores = [...distribuidores];
    nuevosDistribuidores[index].items.push({
      ...producto,
      isDesiredQuantity: producto.quantity >= producto.desiredQuantity
    });
    setDistribuidores(nuevosDistribuidores);
  };

  const actualizarCantidad = (dIndex, pIndex, nuevaCantidad) => {
    const nuevosDistribuidores = [...distribuidores];
    const producto = nuevosDistribuidores[dIndex].items[pIndex];
    producto.quantity = nuevaCantidad;
    producto.isDesiredQuantity = nuevaCantidad >= producto.desiredQuantity;
    setDistribuidores(nuevosDistribuidores);
  };

  const productosFaltantes = distribuidores.flatMap((distribuidor, dIndex) =>
    distribuidor.items
      .filter((producto) => producto.quantity < producto.desiredQuantity)
      .map((producto) => ({
        ...producto,
        distribuidor: distribuidor.name,
        pedir: producto.desiredQuantity - producto.quantity
      }))
  );

  return (
    <div>
      <h2>Gestión de Stock</h2>

      {/* Agregar Distribuidor */}
      <div>
        <input
          type="text"
          value={nuevoDistribuidor}
          onChange={(e) => setNuevoDistribuidor(e.target.value)}
          placeholder="Nombre del distribuidor"
        />
        <button onClick={agregarDistribuidor}>Agregar Distribuidor</button>
      </div>

      {/* Listado de Distribuidores */}
      {distribuidores.map((distribuidor, dIndex) => (
        <div key={dIndex}>
          <h3>{distribuidor.name}</h3>
          <FormularioProducto distribuidorIndex={dIndex} agregarProducto={agregarProducto} />
          
          {distribuidor.items.length > 0 && (
            <table border="1">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Cantidad Deseada</th>
                  <th>Actualizar</th>
                </tr>
              </thead>
              <tbody>
                {distribuidor.items.map((producto, pIndex) => (
                  <tr key={pIndex}>
                    <td>{producto.name}</td>
                    <td>${producto.price}</td>
                    <td>
                      <input
                        type="number"
                        value={producto.quantity}
                        onChange={(e) => actualizarCantidad(dIndex, pIndex, Number(e.target.value))}
                      />
                    </td>
                    <td>{producto.desiredQuantity}</td>
                    <td>{producto.isDesiredQuantity ? "✔️" : "❌"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {/* Botón para mostrar productos faltantes */}
      <button onClick={() => setMostrarProductosFaltantes(!mostrarProductosFaltantes)}>
        {mostrarProductosFaltantes ? "Ocultar Productos Faltantes" : "Mostrar Productos Faltantes"}
      </button>

      {/* Productos Faltantes */}
      {mostrarProductosFaltantes && productosFaltantes.length > 0 && (
        <div>
          <h3>Productos Faltantes</h3>
          <table border="1">
            <thead>
              <tr>
                <th>Distribuidor</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Cantidad Deseada</th>
                <th>Pedir</th>
              </tr>
            </thead>
            <tbody>
              {productosFaltantes.map((producto, index) => (
                <tr key={index}>
                  <td>{producto.distribuidor}</td>
                  <td>{producto.name}</td>
                  <td>{producto.quantity}</td>
                  <td>{producto.desiredQuantity}</td>
                  <td>{producto.pedir}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const FormularioProducto = ({ distribuidorIndex, agregarProducto }) => {
  const [producto, setProducto] = useState({
    name: "",
    price: "",
    quantity: "",
    desiredQuantity: ""
  });

  const handleChange = e => {
    setProducto({ ...producto, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!producto.name.trim() || producto.price === "" || producto.quantity === "" || producto.desiredQuantity === "") return;

    agregarProducto(distribuidorIndex, {
      ...producto,
      price: Number(producto.price),
      quantity: Number(producto.quantity),
      desiredQuantity: Number(producto.desiredQuantity)
    });

    setProducto({ name: "", price: "", quantity: "", desiredQuantity: "" });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="name" value={producto.name} onChange={handleChange} placeholder="Nombre del producto" />
      <input type="number" name="price" value={producto.price} onChange={handleChange} placeholder="Precio" />
      <input type="number" name="quantity" value={producto.quantity} onChange={handleChange} placeholder="Cantidad" />
      <input type="number" name="desiredQuantity" value={producto.desiredQuantity} onChange={handleChange} placeholder="Cantidad Deseada" />
      <button type="submit">Agregar Producto</button>
    </form>
  );
};

export default App;

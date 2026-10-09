import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import BottomNav from "../components/BottomNav";
import { db } from "../database/db";

export default function ScreenCategories({ onNav }: { onNav: (i: number) => void }) {
  const [listaCategorias, setListaCategorias] = useState<any[]>([]);
  const [enAlerta, setEnAlerta] = useState(0);
  const [sobrepasadas, setSobrepasadas] = useState(0);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [idEditar, setIdEditar] = useState(0);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [iconoNuevo, setIconoNuevo] = useState("");
  const [limiteNuevo, setLimiteNuevo] = useState("");

  const cargarCategorias = () => {
    if (!db) {
      setListaCategorias([]);
      return;
    }

    db.execSync('CREATE TABLE IF NOT EXISTS categorias (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, icono TEXT, limite TEXT, color TEXT);');
    db.execSync('CREATE TABLE IF NOT EXISTS gastos (id INTEGER PRIMARY KEY AUTOINCREMENT, monto TEXT, categoria TEXT, icono TEXT);');

// Se usa 'as any[]' para omitir la validación estricta, ya que SQLite devuelve tipos 'unknown' por defecto.
    let categoriasDB = db.getAllSync('SELECT * FROM categorias ORDER BY id ASC;') as any[];

    // Valida si la tabla está vacía para poblarla con registros 
    // iniciales por defecto, mejorando la UX del primer uso.
    if (categoriasDB.length === 0) {
      db.runSync('INSERT INTO categorias (nombre, icono, limite, color) VALUES (?, ?, ?, ?);', ["Alimentación", "🍔", "160000", "#7E57C2"]);
      db.runSync('INSERT INTO categorias (nombre, icono, limite, color) VALUES (?, ?, ?, ?);', ["Transporte", "🚗", "80000", "#F9A825"]);
      db.runSync('INSERT INTO categorias (nombre, icono, limite, color) VALUES (?, ?, ?, ?);', ["Compras", "🛍️", "130000", "#C62828"]);
      db.runSync('INSERT INTO categorias (nombre, icono, limite, color) VALUES (?, ?, ?, ?);', ["Salud", "❤️", "55000", "#2E7D32"]);
      categoriasDB = db.getAllSync('SELECT * FROM categorias ORDER BY id ASC;') as any[];
    }
// Se usa 'as any[]' para omitir la validación estricta, ya que SQLite devuelve tipos 'unknown' por defecto.
    const gastosDB = db.getAllSync('SELECT * FROM gastos;') as any[];

    let conteoAlerta = 0;
    let conteoSobrepasado = 0;
    let categoriasConTotales = [];

    for (let i = 0; i < categoriasDB.length; i++) {
      let categoriaActual = { ...categoriasDB[i] };
      let sumaGastos = 0;

      for (let j = 0; j < gastosDB.length; j++) {
        if (
          gastosDB[j].categoria === categoriaActual.nombre ||
          (categoriaActual.nombre === "Alimentación" && gastosDB[j].categoria === "Comida")
        ) {
          let montoGasto = parseInt(gastosDB[j].monto);
          if (!isNaN(montoGasto)) sumaGastos += montoGasto;
        }
      }
      
      categoriaActual.gastado = sumaGastos;

      let limiteNum = parseInt(categoriaActual.limite);
      if (isNaN(limiteNum) || limiteNum <= 0) limiteNum = 1;
      
      let porcentaje = Math.round((sumaGastos / limiteNum) * 100);

      if (porcentaje > 100) conteoSobrepasado += 1;
      else if (porcentaje >= 80) conteoAlerta += 1;

      categoriasConTotales.push(categoriaActual);
    }

    setListaCategorias(categoriasConTotales);
    setEnAlerta(conteoAlerta);
    setSobrepasadas(conteoSobrepasado);
  };

// El arreglo vacío [] indica que cargarCategorias() se ejecutará una sola vez al montar la vista.
  useEffect(() => {
    cargarCategorias();
  }, []);

  const guardarCategoria = () => {
    if (!db) return;
    let colorFijo = "#512DA8";
// Si idEditar es 0, ejecuta un INSERT (Create).
// Si contiene un ID numérico, ejecuta un UPDATE (Update).
    if (idEditar === 0) {
      db.runSync('INSERT INTO categorias (nombre, icono, limite, color) VALUES (?, ?, ?, ?);', [nombreNuevo, iconoNuevo || "🏷️", limiteNuevo || "100000", colorFijo]);
    } else {
      db.runSync('UPDATE categorias SET nombre = ?, icono = ?, limite = ? WHERE id = ?;', [nombreNuevo, iconoNuevo || "🏷️", limiteNuevo || "100000", idEditar]);
    }
    
    setNombreNuevo("");
    setIconoNuevo("");
    setLimiteNuevo("");
    setIdEditar(0);
    setMostrarFormulario(false);
    cargarCategorias();
  };

  const prepararEdicion = (categoria: any) => {
    setNombreNuevo(categoria.nombre);
    setIconoNuevo(categoria.icono);
    setLimiteNuevo(categoria.limite);
    setIdEditar(categoria.id);
    setMostrarFormulario(true);
  };

  const borrarCategoria = (idBorrar: number) => {
    if (!db) return;
    db.runSync('DELETE FROM categorias WHERE id = ?;', [idBorrar]);
    cargarCategorias();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#1E1B2E" }}>Categorías</Text>
          <TouchableOpacity 
            onPress={() => setMostrarFormulario(!mostrarFormulario)}
            style={{ backgroundColor: "#512DA8", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
          >
            <Feather name={mostrarFormulario ? "minus" : "plus"} size={18} color="#fff" />
            <Text style={{ color: "white", fontWeight: "bold", marginLeft: 4 }}>
              {mostrarFormulario ? "Cerrar" : "Nueva"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Renderizado Condicional de React: El operador lógico AND (&&) evita */}
        {mostrarFormulario && (
          <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E1B2E" }}>
                {idEditar === 0 ? "Nueva Categoría" : "Editar Categoría"}
              </Text>
              <TouchableOpacity onPress={() => { setMostrarFormulario(false); setIdEditar(0); }}>
                <Feather name="x" size={20} color="#8A849C" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B6580", marginBottom: 6, marginLeft: 4 }}>
              Nombre de la categoría
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F5F3FA", borderRadius: 12, paddingHorizontal: 14, height: 52, marginBottom: 16 }}>
              <Feather name="tag" size={18} color="#8A849C" style={{ marginRight: 10 }} />
              <TextInput placeholder="Ej. Mascotas" value={nombreNuevo} onChangeText={setNombreNuevo} style={{ flex: 1, fontSize: 15, color: "#1E1B2E" }} />
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B6580", marginBottom: 6, marginLeft: 4 }}>Ícono</Text>
                <View style={{ backgroundColor: "#F5F3FA", borderRadius: 12, height: 52, justifyContent: "center", alignItems: "center" }}>
                  <TextInput placeholder="🐶" value={iconoNuevo} onChangeText={setIconoNuevo} maxLength={2} style={{ fontSize: 22, textAlign: "center", width: "100%" }} />
                </View>
              </View>
              <View style={{ flex: 2.5 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B6580", marginBottom: 6, marginLeft: 4 }}>Límite mensual</Text>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F5F3FA", borderRadius: 12, paddingHorizontal: 14, height: 52 }}>
                  <Text style={{ color: "#8A849C", marginRight: 6, fontSize: 16, fontWeight: "bold" }}>$</Text>
                  <TextInput placeholder="50000" value={limiteNuevo} onChangeText={setLimiteNuevo} keyboardType="numeric" style={{ flex: 1, fontSize: 15, color: "#1E1B2E" }} />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              onPress={guardarCategoria} 
              style={{ backgroundColor: "#512DA8", height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row" }}
            >
              <Feather name="save" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>
                {idEditar === 0 ? "Crear categoría" : "Guardar cambios"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, padding: 20, justifyContent: "space-around", marginBottom: 20 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#512DA8" }}>{listaCategorias.length}</Text>
            <Text style={{ fontSize: 11, color: "#8A849C" }}>Total categorías</Text>
          </View>
          <View style={{ width: 1, backgroundColor: "#E8E4F0", marginHorizontal: 10 }} />
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#F9A825" }}>{enAlerta}</Text>
            <Text style={{ fontSize: 11, color: "#8A849C" }}>En alerta</Text>
          </View>
          <View style={{ width: 1, backgroundColor: "#E8E4F0", marginHorizontal: 10 }} />
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#C62828" }}>{sobrepasadas}</Text>
            <Text style={{ fontSize: 11, color: "#8A849C" }}>Sobrepasadas</Text>
          </View>
        </View>

        <View style={{ gap: 16 }}>
          {listaCategorias.map((c) => {
            let limiteNum = parseInt(c.limite);
            if (isNaN(limiteNum) || limiteNum <= 0) limiteNum = 1;
            let p = Math.round((c.gastado / limiteNum) * 100);
            
            //  Reasigna las variables de diseño gráfico en tiempo real basándose en los umbrales de alerta (80% y 100%).
            let colorEstado = "#7E57C2";
            let fondoEstado = "rgba(126, 87, 194, 0.1)";
            let textoEstado = "OK";

            if (p > 100) {
              colorEstado = "#C62828";
              fondoEstado = "rgba(198, 40, 40, 0.1)";
              textoEstado = "Sobrepasado";
            } else if (p >= 80) {
              colorEstado = "#F9A825";
              fondoEstado = "rgba(249, 168, 37, 0.1)";
              textoEstado = "En alerta";
            }

            return (
              <View key={c.id} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: fondoEstado }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#F5F3FA", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 24 }}>{c.icono}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1E1B2E" }}>{c.nombre}</Text>
                      <View style={{ backgroundColor: fondoEstado, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: "bold", color: colorEstado }}>{textoEstado}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity onPress={() => prepararEdicion(c)}><Feather name="edit-2" size={18} color="#8A849C" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => borrarCategoria(c.id)}><Feather name="trash-2" size={18} color="#8A849C" /></TouchableOpacity>
                  </View>
                </View>

                <View style={{ height: 8, backgroundColor: "#E8E4F0", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                  <View style={{ width: `${Math.min(p, 100)}%`, backgroundColor: colorEstado, height: "100%", borderRadius: 99 }} />
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 12, color: "#8A849C" }}>${c.gastado.toLocaleString("es-CL")} gastado</Text>
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: colorEstado }}>{p}% · límite ${limiteNum.toLocaleString("es-CL")}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <BottomNav active={3} onNav={onNav} />
    </View>
  );
}
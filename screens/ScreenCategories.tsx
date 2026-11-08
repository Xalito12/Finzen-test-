// screens/ScreenCategories.tsx
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../components/BottomNav";
import { supabase } from "../database/supabase";

const categoriasSugeridas = [
  { nombre: "Alimentación", icono: "🍔", limite: 160000, color: "#7E57C2" },
  { nombre: "Transporte", icono: "🚗", limite: 80000, color: "#F9A825" },
  { nombre: "Compras", icono: "🛍️", limite: 130000, color: "#C62828" },
  { nombre: "Salud", icono: "❤️", limite: 55000, color: "#2E7D32" },
  { nombre: "Vivienda", icono: "🏠", limite: 380000, color: "#512DA8" },
  { nombre: "Servicios", icono: "💡", limite: 100000, color: "#F9A825" },
  { nombre: "Educación", icono: "📚", limite: 100000, color: "#3F51B5" },
  { nombre: "Mascotas", icono: "🐾", limite: 50000, color: "#2E7D32" },
  { nombre: "Entretenimiento", icono: "🎬", limite: 60000, color: "#7E57C2" },
  { nombre: "Ropa", icono: "👕", limite: 70000, color: "#C62828" },
];

export default function ScreenCategories({ onNav }: { onNav: (i: number) => void }) {
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const agregandoRef = useRef(false);
  const [listaCategorias, setListaCategorias] = useState<any[]>([]);
  const [enAlerta, setEnAlerta] = useState(0);
  const [sobrepasadas, setSobrepasadas] = useState(0);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [idEditar, setIdEditar] = useState(0);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [iconoNuevo, setIconoNuevo] = useState("");
  const [limiteNuevo, setLimiteNuevo] = useState("");

  // 1. Cargar las categorías y gastos de ESTE usuario desde Supabase
  const cargarCategorias = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setListaCategorias([]);
        return;
      }

      // Obtener categorías del usuario
      const { data: categoriasDB, error: errCat } = await supabase
        .from("categorias")
        .select("*")
        .eq("usuario_id", user.id)
        .order("id", { ascending: true });

      if (errCat) throw errCat;

      // Obtener gastos de este usuario
      const { data: gastosDB } = await supabase
        .from("gastos")
        .select("*")
        .eq("usuario_id", user.id);

      const listaGastos = gastosDB || [];
      let conteoAlerta = 0;
      let conteoSobrepasado = 0;
      let categoriasConTotales = [];

      for (let i = 0; i < (categoriasDB || []).length; i++) {
        let categoriaActual = { ...categoriasDB[i] };
        let sumaGastos = 0;

        for (let j = 0; j < listaGastos.length; j++) {
          if (
            listaGastos[j].categoria === categoriaActual.nombre ||
            (categoriaActual.nombre === "Alimentación" && listaGastos[j].categoria === "Comida")
          ) {
            let montoGasto = parseInt(listaGastos[j].monto);
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
    } catch (err: any) {
      console.error("Error al cargar categorías de Supabase:", err.message);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  // 2. Guardar o actualizar la categoría en Supabase
  const guardarCategoria = async () => {
    if (!nombreNuevo.trim()) {
      Alert.alert("Atención", "Por favor ingresa un nombre para la categoría.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      const colorFijo = "#512DA8";
      const limiteNum = parseInt(limiteNuevo.replace(/[^0-9]/g, "")) || 100000;
      const iconoDefinido = iconoNuevo.trim() || "🏷️";

      if (idEditar === 0) {
        // Crear categoría vinculada al usuario
        const { error } = await supabase.from("categorias").insert({
          usuario_id: user.id,
          nombre: nombreNuevo.trim(),
          icono: iconoDefinido,
          limite: limiteNum,
          color: colorFijo,
        });

        if (error) {
          Alert.alert("Error", error.message);
          return;
        }
      } else {
        // Actualizar categoría existente
        const { error } = await supabase
          .from("categorias")
          .update({
            nombre: nombreNuevo.trim(),
            icono: iconoDefinido,
            limite: limiteNum,
          })
          .eq("id", idEditar)
          .eq("usuario_id", user.id);

        if (error) {
          Alert.alert("Error", error.message);
          return;
        }
      }

      setNombreNuevo("");
      setIconoNuevo("");
      setLimiteNuevo("");
      setIdEditar(0);
      setMostrarFormulario(false);
      cargarCategorias();
    } catch (err: any) {
      Alert.alert("Error inesperado", err.message || "No se pudo guardar la categoría.");
    }
  };

  const agregarSugerida = async (categoria: typeof categoriasSugeridas[number]) => {
    if (agregandoRef.current) return;
    agregandoRef.current = true;
    setAgregando(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("No hay sesión activa.");
      const { data: existentes, error: errorConsulta } = await supabase
        .from("categorias").select("nombre").eq("usuario_id", user.id);
      if (errorConsulta) throw errorConsulta;
      if (!(existentes || []).some(c => c.nombre.trim().toLowerCase() === categoria.nombre.toLowerCase())) {
        const { error } = await supabase.from("categorias").insert({ ...categoria, usuario_id: user.id });
        if (error) throw error;
      }
      await cargarCategorias();
      setMostrarSugerencias(false);
    } catch (error: any) {
      Alert.alert("Error al agregar categoría", error.message);
    } finally {
      agregandoRef.current = false;
      setAgregando(false);
    }
  };

  const nuevaCategoria = () => {
    setMostrarSugerencias(false);
    setIdEditar(0);
    setNombreNuevo("");
    setIconoNuevo("");
    setLimiteNuevo("");
    setMostrarFormulario(true);
  };

  const prepararEdicion = (categoria: any) => {
    setNombreNuevo(categoria.nombre);
    setIconoNuevo(categoria.icono);
    setLimiteNuevo(categoria.limite.toString());
    setIdEditar(categoria.id);
    setMostrarFormulario(true);
  };

  // 3. Borrar la categoría en Supabase
  const borrarCategoria = async (idBorrar: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", idBorrar)
        .eq("usuario_id", user.id);

      if (error) {
        Alert.alert("Error al eliminar", error.message);
        return;
      }

      cargarCategorias();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F3FA" }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#1E1B2E" }}>Categorías</Text>
          <TouchableOpacity 
            onPress={() => { setMostrarFormulario(false); setMostrarSugerencias(true); }}
            style={{ backgroundColor: "#512DA8", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={{ color: "white", fontWeight: "bold", marginLeft: 4 }}>
              Nueva
            </Text>
          </TouchableOpacity>
        </View>

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
          {listaCategorias.length === 0 && (
            <Text style={{ color: "#6B6580" }}>No tienes categorías. Puedes crear una con Otros…</Text>
          )}
          {listaCategorias.map((c) => {
            let limiteNum = parseInt(c.limite);
            if (isNaN(limiteNum) || limiteNum <= 0) limiteNum = 1;
            let p = Math.round((c.gastado / limiteNum) * 100);
            
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
          <TouchableOpacity onPress={nuevaCategoria} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Feather name="plus-circle" size={24} color="#512DA8" />
            <Text style={{ color: "#512DA8", fontSize: 16, fontWeight: "700" }}>Otros…</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal visible={mostrarSugerencias} transparent animationType="slide" onRequestClose={() => { if (!agregando) setMostrarSugerencias(false); }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, maxHeight: "85%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1E1B2E", flex: 1 }}>Agregar categoría</Text>
              <TouchableOpacity accessibilityLabel="Cerrar sugerencias" disabled={agregando} onPress={() => setMostrarSugerencias(false)} style={{ padding: 10 }}>
                <Feather name="x" size={24} color="#512DA8" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: "#6B6580", marginBottom: 12 }}>Toca una para agregarla. Puedes editar su límite después.</Text>
            <ScrollView>
              {categoriasSugeridas.filter(c => !listaCategorias.some(actual => actual.nombre.trim().toLowerCase() === c.nombre.toLowerCase())).map(c => (
                <TouchableOpacity key={c.nombre} disabled={agregando} onPress={() => agregarSugerida(c)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F5F3FA", opacity: agregando ? 0.5 : 1 }}>
                  <Text style={{ fontSize: 24 }}>{c.icono}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#1E1B2E", fontWeight: "600", fontSize: 16 }}>{c.nombre}</Text>
                    <Text style={{ color: "#6B6580", fontSize: 12 }}>Límite mensual: ${c.limite.toLocaleString("es-CL")}</Text>
                  </View>
                  <Feather name="plus" size={20} color="#512DA8" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity disabled={agregando} onPress={nuevaCategoria} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 18 }}>
                <Feather name="edit-3" size={24} color="#512DA8" />
                <Text style={{ color: "#512DA8", fontSize: 16, fontWeight: "700" }}>Otros…</Text>
              </TouchableOpacity>
            </ScrollView>
            {agregando && <Text style={{ color: "#512DA8", marginTop: 12 }}>Agregando categoría…</Text>}
          </View>
        </View>
      </Modal>
      <BottomNav active={3} onNav={onNav} />
    </View>
  );
}
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

export default function ScreenCategories({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
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
            (categoriaActual.nombre === "Alimentación" &&
              listaGastos[j].categoria === "Comida")
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
      Alert.alert(
        "Error inesperado",
        err.message || "No se pudo guardar la categoría.",
      );
    }
  };

  const agregarSugerida = async (
    categoria: (typeof categoriasSugeridas)[number],
  ) => {
    if (agregandoRef.current) return;
    agregandoRef.current = true;
    setAgregando(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("No hay sesión activa.");
      const { data: existentes, error: errorConsulta } = await supabase
        .from("categorias")
        .select("nombre")
        .eq("usuario_id", user.id);
      if (errorConsulta) throw errorConsulta;
      if (
        !(existentes || []).some(
          (c) =>
            c.nombre.trim().toLowerCase() === categoria.nombre.toLowerCase(),
        )
      ) {
        const { error } = await supabase
          .from("categorias")
          .insert({ ...categoria, usuario_id: user.id });
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
    <View className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View className="flex-row justify-between items-center mb-[20px]">
          <Text className="text-[24px] font-black text-text">Categorías</Text>
          <TouchableOpacity
            onPress={() => {
              setMostrarFormulario(false);
              setMostrarSugerencias(true);
            }}
            className="bg-primary flex-row items-center px-[12px] py-[8px] rounded-[8px]"
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text className="font-bold ml-[4px]" style={{ color: "white" }}>
              Nueva
            </Text>
          </TouchableOpacity>
        </View>

        {mostrarFormulario && (
          <View
            className="bg-card p-[20px] rounded-[16px] mb-[20px]"
            style={{ elevation: 2 }}
          >
            <View className="flex-row justify-between items-center mb-[20px]">
              <Text className="text-[18px] font-extrabold text-text">
                {idEditar === 0 ? "Nueva Categoría" : "Editar Categoría"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setMostrarFormulario(false);
                  setIdEditar(0);
                }}
              >
                <Feather name="x" size={20} color="#8A849C" />
              </TouchableOpacity>
            </View>

            <Text className="text-[12px] font-bold text-text-secondary mb-[6px] ml-[4px]">
              Nombre de la categoría
            </Text>
            <View className="flex-row items-center bg-bg rounded-[12px] px-[14px] h-[52px] mb-[16px]">
              <Feather
                name="tag"
                size={18}
                color="#8A849C"
                style={{ marginRight: 10 }}
              />
              <TextInput
                placeholder="Ej. Mascotas"
                value={nombreNuevo}
                onChangeText={setNombreNuevo}
                className="flex-1 text-[15px] text-text"
              />
            </View>

            <View className="flex-row gap-[12px] mb-[24px]">
              <View className="flex-1">
                <Text className="text-[12px] font-bold text-text-secondary mb-[6px] ml-[4px]">
                  Ícono
                </Text>
                <View className="bg-bg rounded-[12px] h-[52px] justify-center items-center">
                  <TextInput
                    placeholder="🐶"
                    value={iconoNuevo}
                    onChangeText={setIconoNuevo}
                    maxLength={2}
                    className="text-[22px] text-center w-[100%]"
                  />
                </View>
              </View>
              <View style={{ flex: 2.5 }}>
                <Text className="text-[12px] font-bold text-text-secondary mb-[6px] ml-[4px]">
                  Límite mensual
                </Text>
                <View className="flex-row items-center bg-bg rounded-[12px] px-[14px] h-[52px]">
                  <Text className="text-muted mr-[6px] text-[16px] font-bold">
                    $
                  </Text>
                  <TextInput
                    placeholder="50000"
                    value={limiteNuevo}
                    onChangeText={setLimiteNuevo}
                    keyboardType="numeric"
                    className="flex-1 text-[15px] text-text"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={guardarCategoria}
              className="bg-primary h-[52px] rounded-[12px] items-center justify-center flex-row"
            >
              <Feather
                name="save"
                size={18}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text
                className="font-bold text-[15px]"
                style={{ color: "white" }}
              >
                {idEditar === 0 ? "Crear categoría" : "Guardar cambios"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-row bg-card rounded-[16px] p-[20px] justify-around mb-[20px]">
          <View className="items-center">
            <Text className="text-[24px] font-black text-primary">
              {listaCategorias.length}
            </Text>
            <Text className="text-[11px] text-muted">Total categorías</Text>
          </View>
          <View className="w-[1px] bg-border mx-[10px]" />
          <View className="items-center">
            <Text className="text-[24px] font-black text-alert">
              {enAlerta}
            </Text>
            <Text className="text-[11px] text-muted">En alerta</Text>
          </View>
          <View className="w-[1px] bg-border mx-[10px]" />
          <View className="items-center">
            <Text className="text-[24px] font-black text-error">
              {sobrepasadas}
            </Text>
            <Text className="text-[11px] text-muted">Sobrepasadas</Text>
          </View>
        </View>

        <View className="gap-[16px]">
          {listaCategorias.length === 0 && (
            <Text className="text-text-secondary">
              No tienes categorías. Puedes crear una con Otros…
            </Text>
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
              <View
                key={c.id}
                className="bg-card rounded-[16px] p-[16px] border-[1px]"
                style={{ borderColor: fondoEstado }}
              >
                <View className="flex-row justify-between items-start mb-[12px]">
                  <View className="flex-row items-center gap-[12px]">
                    <View className="w-[48px] h-[48px] rounded-[12px] bg-bg items-center justify-center">
                      <Text className="text-[24px]">{c.icono}</Text>
                    </View>
                    <View>
                      <Text className="text-[16px] font-bold text-text">
                        {c.nombre}
                      </Text>
                      <View
                        className="self-start px-[8px] py-[2px] rounded-[8px] mt-[4px]"
                        style={{ backgroundColor: fondoEstado }}
                      >
                        <Text
                          className="text-[10px] font-bold"
                          style={{ color: colorEstado }}
                        >
                          {textoEstado}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex-row gap-[12px]">
                    <TouchableOpacity onPress={() => prepararEdicion(c)}>
                      <Feather name="edit-2" size={18} color="#8A849C" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => borrarCategoria(c.id)}>
                      <Feather name="trash-2" size={18} color="#8A849C" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="h-[8px] bg-border rounded-[99px] overflow-hidden mb-[8px]">
                  <View
                    className="h-[100%] rounded-[99px]"
                    style={{
                      width: `${Math.min(p, 100)}%`,
                      backgroundColor: colorEstado,
                    }}
                  />
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-[12px] text-muted">
                    ${c.gastado.toLocaleString("es-CL")} gastado
                  </Text>
                  <Text
                    className="text-[12px] font-bold"
                    style={{ color: colorEstado }}
                  >
                    {p}% · límite ${limiteNum.toLocaleString("es-CL")}
                  </Text>
                </View>
              </View>
            );
          })}
          <TouchableOpacity
            onPress={nuevaCategoria}
            className="bg-card rounded-[16px] p-[20px] flex-row items-center gap-[12px]"
          >
            <Feather name="plus-circle" size={24} color="#512DA8" />
            <Text className="text-primary text-[16px] font-bold">Otros…</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal
        visible={mostrarSugerencias}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!agregando) setMostrarSugerencias(false);
        }}
      >
        <View
          className="flex-1 justify-center p-[24px]"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <View className="bg-card rounded-[20px] p-[20px] max-h-[85%]">
            <View className="flex-row items-center justify-between mb-[12px]">
              <Text className="text-[20px] font-bold text-text flex-1">
                Agregar categoría
              </Text>
              <TouchableOpacity
                accessibilityLabel="Cerrar sugerencias"
                disabled={agregando}
                onPress={() => setMostrarSugerencias(false)}
                className="p-[10px]"
              >
                <Feather name="x" size={24} color="#512DA8" />
              </TouchableOpacity>
            </View>
            <Text className="text-text-secondary mb-[12px]">
              Toca una para agregarla. Puedes editar su límite después.
            </Text>
            <ScrollView>
              {categoriasSugeridas
                .filter(
                  (c) =>
                    !listaCategorias.some(
                      (actual) =>
                        actual.nombre.trim().toLowerCase() ===
                        c.nombre.toLowerCase(),
                    ),
                )
                .map((c) => (
                  <TouchableOpacity
                    key={c.nombre}
                    disabled={agregando}
                    onPress={() => agregarSugerida(c)}
                    className="flex-row items-center gap-[12px] py-[14px] border-b-[1px] border-bg"
                    style={{ opacity: agregando ? 0.5 : 1 }}
                  >
                    <Text className="text-[24px]">{c.icono}</Text>
                    <View className="flex-1">
                      <Text className="text-text font-semibold text-[16px]">
                        {c.nombre}
                      </Text>
                      <Text className="text-text-secondary text-[12px]">
                        Límite mensual: ${c.limite.toLocaleString("es-CL")}
                      </Text>
                    </View>
                    <Feather name="plus" size={20} color="#512DA8" />
                  </TouchableOpacity>
                ))}
              <TouchableOpacity
                disabled={agregando}
                onPress={nuevaCategoria}
                className="flex-row items-center gap-[12px] py-[18px]"
              >
                <Feather name="edit-3" size={24} color="#512DA8" />
                <Text className="text-primary text-[16px] font-bold">
                  Otros…
                </Text>
              </TouchableOpacity>
            </ScrollView>
            {agregando && (
              <Text className="text-primary mt-[12px]">
                Agregando categoría…
              </Text>
            )}
          </View>
        </View>
      </Modal>
      <BottomNav active={3} onNav={onNav} />
    </View>
  );
}

// screens/ScreenDashboard.tsx
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Alert, Animated, Text, TextInput, TouchableOpacity, View } from "react-native";
import BottomNav from "../components/BottomNav";
import MiniBadge from "../components/MiniBadge";
import ProgressBar from "../components/ProgressBar";
import { supabase } from "../database/supabase";

export default function ScreenDashboard({ onNav }: { onNav: (i: number) => void }) {
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
  const [sueldoTotal, setSueldoTotal] = useState(0);
  const [editandoSueldo, setEditandoSueldo] = useState(false);
  const [nuevoSueldoInput, setNuevoSueldoInput] = useState("");

  const [listaGastos, setListaGastos] = useState<any[]>([]);
  const [totalGastado, setTotalGastado] = useState(0);
  const [categoriasDinamicas, setCategoriasDinamicas] = useState<any[]>([]);
  const [idEditar, setIdEditar] = useState<number | null>(null);
  const [montoEditar, setMontoEditar] = useState("");

  const scrollY = React.useRef(new Animated.Value(0)).current;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [56, 36],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  const textScale = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.75],
    extrapolate: "clamp",
  });

  // 1. Obtener perfil (nombre y sueldo) desde Supabase
  const cargarUsuarioAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("nombre, sueldo")
        .eq("id", user.id)
        .single();

      if (perfil) {
        setNombreUsuario(perfil.nombre || user.email?.split("@")[0] || "Usuario");
        if (perfil.sueldo) {
          setSueldoTotal(Number(perfil.sueldo));
        }
      } else {
        const nombreFallback = user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario";
        setNombreUsuario(nombreFallback);
      }
    } catch (err: any) {
      console.error("Error al cargar perfil:", err.message);
    }
  };

  // 2. Leer categorías y gastos exclusivos del usuario desde Supabase
  const leerDatosReales = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener gastos de este usuario
      const { data: registrosGastos } = await supabase
        .from("gastos")
        .select("*")
        .eq("usuario_id", user.id)
        .order("id", { ascending: false });

      const listaG = registrosGastos || [];
      setListaGastos(listaG);

      let sumaTotal = 0;
      for (let i = 0; i < listaG.length; i++) {
        let montoNum = Number(listaG[i].monto);
        if (!isNaN(montoNum)) sumaTotal += montoNum;
      }
      setTotalGastado(sumaTotal);

      // Obtener categorías de este usuario
      let { data: categoriasDB } = await supabase
        .from("categorias")
        .select("*")
        .eq("usuario_id", user.id)
        .order("id", { ascending: true });

      // Si el usuario es nuevo y no tiene categorías, le creamos las básicas iniciales
      if (!categoriasDB || categoriasDB.length === 0) {
        const categoriasBase = [
          { usuario_id: user.id, nombre: "Alimentación", icono: "🍔", limite: 160000, color: "#7E57C2" },
          { usuario_id: user.id, nombre: "Transporte", icono: "🚗", limite: 80000, color: "#F9A825" },
          { usuario_id: user.id, nombre: "Compras", icono: "🛍️", limite: 130000, color: "#C62828" },
          { usuario_id: user.id, nombre: "Salud", icono: "❤️", limite: 55000, color: "#2E7D32" },
        ];

        const { data: insertadas } = await supabase
          .from("categorias")
          .insert(categoriasBase)
          .select();

        categoriasDB = insertadas || [];
      }

      // Procesar gastos agrupados por cada categoría
      const categoriasProcesadas = (categoriasDB || []).map((cat) => {
        let sumaCat = 0;
        for (let j = 0; j < listaG.length; j++) {
          if (
            listaG[j].categoria === cat.nombre ||
            (cat.nombre === "Alimentación" && listaG[j].categoria === "Comida")
          ) {
            let montoNum = Number(listaG[j].monto);
            if (!isNaN(montoNum)) sumaCat += montoNum;
          }
        }

        let limiteNum = Number(cat.limite);
        if (isNaN(limiteNum) || limiteNum <= 0) limiteNum = 1;

        return {
          id: cat.id,
          name: cat.nombre,
          spent: sumaCat,
          limit: limiteNum,
          color: cat.color || "#512DA8",
          icono: cat.icono || "🏷️",
        };
      });

      setCategoriasDinamicas(categoriasProcesadas);
    } catch (err: any) {
      console.error("Error al cargar datos de Supabase:", err.message);
    }
  };

  useEffect(() => {
    cargarUsuarioAuth();
    leerDatosReales();
  }, []);

  // 3. Modificar sueldo directamente en Supabase
  const guardarNuevoSueldo = async () => {
    const valorLimpio = parseInt(nuevoSueldoInput.replace(/[^0-9]/g, ""));
    if (isNaN(valorLimpio) || valorLimpio <= 0) {
      Alert.alert("Atención", "Ingresa un monto de sueldo válido.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      const { error } = await supabase
        .from("perfiles")
        .update({ sueldo: valorLimpio })
        .eq("id", user.id);

      if (error) {
        Alert.alert("Error al actualizar", error.message);
        return;
      }

      setSueldoTotal(valorLimpio);
      setEditandoSueldo(false);
      setNuevoSueldoInput("");
      Alert.alert("Éxito", "Sueldo actualizado correctamente.");
    } catch (err: any) {
      Alert.alert("Error inesperado", err.message || "No se pudo actualizar.");
    }
  };

  // 4. Borrar gasto de Supabase
  const borrarGasto = async (idBorrar: number) => {
    try {
      const { error } = await supabase
        .from("gastos")
        .delete()
        .eq("id", idBorrar);

      if (error) {
        Alert.alert("Error al eliminar", error.message);
        return;
      }

      if (idEditar === idBorrar) setIdEditar(null);
      leerDatosReales();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const prepararEdicion = (gasto: any) => {
    setIdEditar(gasto.id);
    setMontoEditar(gasto.monto.toString());
  };

  // 5. Editar monto de un gasto en Supabase
  const guardarEdicionGasto = async () => {
    if (idEditar === null) return;
    const montoNum = parseInt(montoEditar.replace(/[^0-9]/g, ""));

    if (isNaN(montoNum) || montoNum <= 0) {
      Alert.alert("Atención", "Ingresa un monto válido.");
      return;
    }

    try {
      const { error } = await supabase
        .from("gastos")
        .update({ monto: montoNum })
        .eq("id", idEditar);

      if (error) {
        Alert.alert("Error al actualizar", error.message);
        return;
      }

      setIdEditar(null);
      setMontoEditar("");
      leerDatosReales();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const porcentajeTotal = sueldoTotal > 0 ? Math.round((totalGastado / sueldoTotal) * 100) : 0;
  const saldoDisponible = sueldoTotal - totalGastado;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F3FA" }}>
      {/* Header Animado */}
      <Animated.View
        style={{
          height: headerHeight,
          opacity: headerOpacity,
          backgroundColor: "#512DA8",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <Animated.Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
            transform: [{ scale: textScale }],
          }}
        >
          FinZen
        </Animated.Text>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        {/* Saludo dinámico con el nombre del usuario */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 13, color: "#6B6580" }}>Buenos días,</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1E1B2E" }}>{nombreUsuario} 👋</Text>
          </View>
          <TouchableOpacity
            onPress={() => onNav(6)}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="bell" size={20} color="#512DA8" />
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Resumen Financiero */}
        <LinearGradient colors={["#512DA8", "#512DA8"]} style={{ borderRadius: 20, padding: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Disponible · CLP</Text>
              <Text style={{ color: "#A5F3AE", fontSize: 24, fontWeight: "700" }}>
                ${saldoDisponible.toLocaleString("es-CL")}
              </Text>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 12, alignItems: "center" }}>
                <View>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Gastado</Text>
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                    ${totalGastado.toLocaleString("es-CL")}
                  </Text>
                </View>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Sueldo</Text>
                    <TouchableOpacity onPress={() => {
                      setNuevoSueldoInput(sueldoTotal.toString());
                      setEditandoSueldo(true);
                    }}>
                      <Feather name="edit-2" size={10} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                    ${sueldoTotal.toLocaleString("es-CL")}
                  </Text>
                </View>
              </View>
            </View>
            <MiniBadge percent={porcentajeTotal} color="rgba(255,255,255,0.85)" />
          </View>
        </LinearGradient>

        {/* Formulario flotante para editar sueldo */}
        {editandoSueldo && (
          <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#512DA8" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E1B2E" }}>Modificar Sueldo Mensual</Text>
              <TouchableOpacity onPress={() => setEditandoSueldo(false)}>
                <Feather name="x" size={18} color="#8A849C" />
              </TouchableOpacity>
            </View>
            <TextInput
              value={nuevoSueldoInput}
              onChangeText={setNuevoSueldoInput}
              keyboardType="numeric"
              placeholder="Ingresa tu nuevo sueldo"
              placeholderTextColor="#8A849C"
              style={{ backgroundColor: "#F5F3FA", borderRadius: 10, paddingHorizontal: 12, height: 42, marginBottom: 12, fontSize: 15, color: "#1E1B2E" }}
            />
            <TouchableOpacity
              onPress={guardarNuevoSueldo}
              style={{ backgroundColor: "#512DA8", height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>Actualizar Sueldo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sección de Categorías */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "700" }}>Categorías</Text>
          <TouchableOpacity onPress={() => onNav(3)}>
            <Text style={{ color: "#512DA8", fontSize: 13, fontWeight: "600" }}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 10, marginBottom: 20 }}>
          {categoriasDinamicas.map((c) => {
            const p = Math.round((c.spent / c.limit) * 100);
            const colorBarra = p >= 100 ? "#C62828" : p >= 80 ? "#F9A825" : c.color;
            return (
              <View key={c.id || c.name} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 16 }}>{c.icono}</Text>
                    <Text style={{ fontWeight: "600", fontSize: 14 }}>{c.name}</Text>
                  </View>
                  <Text style={{ fontWeight: "700", color: colorBarra }}>${c.spent.toLocaleString("es-CL")}</Text>
                </View>
                <ProgressBar percent={p} color={colorBarra} />
              </View>
            );
          })}
        </View>

        {/* Cuadro de edición de un gasto */}
        {idEditar !== null && (
          <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#512DA8" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E1B2E" }}>Editar Monto del Gasto</Text>
              <TouchableOpacity onPress={() => setIdEditar(null)}>
                <Feather name="x" size={20} color="#8A849C" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B6580", marginBottom: 4 }}>Nuevo Monto ($)</Text>
            <TextInput
              value={montoEditar}
              onChangeText={setMontoEditar}
              keyboardType="numeric"
              style={{ backgroundColor: "#F5F3FA", borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 16, fontSize: 15, color: "#1E1B2E" }}
            />
            <TouchableOpacity
              onPress={guardarEdicionGasto}
              style={{ backgroundColor: "#512DA8", height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista y Gestión de Gastos */}
        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 15 }}>Gestión de Gastos</Text>
          {listaGastos.length === 0 ? (
            <Text style={{ color: "#6B6580", textAlign: "center", marginVertical: 10 }}>
              Aún no hay gastos registrados.
            </Text>
          ) : (
            listaGastos.map((gasto) => (
              <View key={gasto.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderColor: "#F5F3FA" }}>
                <Text style={{ fontSize: 24, marginRight: 15 }}>{gasto.icono}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "bold", color: "#1E1B2E", fontSize: 16 }}>{gasto.categoria}</Text>
                  <Text style={{ color: "#6B6580", fontSize: 12 }}>ID: {gasto.id}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#C62828", marginRight: 12 }}>
                  ${Number(gasto.monto).toLocaleString("es-CL")}
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity onPress={() => prepararEdicion(gasto)} style={{ padding: 4 }}>
                    <Feather name="edit-2" size={18} color="#512DA8" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => borrarGasto(gasto.id)} style={{ padding: 4 }}>
                    <Feather name="trash-2" size={18} color="#C62828" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </Animated.ScrollView>
      <BottomNav active={2} onNav={onNav} />
    </View>
  );
}
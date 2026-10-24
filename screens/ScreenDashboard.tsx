// screens/ScreenDashboard.tsx
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Alert, Animated, Text, TextInput, TouchableOpacity, View } from "react-native";
import BottomNav from "../components/BottomNav";
import MiniBadge from "../components/MiniBadge";
import ProgressBar from "../components/ProgressBar";
import { db } from "../database/db";
import { supabase } from "../database/supabase";
import { respaldarEnLaNube } from "../database/syncService";

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

  // 1. Obtener nombre y sueldo del usuario autenticado desde Supabase
  const cargarUsuarioAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfil, error } = await supabase
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
      console.error("Error al cargar perfil desde Supabase:", err.message);
    }
  };

  // 2. Leer gastos y categorías de SQLite
  const leerDatosReales = () => {
    if (!db) {
      setListaGastos([]);
      setCategoriasDinamicas([]);
      return;
    }

    db.execSync('CREATE TABLE IF NOT EXISTS categorias (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, icono TEXT, limite TEXT, color TEXT);');
    db.execSync('CREATE TABLE IF NOT EXISTS gastos (id INTEGER PRIMARY KEY AUTOINCREMENT, monto TEXT, categoria TEXT, icono TEXT);');

    const categoriasExistentes = db.getAllSync('SELECT * FROM categorias;') as any[];
    if (categoriasExistentes.length === 0) {
      db.runSync('INSERT INTO categorias (nombre, icono, limite, color) VALUES (?, ?, ?, ?);', ["Alimentación", "🍔", "160000", "#7E57C2"]);
      db.runSync('INSERT INTO categorias (nombre, icono, limite, color) VALUES (?, ?, ?, ?);', ["Transporte", "🚗", "80000", "#F9A825"]);
      db.runSync('INSERT INTO categorias (nombre, icono, limite, color) VALUES (?, ?, ?, ?);', ["Compras", "🛍️", "130000", "#C62828"]);
      db.runSync('INSERT INTO categorias (nombre, icono, limite, color) VALUES (?, ?, ?, ?);', ["Salud", "❤️", "55000", "#2E7D32"]);
    }

    const categoriasDB = db.getAllSync('SELECT * FROM categorias ORDER BY id ASC;') as any[];
    const registrosGastos = db.getAllSync('SELECT * FROM gastos ORDER BY id DESC;') as any[];
    setListaGastos(registrosGastos);

    let sumaTotal = 0;
    for (let i = 0; i < registrosGastos.length; i++) {
      let montoNum = parseInt(registrosGastos[i].monto);
      if (!isNaN(montoNum)) sumaTotal += montoNum;
    }
    setTotalGastado(sumaTotal);

    const categoriasProcesadas = categoriasDB.map((cat) => {
      let sumaCat = 0;
      for (let j = 0; j < registrosGastos.length; j++) {
        if (
          registrosGastos[j].categoria === cat.nombre ||
          (cat.nombre === "Alimentación" && registrosGastos[j].categoria === "Comida")
        ) {
          let montoNum = parseInt(registrosGastos[j].monto);
          if (!isNaN(montoNum)) sumaCat += montoNum;
        }
      }

      let limiteNum = parseInt(cat.limite);
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
  };

  useEffect(() => {
    cargarUsuarioAuth();
    leerDatosReales();
  }, []);

  // 3. Guardar el nuevo sueldo editado directamente en Supabase
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

  const borrarGasto = (idBorrar: number) => {
    if (!db) return;
    db.runSync('DELETE FROM gastos WHERE id = ?;', [idBorrar]);
    if (idEditar === idBorrar) setIdEditar(null);
    leerDatosReales();
    respaldarEnLaNube();
  };

  const prepararEdicion = (gasto: any) => {
    setIdEditar(gasto.id);
    setMontoEditar(gasto.monto.toString());
  };

  const guardarEdicionGasto = () => {
    if (!db || idEditar === null) return;
    db.runSync('UPDATE gastos SET monto = ? WHERE id = ?;', [montoEditar, idEditar]);
    setIdEditar(null);
    setMontoEditar("");
    leerDatosReales();
    respaldarEnLaNube();
  };

  const porcentajeTotal = sueldoTotal > 0 ? Math.round((totalGastado / sueldoTotal) * 100) : 0;
  const saldoDisponible = sueldoTotal - totalGastado;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F3FA" }}>
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
        {/* Saludo personalizado */}
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

        {/* Tarjeta de Saldo y Sueldo */}
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

        {/* Formulario rápido para editar sueldo */}
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

        {/* Categorías */}
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

        {/* Edición de montos de gastos */}
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

        {/* Gestión de Gastos */}
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
                  ${gasto.monto}
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
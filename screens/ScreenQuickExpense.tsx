// screens/ScreenQuickExpense.tsx
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../components/BottomNav";
import { supabase } from "../database/supabase";

export default function ScreenQuickExpense({ onNav }: { onNav: (i: number) => void }) {
  const [crearCategoria, setCrearCategoria] = useState(false);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [creando, setCreando] = useState(false);
  const [amount, setAmount] = useState("0");
  const [cats, setCats] = useState<any[]>([]);
  const [selected, setSelected] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // 1. Cargar las categorías del usuario autenticado desde Supabase
  useEffect(() => {
    const cargarCategoriasUsuario = async () => {
      try {
        setCargando(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setCats([]);
          return;
        }

        const { data: categoriasDB, error } = await supabase
          .from("categorias")
          .select("*")
          .eq("usuario_id", user.id)
          .order("id", { ascending: true });

        if (error) {
          console.error("Error al obtener categorías:", error.message);
          return;
        }

        setCats(categoriasDB || []);
      } catch (err: any) {
        console.error("Error inesperado:", err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarCategoriasUsuario();
  }, []);

  const guardarNuevaCategoria = async () => {
    const nombre = nombreCategoria.trim();
    if (!nombre || creando) return;
    setCreando(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("No hay una sesión activa.");
      const existente = cats.findIndex(c => c.nombre.toLowerCase() === nombre.toLowerCase());
      if (existente >= 0) {
        setSelected(existente);
      } else {
        const { data, error } = await supabase.from("categorias").insert({
          usuario_id: user.id, nombre, icono: "🏷️", limite: 100000, color: "#512DA8",
        }).select().single();
        if (error) throw error;
        setSelected(cats.length);
        setCats([...cats, data]);
      }
      setNombreCategoria("");
      setCrearCategoria(false);
    } catch (error: any) {
      Alert.alert("Error al crear categoría", error.message);
    } finally {
      setCreando(false);
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

  const handleKey = (k: string) => {
    if (k === "⌫") setAmount((a) => (a.length > 1 ? a.slice(0, -1) : "0"));
    else if (k === "." && amount.includes(".")) return;
    else if (amount === "0" && k !== ".") setAmount(k);
    else setAmount((a) => a + k);
  };

  // 2. Guardar el nuevo gasto en la tabla gastos de Supabase asociado al usuario
  const guardarGastoReal = async () => {
    const montoNumerico = parseFloat(amount);
    if (isNaN(montoNumerico) || montoNumerico <= 0 || cats.length === 0) {
      Alert.alert("Atención", "Ingresa un monto válido.");
      return;
    }

    try {
      setGuardando(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "No hay una sesión activa.");
        return;
      }

      const categoriaElegida = cats[selected]?.nombre || "General";
      const iconoElegido = cats[selected]?.icono || "🏷️";

      const { error } = await supabase.from("gastos").insert({
        usuario_id: user.id,
        monto: montoNumerico,
        categoria: categoriaElegida,
        icono: iconoElegido,
      });

      if (error) {
        Alert.alert("Error al registrar gasto", error.message);
        return;
      }

      // Vuelve al Dashboard tras registrar el gasto
      onNav(2);
    } catch (err: any) {
      Alert.alert("Error inesperado", err.message || "No se pudo guardar el gasto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F3FA" }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Cabecera */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1E1B2E" }}>Nuevo gasto</Text>
          <TouchableOpacity onPress={() => onNav(2)}>
            <Feather name="x" size={24} color="#6B6580" />
          </TouchableOpacity>
        </View>

        {/* Display del Monto */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Text style={{ color: "#6B6580", fontSize: 13 }}>¿Cuánto gastaste?</Text>
          <Text style={{ fontSize: 42, fontWeight: "700", color: "#1E1B2E" }}>${amount}</Text>
        </View>

        {/* Selector de Categorías */}
        {cargando ? (
          <ActivityIndicator color="#512DA8" style={{ marginVertical: 20 }} />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {cats.length === 0 ? (
              <Text style={{ color: "#6B6580", fontSize: 13, textAlign: "center", width: "100%", marginVertical: 10 }}>
                No tienes categorías. Agrega una con Otros…
              </Text>
            ) : (
              cats.map((c, i) => (
                <TouchableOpacity
                  key={c.id || c.nombre}
                  onPress={() => setSelected(i)}
                  style={{
                    width: "31%",
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: selected === i ? "#512DA8" : "#E8E4F0",
                    backgroundColor: selected === i ? "#512DA8" : "#fff",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{c.icono}</Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 11,
                      color: selected === i ? "#fff" : "#1E1B2E",
                      fontWeight: "500",
                      marginTop: 4,
                    }}
                  >
                    {c.nombre}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity onPress={() => setCrearCategoria(true)} style={{ width: "31%", paddingVertical: 12, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", borderWidth: 1, borderColor: "#E8E4F0" }}>
              <Feather name="plus" size={20} color="#512DA8" />
              <Text style={{ color: "#512DA8", marginTop: 4 }}>Otros…</Text>
            </TouchableOpacity>
          </View>
        )}
        {crearCategoria && (
          <View style={{ padding: 16, backgroundColor: "#fff", borderRadius: 12, marginBottom: 20, gap: 12 }}>
            <Text style={{ fontWeight: "700" }}>Nueva categoría</Text>
            <TextInput autoFocus placeholder="Ej. Mascotas" value={nombreCategoria} onChangeText={setNombreCategoria} style={{ padding: 12, backgroundColor: "#F5F3FA", borderRadius: 8 }} />
            <Text style={{ color: "#6B6580", fontSize: 12 }}>Límite inicial: $100.000. Puedes editarlo en Categorías.</Text>
            <TouchableOpacity disabled={creando || !nombreCategoria.trim()} onPress={guardarNuevaCategoria}>
              <Text style={{ color: "#512DA8", fontWeight: "700" }}>{creando ? "Creando…" : "Crear y seleccionar"}</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={creando} onPress={() => setCrearCategoria(false)}><Text>Cancelar</Text></TouchableOpacity>
          </View>
        )}

        {/* Teclado Numérico */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {keys.map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => handleKey(k)}
              style={{
                width: "31%",
                height: 48,
                borderRadius: 10,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#E8E4F0",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#1E1B2E" }}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón Guardar Gasto */}
        <TouchableOpacity
          onPress={guardarGastoReal}
          disabled={cats.length === 0 || amount === "0" || guardando}
          style={{
            height: 50,
            borderRadius: 14,
            backgroundColor: cats.length === 0 || amount === "0" || guardando ? "#B39DDB" : "#512DA8",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Registrar gasto</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Navegación inferior */}
      <BottomNav active={4} onNav={onNav} />
    </View>
  );
}
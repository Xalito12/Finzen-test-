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

export default function ScreenQuickExpense({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("No hay una sesión activa.");
      const existente = cats.findIndex(
        (c) => c.nombre.toLowerCase() === nombre.toLowerCase(),
      );
      if (existente >= 0) {
        setSelected(existente);
      } else {
        const { data, error } = await supabase
          .from("categorias")
          .insert({
            usuario_id: user.id,
            nombre,
            icono: "🏷️",
            limite: 100000,
            color: "#512DA8",
          })
          .select()
          .single();
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
      Alert.alert(
        "Error inesperado",
        err.message || "No se pudo guardar el gasto.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Cabecera */}
        <View className="flex-row justify-between items-center mb-[20px]">
          <Text className="text-[20px] font-bold text-text">Nuevo gasto</Text>
          <TouchableOpacity onPress={() => onNav(2)}>
            <Feather name="x" size={24} color="#6B6580" />
          </TouchableOpacity>
        </View>

        {/* Display del Monto */}
        <View className="items-center mb-[24px]">
          <Text className="text-text-secondary text-[13px]">
            ¿Cuánto gastaste?
          </Text>
          <Text className="text-[42px] font-bold text-text">${amount}</Text>
        </View>

        {/* Selector de Categorías */}
        {cargando ? (
          <ActivityIndicator color="#512DA8" className="my-[20px]" />
        ) : (
          <View className="flex-row flex-wrap gap-[8px] mb-[20px]">
            {cats.length === 0 ? (
              <Text className="text-text-secondary text-[13px] text-center w-[100%] my-[10px]">
                No tienes categorías. Agrega una con Otros…
              </Text>
            ) : (
              cats.map((c, i) => (
                <TouchableOpacity
                  key={c.id || c.nombre}
                  onPress={() => setSelected(i)}
                  className="w-[31%] py-[12px] rounded-[12px] border-[1px] items-center"
                  style={{
                    borderColor: selected === i ? "#512DA8" : "#E8E4F0",
                    backgroundColor: selected === i ? "#512DA8" : "#fff",
                  }}
                >
                  <Text className="text-[20px]">{c.icono}</Text>
                  <Text
                    numberOfLines={1}
                    className="text-[11px] font-medium mt-[4px]"
                    style={{ color: selected === i ? "#fff" : "#1E1B2E" }}
                  >
                    {c.nombre}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              onPress={() => setCrearCategoria(true)}
              className="w-[31%] py-[12px] rounded-[12px] bg-card items-center border-[1px] border-border"
            >
              <Feather name="plus" size={20} color="#512DA8" />
              <Text className="text-primary mt-[4px]">Otros…</Text>
            </TouchableOpacity>
          </View>
        )}
        {crearCategoria && (
          <View className="p-[16px] bg-card rounded-[12px] mb-[20px] gap-[12px]">
            <Text className="font-bold">Nueva categoría</Text>
            <TextInput
              autoFocus
              placeholder="Ej. Mascotas"
              value={nombreCategoria}
              onChangeText={setNombreCategoria}
              className="p-[12px] bg-bg rounded-[8px]"
            />
            <Text className="text-text-secondary text-[12px]">
              Límite inicial: $100.000. Puedes editarlo en Categorías.
            </Text>
            <TouchableOpacity
              disabled={creando || !nombreCategoria.trim()}
              onPress={guardarNuevaCategoria}
            >
              <Text className="text-primary font-bold">
                {creando ? "Creando…" : "Crear y seleccionar"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={creando}
              onPress={() => setCrearCategoria(false)}
            >
              <Text>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Teclado Numérico */}
        <View className="flex-row flex-wrap gap-[8px] mb-[20px]">
          {keys.map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => handleKey(k)}
              className="w-[31%] h-[48px] rounded-[10px] bg-card items-center justify-center border-[1px] border-border"
            >
              <Text className="text-[18px] font-semibold text-text">{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón Guardar Gasto */}
        <TouchableOpacity
          onPress={guardarGastoReal}
          disabled={cats.length === 0 || amount === "0" || guardando}
          className="h-[50px] rounded-[14px] items-center justify-center"
          style={{
            backgroundColor:
              cats.length === 0 || amount === "0" || guardando
                ? "#B39DDB"
                : "#512DA8",
          }}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-card text-[15px] font-semibold">
              Registrar gasto
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Navegación inferior */}
      <BottomNav active={4} onNav={onNav} />
    </View>
  );
}

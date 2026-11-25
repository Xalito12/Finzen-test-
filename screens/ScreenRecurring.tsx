// screens/ScreenRecurring.tsx
import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../database/supabase";
import { confirmarEliminacion } from "../utils/confirmarEliminacion";

// Define la estructura de un gasto fijo guardado en Supabase.
interface GastoFijo {
  id: number | string;
  nombre: string;
  icono: string | null;
  monto: number | string;
  dia_cobro: number;
  categoria: string | null;
}

// Muestra una lista de gastos fijos de ejemplo con su monto y día de pago.
// Recibe onNav, aunque esta pantalla no lo utiliza.
export default function ScreenRecurring({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  // Detecta si esta pantalla está visible para recargar los datos al entrar.
  const isFocused = useIsFocused();
  const ultimaCarga = useRef(0);

  // Estados para la lista y la carga desde Supabase.
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados del formulario para crear o editar un gasto fijo.
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [idEditar, setIdEditar] = useState<GastoFijo["id"] | null>(null);
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState("📌");
  const [monto, setMonto] = useState("");
  const [diaCobro, setDiaCobro] = useState("1");

  // 1. Consulta los gastos fijos del usuario actual en Supabase.
  const cargarGastosFijos = useCallback(async () => {
    const solicitud = ++ultimaCarga.current;
    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();
      if (errorSesion) throw errorSesion;
      if (!session?.user) throw new Error("No hay una sesión activa.");

      const { data, error } = await supabase
        .from("gastos_fijos")
        .select("id, nombre, icono, monto, dia_cobro, categoria")
        .eq("usuario_id", session.user.id)
        .order("dia_cobro", { ascending: true })
        .order("id", { ascending: true });

      if (error) throw error;
      if (solicitud !== ultimaCarga.current) return;

      setGastosFijos((data || []) as GastoFijo[]);
    } catch (err: any) {
      if (solicitud === ultimaCarga.current) {
        console.error("Error al cargar gastos fijos:", err.message);
      }
    } finally {
      if (solicitud === ultimaCarga.current) {
        setCargando(false);
      }
    }
  }, []);

  // Recarga la lista cada vez que el usuario entra a esta pantalla.
  useEffect(() => {
    if (!isFocused) return;
    cargarGastosFijos();
    return () => {
      ultimaCarga.current += 1;
    };
  }, [isFocused, cargarGastosFijos]);

  // Limpia los campos del formulario y lo cierra.
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setIdEditar(null);
    setNombre("");
    setIcono("📌");
    setMonto("");
    setDiaCobro("1");
  };

  // Abre el formulario vacío para crear un nuevo gasto fijo.
  const abrirNuevo = () => {
    setIdEditar(null);
    setNombre("");
    setIcono("📌");
    setMonto("");
    setDiaCobro("1");
    setMostrarFormulario(true);
  };

  // Carga los datos de un gasto fijo existente en el formulario para editarlo.
  const prepararEdicion = (item: GastoFijo) => {
    setIdEditar(item.id);
    setNombre(item.nombre);
    setIcono(item.icono || "📌");
    setMonto(String(item.monto));
    setDiaCobro(String(item.dia_cobro));
    setMostrarFormulario(true);
  };

  // 2. Guarda un gasto fijo nuevo o actualiza uno existente en Supabase.
  const guardarGastoFijo = async () => {
    if (guardando) return;

    const nombreLimpio = nombre.trim();
    const montoNum = parseInt(monto.replace(/[^0-9]/g, ""), 10);
    const diaNum = parseInt(diaCobro.replace(/[^0-9]/g, ""), 10);
    const iconoLimpio = icono.trim() || "📌";

    // Valida que todos los campos tengan valores correctos.
    if (!nombreLimpio) {
      Alert.alert("Atención", "Ingresa un nombre (ej. Arriendo, Internet).");
      return;
    }
    if (isNaN(montoNum) || montoNum <= 0) {
      Alert.alert("Atención", "Ingresa un monto válido mayor a cero.");
      return;
    }
    if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
      Alert.alert("Atención", "El día de cobro debe estar entre 1 y 31.");
      return;
    }

    setGuardando(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      if (idEditar === null) {
        // Crea un nuevo registro en gastos_fijos.
        const { error } = await supabase.from("gastos_fijos").insert({
          usuario_id: user.id,
          nombre: nombreLimpio,
          icono: iconoLimpio,
          monto: montoNum,
          dia_cobro: diaNum,
        });
        if (error) throw error;
      } else {
        // Actualiza el gasto fijo seleccionado.
        const { error } = await supabase
          .from("gastos_fijos")
          .update({
            nombre: nombreLimpio,
            icono: iconoLimpio,
            monto: montoNum,
            dia_cobro: diaNum,
          })
          .eq("id", idEditar)
          .eq("usuario_id", user.id);
        if (error) throw error;
      }

      cerrarFormulario();
      cargarGastosFijos();
    } catch (err: any) {
      Alert.alert("Error al guardar", err.message || "Inténtalo nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  // 3. Elimina un gasto fijo previa confirmación del usuario.
  const pedirEliminar = (item: GastoFijo) => {
    confirmarEliminacion(
      "Eliminar gasto fijo",
      `¿Quieres eliminar «${item.nombre}» por $${Number(item.monto).toLocaleString("es-CL")}?`,
      async () => {
        try {
          const { error } = await supabase
            .from("gastos_fijos")
            .delete()
            .eq("id", item.id);
          if (error) throw error;
          if (idEditar === item.id) cerrarFormulario();
          cargarGastosFijos();
        } catch (err: any) {
          Alert.alert("Error al eliminar", err.message);
        }
      },
    );
  };

  // Calcula el total mensual de todos los gastos fijos configurados.
  const totalMensual = gastosFijos.reduce(
    (suma, item) => suma + (Number(item.monto) || 0),
    0,
  );

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
      >
        {/* Cabecera con título y botón para agregar */}
        <View className="flex-row justify-between items-center mb-[16px]">
          <Text className="text-[22px] font-bold text-text">Gastos Fijos</Text>
          <TouchableOpacity
            onPress={abrirNuevo}
            className="bg-primary flex-row items-center px-[12px] py-[8px] rounded-[8px]"
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text className="font-bold ml-[4px]" style={{ color: "white" }}>
              Nuevo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta resumen con el total comprometido al mes */}
        <View className="bg-card rounded-[16px] p-[16px] mb-[16px] flex-row justify-between items-center">
          <View>
            <Text className="text-[12px] text-text-secondary">
              Total mensual en gastos fijos
            </Text>
            <Text className="text-[22px] font-extrabold text-primary mt-[2px]">
              ${totalMensual.toLocaleString("es-CL")}
            </Text>
          </View>
          <Text className="text-[12px] font-semibold text-text-secondary">
            {gastosFijos.length}{" "}
            {gastosFijos.length === 1 ? "registro" : "registros"}
          </Text>
        </View>

        {/* Formulario para crear o editar un gasto fijo */}
        {mostrarFormulario && (
          <View
            className="bg-card p-[18px] rounded-[16px] mb-[20px]"
            style={{ elevation: 2 }}
          >
            <View className="flex-row justify-between items-center mb-[14px]">
              <Text className="text-[16px] font-bold text-text">
                {idEditar === null ? "Nuevo gasto fijo" : "Editar gasto fijo"}
              </Text>
              <TouchableOpacity onPress={cerrarFormulario}>
                <Feather name="x" size={20} color="#8A849C" />
              </TouchableOpacity>
            </View>

            <Text className="text-[12px] font-bold text-text-secondary mb-[6px]">
              Nombre
            </Text>
            <TextInput
              placeholder="Ej. Arriendo, Internet, Netflix"
              placeholderTextColor="#8A849C"
              value={nombre}
              onChangeText={setNombre}
              editable={!guardando}
              className="bg-bg rounded-[12px] px-[14px] h-[48px] mb-[12px] text-[15px] text-text"
            />

            <View className="flex-row gap-[10px] mb-[12px]">
              <View className="w-[70px]">
                <Text className="text-[12px] font-bold text-text-secondary mb-[6px]">
                  Ícono
                </Text>
                <TextInput
                  placeholder="📌"
                  value={icono}
                  onChangeText={setIcono}
                  maxLength={2}
                  editable={!guardando}
                  className="bg-bg rounded-[12px] h-[48px] text-[20px] text-center"
                />
              </View>

              <View className="flex-1">
                <Text className="text-[12px] font-bold text-text-secondary mb-[6px]">
                  Monto mensual ($)
                </Text>
                <TextInput
                  placeholder="25000"
                  placeholderTextColor="#8A849C"
                  value={monto}
                  onChangeText={setMonto}
                  keyboardType="numeric"
                  editable={!guardando}
                  className="bg-bg rounded-[12px] px-[14px] h-[48px] text-[15px] text-text"
                />
              </View>

              <View className="w-[90px]">
                <Text className="text-[12px] font-bold text-text-secondary mb-[6px]">
                  Día (1-31)
                </Text>
                <TextInput
                  placeholder="1"
                  placeholderTextColor="#8A849C"
                  value={diaCobro}
                  onChangeText={setDiaCobro}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!guardando}
                  className="bg-bg rounded-[12px] px-[12px] h-[48px] text-[15px] text-center text-text"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={guardarGastoFijo}
              disabled={guardando}
              className="bg-primary h-[48px] rounded-[12px] items-center justify-center flex-row"
            >
              {guardando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather
                    name="save"
                    size={18}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="font-bold text-[15px]" style={{ color: "white" }}>
                    {idEditar === null ? "Guardar gasto fijo" : "Guardar cambios"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Lista de gastos fijos guardados */}
        {cargando ? (
          <ActivityIndicator
            size="large"
            color="#512DA8"
            style={{ marginVertical: 24 }}
          />
        ) : gastosFijos.length === 0 ? (
          <View className="bg-card rounded-[16px] p-[20px] items-center">
            <Text className="text-[15px] font-bold text-text mb-[6px]">
              Aún no tienes gastos fijos
            </Text>
            <Text className="text-[13px] text-text-secondary text-center">
              Agrega tus pagos recurrentes como arriendo, internet o
              suscripciones con el botón Nuevo.
            </Text>
          </View>
        ) : (
          <View className="gap-[10px]">
            {gastosFijos.map((r) => (
              <View
                key={String(r.id)}
                className="bg-card rounded-[14px] p-[14px] flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-[10px] flex-1">
                  <Text className="text-[22px]">{r.icono || "📌"}</Text>
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-text">
                      {r.nombre}
                    </Text>
                    <Text className="text-[12px] text-text-secondary">
                      Día {r.dia_cobro} de cada mes
                    </Text>
                  </View>
                </View>

                <Text className="text-[15px] font-bold text-text mr-[8px]">
                  ${Number(r.monto).toLocaleString("es-CL")}
                </Text>

                <View className="flex-row gap-[2px]">
                  <Pressable
                    onPress={() => prepararEdicion(r)}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${r.nombre}`}
                    hitSlop={4}
                    className="p-[8px]"
                  >
                    <Feather name="edit-2" size={17} color="#512DA8" />
                  </Pressable>
                  <Pressable
                    onPress={() => pedirEliminar(r)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${r.nombre}`}
                    hitSlop={4}
                    className="p-[8px]"
                  >
                    <Feather name="trash-2" size={17} color="#C62828" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
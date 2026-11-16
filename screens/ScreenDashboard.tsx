// screens/ScreenDashboard.tsx
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useIsFocused } from "@react-navigation/native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MiniBadge from "../components/MiniBadge";
import ProgressBar from "../components/ProgressBar";
import { supabase } from "../database/supabase";
import {
  consultarInicio,
  resumirGastos,
  type GastoResumen,
} from "../database/consultasFinanzas";
import { calcularEstadoPresupuesto } from "../models/estadoPresupuesto";
import { generarNotificaciones } from "../models/notificaciones";
import { listarMetas } from "../database/metasService";
import { confirmarEliminacion } from "../utils/confirmarEliminacion";
import TutorialCard from "../tutorial/TutorialCard";

interface CategoriaInicio {
  id: number | string;
  name: string;
  spent: number;
  limit: number;
  color: string;
  icono: string;
}

const FilaGasto = memo(function FilaGasto({
  gasto,
  onEditar,
  onBorrar,
}: {
  gasto: GastoResumen;
  onEditar: (gasto: GastoResumen) => void;
  onBorrar: (id: GastoResumen["id"]) => void;
}) {
  return (
    <View className="bg-card flex-row items-center px-[14px] py-[12px] border-b-[1px] border-bg">
      <Text className="text-[24px] mr-[15px]">{gasto.icono || "🏷️"}</Text>
      <View className="flex-1">
        <Text className="font-bold text-text text-[16px]">
          {gasto.categoria}
        </Text>
      </View>
      <Text className="text-[16px] font-bold text-error mr-[8px]">
        ${Number(gasto.monto).toLocaleString("es-CL")}
      </Text>
      <View className="flex-row gap-[4px]">
        <Pressable
          onPress={() => onEditar(gasto)}
          accessibilityRole="button"
          accessibilityLabel={`Editar gasto de ${gasto.categoria}`}
          hitSlop={4}
          android_ripple={{ color: "#E8E4F0", borderless: true }}
          className="p-[10px]"
        >
          <Feather name="edit-2" size={18} color="#512DA8" />
        </Pressable>
        <Pressable
          onPress={() => onBorrar(gasto.id)}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar gasto de ${gasto.categoria}`}
          hitSlop={4}
          android_ripple={{ color: "#FDE8E8", borderless: true }}
          className="p-[10px]"
        >
          <Feather name="trash-2" size={18} color="#C62828" />
        </Pressable>
      </View>
    </View>
  );
});

export default function ScreenDashboard({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  const active = useIsFocused();
  const [refrescando, setRefrescando] = useState(false);
  const [numeroAlertas, setNumeroAlertas] = useState(0);
  const [guardandoGasto, setGuardandoGasto] = useState(false);
  const [perfilCargado, setPerfilCargado] = useState(false);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
  const [sueldoTotal, setSueldoTotal] = useState(0);
  const [editandoSueldo, setEditandoSueldo] = useState(false);
  const [nuevoSueldoInput, setNuevoSueldoInput] = useState("");

  const [listaGastos, setListaGastos] = useState<GastoResumen[]>([]);
  const [totalGastado, setTotalGastado] = useState(0);
  const [categoriasDinamicas, setCategoriasDinamicas] = useState<
    CategoriaInicio[]
  >([]);
  const [idEditar, setIdEditar] = useState<GastoResumen["id"] | null>(null);
  const [montoEditar, setMontoEditar] = useState("");

  const listaRef = useRef<FlatList<GastoResumen>>(null);
  const posicionGastos = useRef(0);
  const ultimaCarga = useRef(0);
  const gastosActuales = useRef(listaGastos);
  gastosActuales.current = listaGastos;
  const pantallaActiva = useRef(active);
  pantallaActiva.current = active;
  const montado = useRef(true);
  const borrandoGastos = useRef(new Set<GastoResumen["id"]>());
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const cargarInicio = useCallback(async () => {
    const solicitud = ++ultimaCarga.current;
    try {
      const metasPendientes = listarMetas().catch(() => null);
      const datos = await consultarInicio();
      const { user, perfil, gastos, categorias } = datos;
      // Descarta respuestas de una pantalla anterior o de una consulta superada.
      if (solicitud !== ultimaCarga.current) return;
      const resumen = resumirGastos(gastos);
      setNombreUsuario(
        perfil?.nombre ||
          user.user_metadata?.nombre ||
          user.email?.split("@")[0] ||
          "Usuario",
      );
      setSueldoTotal(Number(perfil?.sueldo) || 0);
      setListaGastos(gastos);
      setTotalGastado(resumen.total);
      setCategoriasDinamicas(
        categorias.map((cat) => ({
          id: cat.id,
          name: cat.nombre,
          spent: resumen.gastoCategoria(cat.nombre),
          limit: Number(cat.limite) > 0 ? Number(cat.limite) : 1,
          color: cat.color || "#512DA8",
          icono: cat.icono || "🏷️",
        })),
      );
      setNumeroAlertas(generarNotificaciones(datos, []).length);
      // El presupuesto se dibuja primero; las metas no retrasan su carga.
      void metasPendientes.then((metas) => {
        if (metas && solicitud === ultimaCarga.current) {
          setNumeroAlertas(generarNotificaciones(datos, metas).length);
        }
      });
      setPerfilCargado(true);
      setErrorPerfil(false);
    } catch (err: any) {
      if (solicitud !== ultimaCarga.current) return;
      setErrorPerfil(true);
      console.error("Error al actualizar Inicio:", err.message);
    } finally {
      if (solicitud === ultimaCarga.current) {
        setCargandoPerfil(false);
        setRefrescando(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!active) {
      setRefrescando(false);
      return;
    }
    setEditandoSueldo(false);
    setIdEditar(null);
    cargarInicio();
    return () => {
      ultimaCarga.current += 1;
    };
  }, [active, cargarInicio]);

  // 3. Modificar sueldo directamente en Supabase
  const guardarNuevoSueldo = async () => {
    const valorLimpio = parseInt(nuevoSueldoInput.replace(/[^0-9]/g, ""));
    if (isNaN(valorLimpio) || valorLimpio <= 0) {
      Alert.alert("Atención", "Ingresa un monto de sueldo válido.");
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
  const eliminarGasto = useCallback(
    async (idBorrar: GastoResumen["id"]) => {
      if (borrandoGastos.current.has(idBorrar) || !montado.current) return;
      borrandoGastos.current.add(idBorrar);
      try {
        const { error } = await supabase
          .from("gastos")
          .delete()
          .eq("id", idBorrar);

        if (error) {
          Alert.alert("Error al eliminar", error.message);
          return;
        }

        setIdEditar((actual) => (actual === idBorrar ? null : actual));
        cargarInicio();
      } catch (err: any) {
        if (montado.current) Alert.alert("Error", err.message);
      } finally {
        borrandoGastos.current.delete(idBorrar);
      }
    },
    [cargarInicio],
  );

  const borrarGasto = useCallback(
    (id: GastoResumen["id"]) => {
      const gasto = gastosActuales.current.find((item) => item.id === id);
      if (!gasto || borrandoGastos.current.has(id)) return;
      confirmarEliminacion(
        "Eliminar gasto",
        `¿Quieres eliminar el gasto de «${gasto.categoria}» por $${Number(gasto.monto).toLocaleString("es-CL")}?`,
        () => {
          if (
            montado.current &&
            pantallaActiva.current &&
            gastosActuales.current.some((item) => item.id === id)
          ) {
            void eliminarGasto(id);
          }
        },
      );
    },
    [eliminarGasto],
  );

  const prepararEdicion = useCallback((gasto: GastoResumen) => {
    setIdEditar(gasto.id);
    setMontoEditar(gasto.monto.toString());
  }, []);

  // 5. Editar monto de un gasto en Supabase
  const guardarEdicionGasto = async () => {
    if (idEditar === null || guardandoGasto) return;
    const montoNum = parseInt(montoEditar.replace(/[^0-9]/g, ""));

    if (isNaN(montoNum) || montoNum <= 0) {
      Alert.alert("Atención", "Ingresa un monto válido.");
      return;
    }

    setGuardandoGasto(true);
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
      cargarInicio();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setGuardandoGasto(false);
    }
  };

  const estadoPresupuesto = calcularEstadoPresupuesto(
    sueldoTotal,
    totalGastado,
  );
  const saldoDisponible = sueldoTotal - totalGastado;

  if (!perfilCargado) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        {cargandoPerfil ? (
          <ActivityIndicator size="large" color="#512DA8" />
        ) : (
          <View className="items-center p-[20px]">
            <Text className="text-text-secondary">
              No se pudo cargar el resumen.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setCargandoPerfil(true);
                cargarInicio();
              }}
              className="bg-primary rounded-[12px] p-[16px] mt-[12px]"
            >
              <Text className="text-white font-bold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      {errorPerfil && (
        <Text className="text-error p-[12px]">
          No se pudo actualizar el resumen. Se muestran los últimos datos
          cargados.
        </Text>
      )}
      <TutorialCard
        pantalla="Inicio"
        onNav={onNav}
        onAccion={(accion) => {
          if (accion === "ver_gastos") {
            listaRef.current?.scrollToOffset({
              offset: Math.max(0, posicionGastos.current - 12),
              animated: true,
            });
          }
        }}
      />
      <FlatList<GastoResumen>
        ref={listaRef}
        data={listaGastos}
        keyExtractor={(gasto) => String(gasto.id)}
        renderItem={({ item }) => (
          <FilaGasto
            gasto={item}
            onEditar={prepararEdicion}
            onBorrar={borrarGasto}
          />
        )}
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        refreshing={refrescando}
        onRefresh={() => {
          setRefrescando(true);
          cargarInicio();
        }}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={
          <>
            {/* Saludo dinámico con el nombre del usuario */}
            <View className="flex-row justify-between items-center mb-[20px]">
              <View>
                <Text className="text-[13px] text-text-secondary">
                  Buenos días,
                </Text>
                <Text className="text-[20px] font-bold text-text">
                  {nombreUsuario} 👋
                </Text>
              </View>
              <Pressable
                onPress={() => onNav(6)}
                accessibilityRole="button"
                accessibilityLabel={`Notificaciones: ${numeroAlertas} alertas activas`}
                hitSlop={6}
                className="w-[44px] h-[44px] rounded-[12px] bg-card items-center justify-center"
              >
                <Feather name="bell" size={20} color="#512DA8" />
                {numeroAlertas > 0 && (
                  <View
                    pointerEvents="none"
                    className="absolute bg-error rounded-[10px] items-center justify-center"
                    style={{
                      top: -5,
                      right: -5,
                      minWidth: 20,
                      height: 20,
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text className="text-card text-[10px] font-bold">
                      {numeroAlertas > 99 ? "99+" : numeroAlertas}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Tarjeta de Resumen Financiero */}
            <LinearGradient
              colors={["#512DA8", "#512DA8"]}
              style={{ borderRadius: 20, padding: 20, marginBottom: 20 }}
            >
              <View className="flex-row justify-between items-center gap-[12px]">
                <View className="flex-1">
                  <Text
                    className="text-[11px]"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    Disponible · CLP
                  </Text>
                  <Text
                    className="text-[24px] font-bold"
                    style={{ color: estadoPresupuesto.color }}
                  >
                    ${saldoDisponible.toLocaleString("es-CL")}
                  </Text>
                  <View className="flex-row gap-[14px] mt-[12px] items-center">
                    <View>
                      <Text
                        className="text-[10px]"
                        style={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        Gastado
                      </Text>
                      <Text className="text-card text-[14px] font-semibold">
                        ${totalGastado.toLocaleString("es-CL")}
                      </Text>
                    </View>
                    <View>
                      <View className="flex-row items-center gap-[4px]">
                        <Text
                          className="text-[10px]"
                          style={{ color: "rgba(255,255,255,0.6)" }}
                        >
                          Sueldo
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setNuevoSueldoInput(sueldoTotal.toString());
                            setEditandoSueldo(true);
                          }}
                        >
                          <Feather name="edit-2" size={10} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-card text-[14px] font-semibold">
                        ${sueldoTotal.toLocaleString("es-CL")}
                      </Text>
                    </View>
                  </View>
                </View>
                <MiniBadge
                  percent={estadoPresupuesto.porcentajeDisponible}
                  color={estadoPresupuesto.color}
                  status={estadoPresupuesto.etiqueta}
                />
              </View>
              <View className="mt-[16px]">
                <Text
                  className="font-bold text-[13px]"
                  style={{ color: estadoPresupuesto.color }}
                >
                  {estadoPresupuesto.etiqueta}
                </Text>
                <Text className="text-card text-[12px] mt-[4px]">
                  {estadoPresupuesto.mensaje}
                </Text>
              </View>
            </LinearGradient>

            {/* Formulario flotante para editar sueldo */}
            {editandoSueldo && (
              <View className="bg-card rounded-[14px] p-[16px] mb-[20px] border-[1px] border-primary">
                <View className="flex-row justify-between items-center mb-[8px]">
                  <Text className="text-[15px] font-bold text-text">
                    Modificar Sueldo Mensual
                  </Text>
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
                  className="bg-bg rounded-[10px] px-[12px] h-[42px] mb-[12px] text-[15px] text-text"
                />
                <TouchableOpacity
                  onPress={guardarNuevoSueldo}
                  className="bg-primary h-[42px] rounded-[10px] items-center justify-center"
                >
                  <Text className="text-card font-semibold text-[14px]">
                    Actualizar Sueldo
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sección de Categorías */}
            <View className="flex-row justify-between mb-[12px]">
              <Text className="text-[15px] font-bold">Categorías</Text>
              <TouchableOpacity onPress={() => onNav(3)}>
                <Text className="text-primary text-[13px] font-semibold">
                  Ver todas
                </Text>
              </TouchableOpacity>
            </View>

            <View className="gap-[10px] mb-[20px]">
              {categoriasDinamicas.length === 0 && (
                <View className="bg-card rounded-[14px] p-[16px] border-[1px] border-border">
                  <Text className="text-text font-semibold">
                    No hay categorías disponibles.
                  </Text>
                  <Text className="text-text-secondary text-[13px] mt-[6px]">
                    Crea tu primera categoría para organizar los gastos y
                    definir sus límites.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Crear mi primera categoría"
                    onPress={() => onNav(3)}
                    className="py-[12px] mt-[4px]"
                  >
                    <Text className="text-primary font-bold">
                      Ir a Categorías
                    </Text>
                  </Pressable>
                </View>
              )}
              {categoriasDinamicas.map((c) => {
                const p = Math.round((c.spent / c.limit) * 100);
                const colorBarra =
                  p >= 100 ? "#C62828" : p >= 80 ? "#F9A825" : c.color;
                return (
                  <View
                    key={c.id || c.name}
                    className="bg-card rounded-[14px] p-[14px]"
                  >
                    <View className="flex-row justify-between mb-[8px]">
                      <View className="flex-row items-center gap-[8px]">
                        <Text className="text-[16px]">{c.icono}</Text>
                        <Text className="font-semibold text-[14px]">
                          {c.name}
                        </Text>
                      </View>
                      <Text className="font-bold" style={{ color: colorBarra }}>
                        ${c.spent.toLocaleString("es-CL")}
                      </Text>
                    </View>
                    <ProgressBar percent={p} color={colorBarra} />
                  </View>
                );
              })}
            </View>

            <View
              onLayout={({ nativeEvent }) => {
                posicionGastos.current = nativeEvent.layout.y;
              }}
              className="bg-card p-[14px] rounded-t-[14px]"
            >
              <Text className="text-[16px] font-bold">Gestión de Gastos</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View className="bg-card p-[14px]">
            <Text className="text-text-secondary text-center my-[10px]">
              Aún no hay gastos registrados.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View className="bg-card h-[12px] rounded-b-[14px]" />
        }
      />
      <Modal
        visible={idEditar !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!guardandoGasto) setIdEditar(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            className="flex-1 justify-center p-[20px]"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <View className="bg-card rounded-[14px] p-[20px]">
              <View className="flex-row justify-between items-center mb-[12px]">
                <Text className="text-[16px] font-bold text-text">
                  Editar monto del gasto
                </Text>
                <Pressable
                  disabled={guardandoGasto}
                  onPress={() => setIdEditar(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar edición"
                  hitSlop={8}
                  className="p-[8px]"
                >
                  <Feather name="x" size={20} color="#8A849C" />
                </Pressable>
              </View>
              <Text className="text-[12px] font-semibold text-text-secondary mb-[4px]">
                Nuevo monto ($)
              </Text>
              <TextInput
                autoFocus
                value={montoEditar}
                onChangeText={setMontoEditar}
                keyboardType="numeric"
                editable={!guardandoGasto}
                accessibilityLabel="Nuevo monto del gasto"
                className="bg-bg rounded-[10px] px-[12px] h-[44px] mb-[16px] text-[15px] text-text"
              />
              <Pressable
                disabled={guardandoGasto}
                onPress={guardarEdicionGasto}
                accessibilityRole="button"
                accessibilityLabel="Guardar monto del gasto"
                accessibilityState={{ disabled: guardandoGasto }}
                className="bg-primary h-[44px] rounded-[10px] items-center justify-center"
              >
                {guardandoGasto ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-card font-semibold text-[14px]">
                    Guardar cambios
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

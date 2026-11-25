import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { layout } from "../components/layout";
import MiniBadge from "../components/MiniBadge";
import ProgressBar from "../components/ProgressBar";
import { consultarInicio, resumirGastos, type GastoResumen, } from "../database/consultasFinanzas";
import { listarMetas } from "../database/metasService";
import { supabase } from "../database/supabase";
import { calcularEstadoPresupuesto } from "../models/estadoPresupuesto";
import { generarNotificaciones } from "../models/notificaciones";
import TutorialCard from "../tutorial/TutorialCard";
import { confirmarEliminacion } from "../utils/confirmarEliminacion";

// Define la información necesaria para mostrar una categoría en Inicio.
interface CategoriaInicio {
  id: number | string;
  name: string;
  spent: number;
  limit: number;
  color: string;
  icono: string;
}

// Muestra un gasto con su categoría, icono y monto.
// Los botones ejecutan las acciones de editar o eliminar recibidas como propiedades.
// memo permite evitar renderizados cuando sus propiedades no cambian.
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

      {/* Accesos para editar o solicitar la eliminación de este gasto. */}
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

// Pantalla principal que muestra el saldo, los ahorros, las categorías y los gastos.
// Permite modificar el sueldo, editar montos y eliminar gastos.
export default function ScreenDashboard({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  // Identifica si Inicio está abierto y controla los indicadores de carga.
  const active = useIsFocused();
  const [refrescando, setRefrescando] = useState(false);
  const [numeroAlertas, setNumeroAlertas] = useState(0);
  const [guardandoGasto, setGuardandoGasto] = useState(false);
  const [perfilCargado, setPerfilCargado] = useState(false);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState(false);

  // Guarda los datos del usuario y controla la edición de su sueldo.
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
  const [sueldoTotal, setSueldoTotal] = useState(0);
  const [editandoSueldo, setEditandoSueldo] = useState(false);
  const [nuevoSueldoInput, setNuevoSueldoInput] = useState("");

  // Conserva los gastos, el ahorro registrado y las categorías del resumen.
  const [listaGastos, setListaGastos] = useState<GastoResumen[]>([]);
  const [totalGastado, setTotalGastado] = useState(0);
  const [totalAhorrado, setTotalAhorrado] = useState(0);
  const [categoriasDinamicas, setCategoriasDinamicas] = useState<
    CategoriaInicio[]
  >([]);

  // Identifica el gasto que se está editando y su nuevo monto.
  const [idEditar, setIdEditar] = useState<GastoResumen["id"] | null>(null);
  const [montoEditar, setMontoEditar] = useState("");

  // Permite desplazar la lista hasta la sección Gestión de Gastos.
  const listaRef = useRef<FlatList<GastoResumen>>(null);
  const posicionGastos = useRef(0);

  // Identifica la última consulta para descartar respuestas anteriores.
  const ultimaCarga = useRef(0);

  // Mantiene referencias a los datos y al estado actual de la pantalla.
  const gastosActuales = useRef(listaGastos);
  gastosActuales.current = listaGastos;
  const pantallaActiva = useRef(active);
  pantallaActiva.current = active;
  const montado = useRef(true);

  // Registra los gastos que tienen una eliminación en proceso.
  const borrandoGastos = useRef(new Set<GastoResumen["id"]>());

  // Indica si el componente sigue montado.
  useEffect(() => {
    montado.current = true;

    return () => {
      montado.current = false;
    };
  }, []);

  // Consulta en paralelo las finanzas y las metas.
  // Calcula los totales y prepara los datos que aparecen en Inicio.
  const cargarInicio = useCallback(async () => {
    const solicitud = ++ultimaCarga.current;

    try {
      const [datos, metas] = await Promise.all([consultarInicio(), listarMetas()]);
      const { user, perfil, gastos, categorias } = datos;

      // Descarta respuestas de una pantalla anterior o de una consulta superada.
      if (solicitud !== ultimaCarga.current) return;

      const resumen = resumirGastos(gastos);

      // Suma el dinero ahorrado en todas las metas.
      const ahorroEnMetas = metas.reduce(
        (total, meta) => total + Number(meta.monto_ahorrado),
        0,
      );

      const alertas = generarNotificaciones(datos, metas).length;

      // Obtiene un nombre disponible desde el perfil, los metadatos o el correo.
      setNombreUsuario(
        perfil?.nombre ||
        user.user_metadata?.nombre ||
        user.email?.split("@")[0] ||
        "Usuario",
      );

      setSueldoTotal(Number(perfil?.sueldo) || 0);
      setListaGastos(gastos);
      setTotalGastado(resumen.total);
      setTotalAhorrado(ahorroEnMetas);

      // Prepara cada categoría con su gasto acumulado y sus datos visuales.
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

      setNumeroAlertas(alertas);
      setPerfilCargado(true);
      setErrorPerfil(false);
    } catch (err: any) {
      // Ignora los errores de consultas que ya fueron reemplazadas.
      if (solicitud !== ultimaCarga.current) return;

      setErrorPerfil(true);
      console.error("Error al actualizar Inicio:", err.message);
    } finally {
      // Finaliza los indicadores de carga solo para la consulta más reciente.
      if (solicitud === ultimaCarga.current) {
        setCargandoPerfil(false);
        setRefrescando(false);
      }
    }
  }, []);

  // Actualiza los datos al entrar en Inicio y cierra las ediciones anteriores.
  // Al salir, invalida las consultas pendientes.
  useEffect(() => {
    // Detiene el indicador de actualización cuando la pantalla está inactiva.
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

  // 3. Modificar sueldo directamente en Supabase.
  // Valida el monto, lo actualiza en el perfil y cierra el formulario.
  const guardarNuevoSueldo = async () => {
    const valorLimpio = parseInt(nuevoSueldoInput.replace(/[^0-9]/g, ""));

    // Rechaza un sueldo inválido, igual a cero o negativo.
    if (isNaN(valorLimpio) || valorLimpio <= 0) {
      Alert.alert("Atención", "Ingresa un monto de sueldo válido.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Impide actualizar el sueldo cuando no hay un usuario autenticado.
      if (!user) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      const { error } = await supabase
        .from("perfiles")
        .update({ sueldo: valorLimpio })
        .eq("id", user.id);

      // Muestra el error y mantiene el formulario si falla la actualización.
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

  // 4. Borrar gasto de Supabase.
  // Evita eliminaciones simultáneas del mismo gasto y actualiza el resumen al terminar.
  const eliminarGasto = useCallback(
    async (idBorrar: GastoResumen["id"]) => {
      // No continúa si el gasto ya se está eliminando o el componente fue desmontado.
      if (borrandoGastos.current.has(idBorrar) || !montado.current) return;

      borrandoGastos.current.add(idBorrar);

      try {
        const { error } = await supabase
          .from("gastos")
          .delete()
          .eq("id", idBorrar);

        // Informa el error si Supabase no pudo eliminar el gasto.
        if (error) {
          Alert.alert("Error al eliminar", error.message);
          return;
        }

        // Cierra la edición si correspondía al gasto eliminado.
        setIdEditar((actual) => (actual === idBorrar ? null : actual));
        cargarInicio();
      } catch (err: any) {
        // Muestra el error únicamente si el componente sigue montado.
        if (montado.current) Alert.alert("Error", err.message);
      } finally {
        // Libera el identificador cuando termina el intento de eliminación.
        borrandoGastos.current.delete(idBorrar);
      }
    },
    [cargarInicio],
  );

  // Busca el gasto actual y solicita confirmación antes de eliminarlo.
  const borrarGasto = useCallback(
    (id: GastoResumen["id"]) => {
      const gasto = gastosActuales.current.find((item) => item.id === id);

      // Evita confirmar un gasto inexistente o que ya se está eliminando.
      if (!gasto || borrandoGastos.current.has(id)) return;

      confirmarEliminacion(
        "Eliminar gasto",
        `¿Quieres eliminar el gasto de «${gasto.categoria}» por $${Number(gasto.monto).toLocaleString("es-CL")}?`,
        () => {
          // Ejecuta el borrado si la pantalla sigue activa y el gasto todavía existe en la lista.
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

  // Selecciona un gasto y carga su monto en el formulario de edición.
  const prepararEdicion = useCallback((gasto: GastoResumen) => {
    setIdEditar(gasto.id);
    setMontoEditar(gasto.monto.toString());
  }, []);

  // 5. Editar monto de un gasto en Supabase.
  // Valida el nuevo monto, guarda el cambio y vuelve a cargar el resumen.
  const guardarEdicionGasto = async () => {
    // Evita guardar sin un gasto seleccionado o mientras ya hay un guardado en proceso.
    if (idEditar === null || guardandoGasto) return;

    const montoNum = parseInt(montoEditar.replace(/[^0-9]/g, ""));

    // Rechaza un monto inválido, igual a cero o negativo.
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

      // Informa el error si no fue posible actualizar el monto.
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
      // Habilita nuevamente los controles al terminar la operación.
      setGuardandoGasto(false);
    }
  };

  // Descuenta del sueldo los gastos y el dinero reservado en metas.
  // Con ese total calcula el estado del presupuesto y el saldo disponible.
  const totalDescontado = totalGastado + totalAhorrado;
  const estadoPresupuesto = calcularEstadoPresupuesto(
    sueldoTotal,
    totalDescontado,
  );
  const saldoDisponible = sueldoTotal - totalDescontado;

  // Muestra la carga inicial o la opción de reintentar hasta tener el primer resumen.
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

            {/* Vuelve a consultar los datos después de un error de carga. */}
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
      {/* Avisa si falló una actualización y se conservan los datos anteriores. */}
      {errorPerfil && (
        <Text className="text-error p-[12px]">
          No se pudo actualizar el resumen. Se muestran los últimos datos
          cargados.
        </Text>
      )}

      {/* Muestra el tutorial y permite desplazarse hasta Gestión de Gastos. */}
      <TutorialCard
        pantalla="Inicio"
        onNav={onNav}
        onAccion={(accion) => {
          // Desplaza la lista cuando el tutorial solicita mostrar los gastos.
          if (accion === "ver_gastos") {
            listaRef.current?.scrollToOffset({
              offset: Math.max(0, posicionGastos.current - 12),
              animated: true,
            });
          }
        }}
      />

      {/* Lista de gastos con el resumen financiero como encabezado. */}
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
          // Actualiza el resumen al deslizar la lista hacia abajo.
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

              {/* Abre Notificaciones y muestra la cantidad de alertas activas. */}
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
                  {/* Saldo disponible después de descontar gastos y ahorros. */}
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

                  {/* Montos de gastos y sueldo configurado. */}
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

                        {/* Abre la edición con el sueldo actual como valor inicial. */}
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

                  {/* Total de dinero reservado en las metas de ahorro. */}
                  <View className="flex-row flex-wrap items-center gap-[6px] mt-[10px]">
                    <Text
                      className="text-[10px]"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      En metas
                    </Text>
                    <Text className="text-card text-[13px] font-semibold">
                      ${totalAhorrado.toLocaleString("es-CL")}
                    </Text>
                  </View>
                </View>

                {/* Aro con el porcentaje disponible y el color del estado actual. */}
                <MiniBadge
                  percent={estadoPresupuesto.porcentajeDisponible}
                  color={estadoPresupuesto.color}
                  status={estadoPresupuesto.etiqueta}
                />
              </View>

              {/* Descripción del estado del presupuesto. */}
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
              {/* Invita a crear la primera categoría si no hay ninguna disponible. */}
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

              {/* Prepara una tarjeta con el gasto y la barra de cada categoría. */}
              {categoriasDinamicas.map((c) => {
                const p = Math.round((c.spent / c.limit) * 100);

                // Usa rojo desde el 100 %, amarillo desde el 80 % y el color propio en otro caso.
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

            {/* Guarda la posición de esta sección para que el tutorial pueda mostrarla. */}
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
            {/* Mensaje de la lista cuando no existen gastos registrados. */}
            <Text className="text-text-secondary text-center my-[10px]">
              Aún no hay gastos registrados.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View className="bg-card h-[12px] rounded-b-[14px]" />
        }
      />

      {/* Ventana de edición que se abre al seleccionar un gasto. */}
      <Modal
        visible={idEditar !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          // Permite cerrar la ventana si no hay un guardado en proceso.
          if (!guardandoGasto) setIdEditar(null);
        }}
      >
        {/* Ajusta el espacio de la ventana cuando aparece el teclado. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            className="flex-1 justify-center p-[20px]"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <View
              className="bg-card rounded-[14px] p-[20px]"
              style={layout.modal}
            >
              <View className="flex-row justify-between items-center mb-[12px]">
                <Text className="text-[16px] font-bold text-text">
                  Editar monto del gasto
                </Text>

                {/* Cierra la edición; se desactiva mientras se guarda el cambio. */}
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

              {/* Campo para ingresar el nuevo monto del gasto seleccionado. */}
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

              {/* Guarda el cambio y muestra un indicador durante la operación. */}
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

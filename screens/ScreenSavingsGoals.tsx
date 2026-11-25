import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, } from "react-native";
import { layout } from "../components/layout";
import ProgressBar from "../components/ProgressBar";
import { actualizarMeta, crearMeta, eliminarMeta, listarMetas, mensajeErrorMetas, registrarAporte, type MetaAhorro, } from "../database/metasService";
import { diasHastaFecha, fechaLocalValida, leerMontoMeta, porcentajeMeta, } from "../models/metas";
import TutorialCard from "../tutorial/TutorialCard";
import { confirmarEliminacion } from "../utils/confirmarEliminacion";

// Presenta los montos con el símbolo de dinero y el formato numérico de Chile.
const dinero = (monto: number) => `$${monto.toLocaleString("es-CL")}`;

// Nombres utilizados en el encabezado del calendario.
const mesesCalendario = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Orden de los días del calendario, comenzando por el lunes.
const diasSemana = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

// Cambia una fecha AAAA-MM-DD al formato DD/MM/AAAA para mostrarla.
function formatearFecha(fecha: string) {
  return fecha.split("-").reverse().join("/");
}

// Construye una fecha local al mediodía.
// El mes se indica desde 0 para enero hasta 11 para diciembre.
function fechaCalendario(anio: number, mes: number, dia: number) {
  const fecha = new Date(0);
  fecha.setHours(12, 0, 0, 0);
  fecha.setFullYear(anio, mes, dia);
  return fecha;
}

// Construye una fecha AAAA-MM-DD, completando sus partes con ceros.
function claveFecha(anio: number, mes: number, dia: number) {
  return [
    String(anio).padStart(4, "0"),
    String(mes + 1).padStart(2, "0"),
    String(dia).padStart(2, "0"),
  ].join("-");
}

// Botón reutilizable con apariencia principal o secundaria.
// Permite desactivar la interacción mientras se realiza una operación.
function Boton({
  texto,
  onPress,
  disabled = false,
  secundario = false,
}: {
  texto: string;
  onPress: () => void;
  disabled?: boolean;
  secundario?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className="rounded-[10px] px-[14px] py-[12px] items-center"
      style={{
        backgroundColor: secundario ? "#F5F3FA" : "#512DA8",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text
        className="font-semibold"
        style={{ color: secundario ? "#512DA8" : "#fff" }}
      >
        {texto}
      </Text>
    </Pressable>
  );
}

// Calendario para seleccionar o quitar la fecha objetivo de una meta.
// Comunica la selección mediante onSeleccionar y permite cerrarlo con onCerrar.
function CalendarioMeta({
  fecha,
  onSeleccionar,
  onCerrar,
}: {
  fecha: string;
  onSeleccionar: (fecha: string) => void;
  onCerrar: () => void;
}) {
  const hoy = new Date();

  // Determina el mes inicial del calendario.
  const [mesVisible, setMesVisible] = useState(() => {
    // Abre el mes de la fecha seleccionada si es válida.
    if (fecha && fechaLocalValida(fecha)) {
      const [anio, mes] = fecha.split("-").map(Number);
      return fechaCalendario(anio, mes - 1, 1);
    }

    // Si no hay una fecha válida, abre el mes actual.
    return fechaCalendario(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  // Calcula el mes mostrado, su cantidad de días y los espacios iniciales.
  const anio = mesVisible.getFullYear();
  const mes = mesVisible.getMonth();
  const nombreMes = mesesCalendario[mes] ?? "";
  const diasDelMes = fechaCalendario(anio, mes + 1, 0).getDate();
  const inicioSemana = (mesVisible.getDay() + 6) % 7;
  const fechaHoy = claveFecha(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  // Avanza o retrocede la cantidad de meses indicada.
  const cambiarMes = (paso: number) => {
    setMesVisible((actual) =>
      fechaCalendario(actual.getFullYear(), actual.getMonth() + paso, 1),
    );
  };

  return (
    <ScrollView>
      {/* Título y botón para cerrar el calendario. */}
      <View className="flex-row items-center justify-between mb-[12px]">
        <Text
          accessibilityRole="header"
          className="text-[20px] font-bold text-text"
        >
          Elige una fecha
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar calendario"
          onPress={onCerrar}
          hitSlop={6}
          className="p-[8px]"
        >
          <Feather name="x" size={20} color="#512DA8" />
        </Pressable>
      </View>

      <View className="bg-bg rounded-[14px] p-[8px]">
        {/* Controles para cambiar el mes visible. */}
        <View className="flex-row justify-between items-center mb-[6px]">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mes anterior"
            onPress={() => cambiarMes(-1)}
            className="bg-card rounded-[10px] p-[10px]"
          >
            <Feather name="chevron-left" size={20} color="#512DA8" />
          </Pressable>

          <Text
            accessibilityLiveRegion="polite"
            className="flex-1 px-[4px] text-center font-semibold text-text"
          >
            {nombreMes} {anio}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mes siguiente"
            onPress={() => cambiarMes(1)}
            className="bg-card rounded-[10px] p-[10px]"
          >
            <Feather name="chevron-right" size={20} color="#512DA8" />
          </Pressable>
        </View>

        {/* Encabezados de los días de la semana. */}
        <View className="flex-row">
          {diasSemana.map((nombre) => (
            <Text
              key={nombre}
              className="flex-1 py-[6px] text-center text-[12px] font-semibold text-text-secondary"
            >
              {nombre}
            </Text>
          ))}
        </View>

        {/* Construye seis filas para distribuir los días del mes. */}
        {Array.from({ length: 6 }, (_, semana) => (
          <View key={semana} className="flex-row">
            {diasSemana.map((nombre, columna) => {
              const dia = semana * diasSemana.length + columna - inicioSemana + 1;

              // Deja un espacio vacío si la casilla no corresponde a un día del mes.
              if (dia < 1 || dia > diasDelMes) {
                return <View key={nombre} className="flex-1 min-h-[40px]" />;
              }

              const valor = claveFecha(anio, mes, dia);
              const seleccionado = valor === fecha;
              const esHoy = valor === fechaHoy;
              const etiqueta = `${dia} de ${nombreMes.toLowerCase()} de ${anio}`;

              // Muestra el día y destaca la selección o la fecha actual.
              return (
                <Pressable
                  key={nombre}
                  accessibilityRole="button"
                  accessibilityLabel={esHoy ? `${etiqueta}, hoy` : etiqueta}
                  accessibilityState={{ selected: seleccionado }}
                  onPress={() => onSeleccionar(valor)}
                  className={`flex-1 min-h-[40px] items-center justify-center rounded-[10px] ${seleccionado ? "bg-primary" : ""}`}
                >
                  <Text
                    className={
                      seleccionado
                        ? "text-white font-semibold"
                        : esHoy
                          ? "text-primary font-bold"
                          : "text-text"
                    }
                  >
                    {dia}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Permite eliminar una fecha previamente seleccionada. */}
      {fecha ? (
        <View className="mt-[12px]">
          <Boton
            texto="Quitar fecha"
            onPress={() => onSeleccionar("")}
            secundario
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

// Pantalla para administrar metas de ahorro.
// Permite crear, editar, eliminar y registrar aportes o retiros.
export default function ScreenSavingsGoals({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  // Comprueba si esta pantalla está abierta.
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  focusedRef.current = focused;

  // Controla el montaje, las respuestas de consultas y los guardados simultáneos.
  const montado = useRef(true),
    version = useRef(0),
    guardandoRef = useRef(false);

  // Conserva las metas cuya eliminación está en proceso.
  const borrados = useRef(new Map<string, MetaAhorro>());

  // Guarda la lista de metas y mantiene una referencia a su contenido actual.
  const [metas, setMetas] = useState<MetaAhorro[]>([]);
  const metasRef = useRef(metas);
  metasRef.current = metas;

  // Controla los indicadores de carga y los mensajes de error.
  const [cargando, setCargando] = useState(true),
    [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState("");

  // Controla el formulario y la meta que se está editando.
  const [formulario, setFormulario] = useState(false),
    [editando, setEditando] = useState<MetaAhorro | null>(null);

  // Campos del formulario y visibilidad del calendario.
  const [eligiendoFecha, setEligiendoFecha] = useState(false);
  const [nombre, setNombre] = useState(""),
    [objetivo, setObjetivo] = useState(""),
    [inicial, setInicial] = useState("0"),
    [fecha, setFecha] = useState("");

  // Controla el movimiento de ahorro que se está registrando.
  const [aporteMeta, setAporteMeta] = useState<MetaAhorro | null>(null),
    [montoAporte, setMontoAporte] = useState("");
  const [retirar, setRetirar] = useState(false),
    [guardando, setGuardando] = useState(false);

  // Registra si el componente sigue montado.
  // Al desmontarlo, invalida las respuestas de consultas pendientes.
  useEffect(() => {
    montado.current = true;

    return () => {
      montado.current = false;
      version.current++;
    };
  }, []);

  // Consulta las metas y actualiza la lista.
  // Oculta las que todavía tienen una eliminación en proceso.
  const cargar = useCallback(async () => {
    const solicitud = ++version.current;

    try {
      const nuevas = await listarMetas();

      // Descarta la respuesta si el componente se desmontó o la consulta quedó desactualizada.
      if (!montado.current || solicitud !== version.current) return;

      setMetas(nuevas.filter((meta) => !borrados.current.has(meta.id)));
      setError("");
    } catch (e) {
      // Muestra el error únicamente si la consulta sigue vigente y el componente está montado.
      if (montado.current && solicitud === version.current)
        setError(mensajeErrorMetas(e));
    } finally {
      // Finaliza los indicadores de carga para la consulta vigente.
      if (montado.current && solicitud === version.current) {
        setCargando(false);
        setRefrescando(false);
      }
    }
  }, []);

  // Carga las metas al entrar e invalida las consultas pendientes al salir.
  useEffect(() => {
    // Detiene el indicador de actualización si esta pantalla está inactiva.
    if (!focused) {
      setRefrescando(false);
      return;
    }

    cargar();

    return () => {
      version.current++;
    };
  }, [focused, cargar]);

  // Limpia los campos y abre el formulario para crear una meta.
  const abrirNueva = () => {
    setEditando(null);
    setNombre("");
    setObjetivo("");
    setInicial("0");
    setFecha("");
    setEligiendoFecha(false);
    setFormulario(true);
  };

  // Carga los datos de una meta en el formulario de edición.
  const abrirEdicion = (meta: MetaAhorro) => {
    setEditando(meta);
    setNombre(meta.nombre);
    setObjetivo(String(meta.monto_objetivo));
    setFecha(meta.fecha_objetivo || "");
    setEligiendoFecha(false);
    setFormulario(true);
  };

  // Incorpora una meta confirmada a la lista local.
  // Actualiza la existente o añade la nueva al principio de la lista.
  const aplicar = (meta: MetaAhorro) => {
    version.current++;

    setMetas((actuales) =>
      actuales.some((m) => m.id === meta.id)
        ? actuales.map((m) => (m.id === meta.id ? meta : m))
        : [meta, ...actuales],
    );
  };

  // Valida el formulario y crea o actualiza la meta.
  // Al terminar correctamente, actualiza la lista y cierra el formulario.
  const guardar = async () => {
    // Evita ejecutar varios guardados al mismo tiempo.
    if (guardandoRef.current) return;

    const monto = leerMontoMeta(objetivo),
      ahorro = leerMontoMeta(inicial);

    // Exige un nombre que no esté vacío y que tenga hasta 80 caracteres.
    if (!nombre.trim() || nombre.trim().length > 80) {
      Alert.alert(
        "Nombre de la meta",
        "Escribe un nombre de hasta 80 caracteres.",
      );
      return;
    }

    // Exige un objetivo positivo y un ahorro inicial válido cuando se crea una meta.
    if (
      !Number.isFinite(monto) ||
      monto <= 0 ||
      (!editando && (!Number.isFinite(ahorro) || ahorro < 0))
    ) {
      Alert.alert(
        "Revisa los montos",
        "El objetivo debe ser mayor que cero y el ahorro inicial no puede ser negativo.",
      );
      return;
    }

    // Rechaza una fecha incorrecta cuando el usuario decidió agregarla.
    if (fecha.trim() && !fechaLocalValida(fecha.trim())) {
      Alert.alert(
        "Revisa la fecha",
        "Elige una fecha válida en el calendario.",
      );
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);

    try {
      const datos = {
        nombre: nombre.trim(),
        monto_objetivo: monto,
        fecha_objetivo: fecha.trim() || null,
      };

      // Elige la operación según se esté editando una meta o creando una nueva.
      const meta = editando
        ? await actualizarMeta(editando.id, datos)
        : await crearMeta({ ...datos, monto_ahorrado: ahorro });

      // Actualiza la interfaz solamente si el componente sigue montado.
      if (montado.current) {
        aplicar(meta);
        setFormulario(false);
        setError("");
      }
    } catch (e) {
      // Muestra el error si la pantalla todavía está montada.
      if (montado.current)
        Alert.alert("No se pudo guardar", mensajeErrorMetas(e));
    } finally {
      guardandoRef.current = false;

      // Finaliza el indicador de guardado si el componente sigue montado.
      if (montado.current) setGuardando(false);
    }
  };

  // Solicita confirmación antes de eliminar una meta.
  // Informa si su ahorro volverá a quedar disponible.
  const pedirEliminarMeta = (meta: MetaAhorro) => {
    // Evita confirmar una eliminación repetida o iniciarla durante un guardado.
    if (borrados.current.has(meta.id) || guardandoRef.current) return;

    const mensaje = `¿Quieres eliminar la meta «${meta.nombre}» y su registro de progreso?`;
    const devolucion =
      meta.monto_ahorrado > 0
        ? " El ahorro de esta meta volverá a tu saldo disponible."
        : "";

    confirmarEliminacion(
      "Eliminar meta",
      mensaje + devolucion,
      () => {
        // Elimina solo si la pantalla sigue activa y la meta continúa en la lista.
        if (
          montado.current &&
          focusedRef.current &&
          metasRef.current.some((m) => m.id === meta.id)
        ) {
          void borrar(meta);
        }
      },
    );
  };

  // Retira la meta de la lista mientras confirma su eliminación.
  // Si la operación falla, la restaura y muestra un aviso.
  const borrar = async (meta: MetaAhorro) => {
    // No inicia otra eliminación de la misma meta ni elimina durante un guardado.
    if (borrados.current.has(meta.id) || guardandoRef.current) return;

    borrados.current.set(meta.id, meta);
    version.current++;
    setMetas((actuales) => actuales.filter((m) => m.id !== meta.id));

    try {
      await eliminarMeta(meta.id);
    } catch (e) {
      // Restaura la meta y muestra el error si el componente sigue montado.
      if (montado.current) {
        setMetas((actuales) =>
          actuales.some((m) => m.id === meta.id)
            ? actuales
            : [...actuales, meta],
        );

        Alert.alert("No se pudo eliminar", mensajeErrorMetas(e));
      }
    } finally {
      borrados.current.delete(meta.id);
      version.current++;

      // Recarga al terminar todas las eliminaciones pendientes si la pantalla está activa.
      if (montado.current && focusedRef.current && !borrados.current.size)
        cargar();
    }
  };

  // Registra un aporte o retiro en la meta seleccionada.
  // Los retiros se envían como montos negativos y los aportes como positivos.
  const aportar = async () => {
    // Exige una meta seleccionada y evita movimientos simultáneos.
    if (!aporteMeta || guardandoRef.current) return;

    const monto = leerMontoMeta(montoAporte);

    // Solicita un monto numérico, finito y mayor que cero.
    if (!Number.isFinite(monto) || monto <= 0) {
      Alert.alert("Revisa el monto", "Ingresa un monto mayor que cero.");
      return;
    }

    // Impide retirar un monto mayor que el ahorro registrado en la meta.
    if (retirar && monto > aporteMeta.monto_ahorrado) {
      Alert.alert(
        "Ahorro insuficiente",
        "El retiro no puede superar el ahorro de esta meta.",
      );
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);

    try {
      const meta = await registrarAporte(
        aporteMeta.id,
        retirar ? -monto : monto,
      );

      // Actualiza la meta y cierra el formulario si el componente sigue montado.
      if (montado.current) {
        aplicar(meta);
        setAporteMeta(null);
        setMontoAporte("");
        setError("");
      }
    } catch (e) {
      // Informa que el resultado es incierto y consulta el ahorro actualizado.
      if (montado.current) {
        setAporteMeta(null);

        Alert.alert(
          "Revisa el ahorro actualizado",
          "No se pudo confirmar el movimiento. Actualiza la meta antes de repetirlo para evitar un aporte duplicado.",
        );

        setError(
          `No se pudo confirmar el movimiento. Actualiza la meta y revisa el ahorro antes de volver a intentarlo. ${mensajeErrorMetas(e)}`,
        );

        // No se reintenta un aporte automáticamente: podría haberse confirmado en el servidor.
        cargar();
      }
    } finally {
      guardandoRef.current = false;

      // Finaliza el indicador de guardado si el componente sigue montado.
      if (montado.current) setGuardando(false);
    }
  };

  // Suma el ahorro registrado en las metas de la lista actual.
  const resumen = metas.reduce((total, m) => total + m.monto_ahorrado, 0);

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        data={metas}
        keyExtractor={(meta) => meta.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        refreshing={refrescando}
        onRefresh={() => {
          // Actualiza las metas al deslizar la lista hacia abajo.
          setRefrescando(true);
          cargar();
        }}
        ListHeaderComponent={
          <View className="mb-[16px]">
            <TutorialCard pantalla="Metas" onNav={onNav} />

            {/* Encabezado y acceso al formulario para crear una meta. */}
            <View className="flex-row justify-between items-center mb-[12px]">
              <Text className="text-[22px] font-bold text-text">
                Metas de ahorro
              </Text>
              <Boton
                texto="+ Nueva"
                onPress={abrirNueva}
                disabled={guardando}
              />
            </View>

            <Text className="text-text-secondary">
              Ahorro registrado: {dinero(resumen)}
            </Text>
            <Text className="text-text-secondary text-[12px] mt-[8px]">
              Los aportes bajan tu saldo disponible y los retiros lo aumentan.
            </Text>

            {/* Abre la sección de notificaciones. */}
            <Pressable
              accessibilityRole="button"
              onPress={() => onNav(6)}
              className="py-[12px]"
            >
              <Text className="text-primary font-semibold">
                Ver avisos de mis metas
              </Text>
            </Pressable>

            {/* Muestra el error de carga y permite volver a consultar. */}
            {error ? (
              <View className="bg-card p-[14px] rounded-[12px]">
                <Text accessibilityRole="alert" className="text-error">
                  {error}
                </Text>
                <Boton texto="Reintentar" onPress={cargar} secundario />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          cargando ? (
            <ActivityIndicator size="large" color="#512DA8" />
          ) : error ? null : (
            <View className="bg-card p-[20px] rounded-[16px]">
              <Text className="text-text font-semibold">
                Aún no tienes metas
              </Text>
              <Text className="text-text-secondary mt-[8px]">
                Crea una meta para ver tu progreso y recibir avisos de su avance
                o fecha.
              </Text>
            </View>
          )
        }
        renderItem={({ item: meta }) => {
          // Prepara el estado de cada meta según su avance y su fecha objetivo.
          const completa = meta.monto_ahorrado >= meta.monto_objetivo;
          const dias = meta.fecha_objetivo
            ? diasHastaFecha(meta.fecha_objetivo)
            : null;
          const color = completa
            ? "#2E7D32"
            : dias !== null && dias < 0
              ? "#C62828"
              : "#512DA8";

          return (
            <View className="bg-card rounded-[16px] p-[16px] mb-[12px]">
              {/* Nombre de la meta y porcentaje de avance. */}
              <View className="flex-row items-center justify-between mb-[12px]">
                <Text className="text-[17px] font-bold text-text flex-1">
                  {meta.nombre}
                </Text>
                <Text style={{ color, fontWeight: "700" }}>
                  {porcentajeMeta(meta)}%
                </Text>
              </View>

              <ProgressBar percent={porcentajeMeta(meta)} color={color} />

              {/* Ahorro registrado, objetivo y estado actual. */}
              <Text className="text-text mt-[10px]">
                {dinero(meta.monto_ahorrado)} de {dinero(meta.monto_objetivo)}
              </Text>
              <Text className="text-[12px] mt-[6px]" style={{ color }}>
                {completa
                  ? "¡Meta alcanzada!"
                  : dias !== null && dias < 0
                    ? "Fecha vencida: puedes actualizarla o seguir ahorrando."
                    : "En progreso"}
              </Text>

              {meta.fecha_objetivo ? (
                <Text className="text-text-secondary text-[12px] mt-[4px]">
                  Fecha objetivo: {formatearFecha(meta.fecha_objetivo)}
                </Text>
              ) : null}

              {/* Acciones para registrar movimientos, editar o eliminar la meta. */}
              <View className="flex-row items-center justify-between mt-[12px]">
                <Boton
                  texto="Registrar movimiento"
                  disabled={guardando}
                  onPress={() => {
                    // Abre el formulario de movimientos en modo aporte.
                    setAporteMeta(meta);
                    setMontoAporte("");
                    setRetirar(false);
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Editar meta ${meta.nombre}`}
                  hitSlop={8}
                  onPress={() => abrirEdicion(meta)}
                  disabled={guardando}
                  className="p-[10px]"
                >
                  <Feather name="edit-2" size={20} color="#512DA8" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar meta ${meta.nombre}`}
                  hitSlop={8}
                  onPress={() => pedirEliminarMeta(meta)}
                  disabled={guardando}
                  className="p-[10px]"
                >
                  <Feather name="trash-2" size={20} color="#C62828" />
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* Modal para crear o editar una meta y seleccionar su fecha. */}
      <Modal
        visible={formulario && focused}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // Impide cerrar mediante esta acción mientras se guarda.
          if (guardando) return;

          // Cierra primero el calendario si está abierto.
          if (eligiendoFecha) {
            setEligiendoFecha(false);
            return;
          }

          setFormulario(false);
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
            <View
              className="bg-card rounded-[16px] p-[20px] max-h-[90%]"
              style={layout.modal}
            >
              {/* Calendario que actualiza la fecha y vuelve al formulario. */}
              {eligiendoFecha && (
                <CalendarioMeta
                  fecha={fecha}
                  onSeleccionar={(seleccion) => {
                    setFecha(seleccion);
                    setEligiendoFecha(false);
                  }}
                  onCerrar={() => setEligiendoFecha(false)}
                />
              )}

              {/* Conserva el formulario oculto mientras se utiliza el calendario. */}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={eligiendoFecha ? { display: "none" } : undefined}
              >
                <Text className="text-[20px] font-bold text-text mb-[16px]">
                  {editando ? "Editar meta" : "Nueva meta"}
                </Text>

                <Text className="text-text-secondary mb-[6px]">Nombre</Text>
                <TextInput
                  accessibilityLabel="Nombre de la meta"
                  autoFocus
                  maxLength={80}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Ej. Fondo de emergencia"
                  editable={!guardando}
                  className="bg-bg p-[12px] rounded-[10px] text-text mb-[12px]"
                />

                <Text className="text-text-secondary mb-[6px]">
                  Monto objetivo ($)
                </Text>
                <TextInput
                  accessibilityLabel="Monto objetivo"
                  value={objetivo}
                  onChangeText={setObjetivo}
                  keyboardType="decimal-pad"
                  placeholder="100000"
                  editable={!guardando}
                  className="bg-bg p-[12px] rounded-[10px] text-text mb-[12px]"
                />

                {/* El ahorro inicial se solicita únicamente al crear una meta. */}
                {!editando ? (
                  <>
                    <Text className="text-text-secondary mb-[6px]">
                      Ahorro inicial ($)
                    </Text>
                    <TextInput
                      accessibilityLabel="Ahorro inicial"
                      value={inicial}
                      onChangeText={setInicial}
                      keyboardType="decimal-pad"
                      editable={!guardando}
                      className="bg-bg p-[12px] rounded-[10px] text-text"
                    />
                    <Text className="text-text-secondary text-[12px] mt-[4px] mb-[12px]">
                      Este monto se descontará de tu saldo disponible.
                    </Text>
                  </>
                ) : null}

                <Text className="text-text-secondary mb-[6px]">
                  Fecha objetivo (opcional)
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    fecha
                      ? `Cambiar fecha objetivo, ${formatearFecha(fecha)}`
                      : "Seleccionar fecha objetivo"
                  }
                  disabled={guardando}
                  onPress={() => {
                    // Oculta el teclado antes de abrir el calendario.
                    Keyboard.dismiss();
                    setEligiendoFecha(true);
                  }}
                  className="bg-bg flex-row items-center gap-[10px] p-[12px] rounded-[10px] mb-[16px]"
                >
                  <Feather name="calendar" size={19} color="#512DA8" />
                  <Text
                    className={
                      fecha ? "flex-1 text-text" : "flex-1 text-text-secondary"
                    }
                  >
                    {fecha ? formatearFecha(fecha) : "Seleccionar fecha"}
                  </Text>
                  <Feather name="chevron-right" size={18} color="#512DA8" />
                </Pressable>

                {/* Guarda la meta o permite cerrar el formulario sin guardarla. */}
                <Boton
                  texto={guardando ? "Guardando…" : "Guardar meta"}
                  onPress={guardar}
                  disabled={guardando}
                />
                <View className="mt-[8px]">
                  <Boton
                    texto="Cancelar"
                    onPress={() => setFormulario(false)}
                    disabled={guardando}
                    secundario
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal para registrar un aporte o retiro en la meta seleccionada. */}
      <Modal
        visible={aporteMeta !== null && focused}
        transparent
        animationType="fade"
        onRequestClose={() => {
          // Permite cerrar únicamente cuando no se está guardando un movimiento.
          if (!guardando) setAporteMeta(null);
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
            <View
              className="bg-card rounded-[16px] p-[20px]"
              style={layout.modal}
            >
              <Text className="text-[18px] font-bold text-text mb-[8px]">
                {aporteMeta?.nombre}
              </Text>
              <Text className="text-text-secondary mb-[12px]">
                Ahorro actual: {dinero(aporteMeta?.monto_ahorrado || 0)}
              </Text>

              {/* Selección del tipo de movimiento. */}
              <View className="flex-row gap-[8px] mb-[14px]">
                <Boton
                  texto="Aportar"
                  secundario={retirar}
                  disabled={guardando}
                  onPress={() => setRetirar(false)}
                />
                <Boton
                  texto="Retirar"
                  secundario={!retirar}
                  disabled={guardando}
                  onPress={() => setRetirar(true)}
                />
              </View>

              <TextInput
                accessibilityLabel="Monto del movimiento"
                autoFocus
                value={montoAporte}
                onChangeText={setMontoAporte}
                keyboardType="decimal-pad"
                placeholder="Monto ($)"
                editable={!guardando}
                className="bg-bg p-[12px] rounded-[10px] text-text mb-[16px]"
              />

              {/* Registra el movimiento y adapta el texto al tipo seleccionado. */}
              <Boton
                texto={
                  guardando
                    ? "Guardando…"
                    : retirar
                      ? "Registrar retiro"
                      : "Registrar aporte"
                }
                onPress={aportar}
                disabled={guardando}
              />
              <View className="mt-[8px]">
                <Boton
                  texto="Cancelar"
                  secundario
                  onPress={() => setAporteMeta(null)}
                  disabled={guardando}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

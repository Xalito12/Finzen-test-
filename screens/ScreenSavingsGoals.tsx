import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import ProgressBar from "../components/ProgressBar";
import { confirmarEliminacion } from "../utils/confirmarEliminacion";
import {
  actualizarMeta,
  crearMeta,
  eliminarMeta,
  listarMetas,
  mensajeErrorMetas,
  registrarAporte,
  type MetaAhorro,
} from "../database/metasService";
import {
  diasHastaFecha,
  fechaLocalValida,
  leerMontoMeta,
  porcentajeMeta,
} from "../models/metas";

const dinero = (monto: number) => `$${monto.toLocaleString("es-CL")}`;
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

export default function ScreenSavingsGoals({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  const montado = useRef(true),
    version = useRef(0),
    guardandoRef = useRef(false);
  const borrados = useRef(new Map<string, MetaAhorro>());
  const [metas, setMetas] = useState<MetaAhorro[]>([]);
  const metasRef = useRef(metas);
  metasRef.current = metas;
  const [cargando, setCargando] = useState(true),
    [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState("");
  const [formulario, setFormulario] = useState(false),
    [editando, setEditando] = useState<MetaAhorro | null>(null);
  const [nombre, setNombre] = useState(""),
    [objetivo, setObjetivo] = useState(""),
    [inicial, setInicial] = useState("0"),
    [fecha, setFecha] = useState("");
  const [aporteMeta, setAporteMeta] = useState<MetaAhorro | null>(null),
    [montoAporte, setMontoAporte] = useState("");
  const [retirar, setRetirar] = useState(false),
    [guardando, setGuardando] = useState(false);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      version.current++;
    };
  }, []);
  const cargar = useCallback(async () => {
    const solicitud = ++version.current;
    try {
      const nuevas = await listarMetas();
      if (!montado.current || solicitud !== version.current) return;
      setMetas(nuevas.filter((meta) => !borrados.current.has(meta.id)));
      setError("");
    } catch (e) {
      if (montado.current && solicitud === version.current)
        setError(mensajeErrorMetas(e));
    } finally {
      if (montado.current && solicitud === version.current) {
        setCargando(false);
        setRefrescando(false);
      }
    }
  }, []);
  useEffect(() => {
    if (!focused) {
      setRefrescando(false);
      return;
    }
    cargar();
    return () => {
      version.current++;
    };
  }, [focused, cargar]);
  const abrirNueva = () => {
    setEditando(null);
    setNombre("");
    setObjetivo("");
    setInicial("0");
    setFecha("");
    setFormulario(true);
  };
  const abrirEdicion = (meta: MetaAhorro) => {
    setEditando(meta);
    setNombre(meta.nombre);
    setObjetivo(String(meta.monto_objetivo));
    setFecha(meta.fecha_objetivo || "");
    setFormulario(true);
  };
  const aplicar = (meta: MetaAhorro) => {
    version.current++;
    setMetas((actuales) =>
      actuales.some((m) => m.id === meta.id)
        ? actuales.map((m) => (m.id === meta.id ? meta : m))
        : [meta, ...actuales],
    );
  };
  const guardar = async () => {
    if (guardandoRef.current) return;
    const monto = leerMontoMeta(objetivo),
      ahorro = leerMontoMeta(inicial);
    if (!nombre.trim() || nombre.trim().length > 80) {
      Alert.alert(
        "Nombre de la meta",
        "Escribe un nombre de hasta 80 caracteres.",
      );
      return;
    }
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
    if (fecha.trim() && !fechaLocalValida(fecha.trim())) {
      Alert.alert(
        "Revisa la fecha",
        "Usa una fecha válida con formato AAAA-MM-DD, por ejemplo 2027-06-30.",
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
      const meta = editando
        ? await actualizarMeta(editando.id, datos)
        : await crearMeta({ ...datos, monto_ahorrado: ahorro });
      if (montado.current) {
        aplicar(meta);
        setFormulario(false);
        setError("");
      }
    } catch (e) {
      if (montado.current)
        Alert.alert("No se pudo guardar", mensajeErrorMetas(e));
    } finally {
      guardandoRef.current = false;
      if (montado.current) setGuardando(false);
    }
  };
  const pedirEliminarMeta = (meta: MetaAhorro) => {
    if (borrados.current.has(meta.id) || guardandoRef.current) return;
    confirmarEliminacion(
      "Eliminar meta",
      `¿Quieres eliminar la meta «${meta.nombre}» y su registro de progreso?`,
      () => {
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
  const borrar = async (meta: MetaAhorro) => {
    if (borrados.current.has(meta.id) || guardandoRef.current) return;
    borrados.current.set(meta.id, meta);
    version.current++;
    setMetas((actuales) => actuales.filter((m) => m.id !== meta.id));
    try {
      await eliminarMeta(meta.id);
    } catch (e) {
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
      if (montado.current && focusedRef.current && !borrados.current.size)
        cargar();
    }
  };
  const aportar = async () => {
    if (!aporteMeta || guardandoRef.current) return;
    const monto = leerMontoMeta(montoAporte);
    if (!Number.isFinite(monto) || monto <= 0) {
      Alert.alert("Revisa el monto", "Ingresa un monto mayor que cero.");
      return;
    }
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
      if (montado.current) {
        aplicar(meta);
        setAporteMeta(null);
        setMontoAporte("");
        setError("");
      }
    } catch (e) {
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
      if (montado.current) setGuardando(false);
    }
  };
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
          setRefrescando(true);
          cargar();
        }}
        ListHeaderComponent={
          <View className="mb-[16px]">
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
              Registra aquí el dinero que apartaste. Los aportes y retiros no
              cambian tu sueldo ni crean gastos automáticamente.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => onNav(6)}
              className="py-[12px]"
            >
              <Text className="text-primary font-semibold">
                Ver avisos de mis metas
              </Text>
            </Pressable>
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
              <View className="flex-row items-center justify-between mb-[12px]">
                <Text className="text-[17px] font-bold text-text flex-1">
                  {meta.nombre}
                </Text>
                <Text style={{ color, fontWeight: "700" }}>
                  {porcentajeMeta(meta)}%
                </Text>
              </View>
              <ProgressBar percent={porcentajeMeta(meta)} color={color} />
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
                  Fecha objetivo:{" "}
                  {meta.fecha_objetivo.split("-").reverse().join("/")}
                </Text>
              ) : null}
              <View className="flex-row items-center justify-between mt-[12px]">
                <Boton
                  texto="Registrar movimiento"
                  disabled={guardando}
                  onPress={() => {
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
      <Modal
        visible={formulario && focused}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!guardando) setFormulario(false);
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
            <View className="bg-card rounded-[16px] p-[20px] max-h-[90%]">
              <ScrollView keyboardShouldPersistTaps="handled">
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
                      className="bg-bg p-[12px] rounded-[10px] text-text mb-[12px]"
                    />
                  </>
                ) : null}
                <Text className="text-text-secondary mb-[6px]">
                  Fecha objetivo (opcional)
                </Text>
                <TextInput
                  accessibilityLabel="Fecha objetivo de la meta"
                  value={fecha}
                  onChangeText={setFecha}
                  placeholder="AAAA-MM-DD"
                  maxLength={10}
                  autoCapitalize="none"
                  editable={!guardando}
                  className="bg-bg p-[12px] rounded-[10px] text-text mb-[16px]"
                />
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
      <Modal
        visible={aporteMeta !== null && focused}
        transparent
        animationType="fade"
        onRequestClose={() => {
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
            <View className="bg-card rounded-[16px] p-[20px]">
              <Text className="text-[18px] font-bold text-text mb-[8px]">
                {aporteMeta?.nombre}
              </Text>
              <Text className="text-text-secondary mb-[12px]">
                Ahorro actual: {dinero(aporteMeta?.monto_ahorrado || 0)}
              </Text>
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

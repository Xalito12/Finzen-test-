import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import TutorialCard from "../tutorial/TutorialCard";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { consultarInicio } from "../database/consultasFinanzas";
import {
  listarMetas,
  mensajeErrorMetas,
  type MetaAhorro,
} from "../database/metasService";
import {
  generarNotificaciones,
  type DatosNotificaciones,
  type NivelNotificacion,
} from "../models/notificaciones";

const colores: Record<NivelNotificacion, string> = {
  critica: "#C62828",
  aviso: "#946000",
  logro: "#2E7D32",
};
const etiquetas: Record<NivelNotificacion, string> = {
  critica: "Crítica",
  aviso: "Atención",
  logro: "Logro",
};

function detalleError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error)
    return String(error.message);
  return "No se pudieron consultar los datos.";
}

export default function ScreenNotifications({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  const focused = useIsFocused();
  const solicitudActual = useRef(0);
  const [datos, setDatos] = useState<DatosNotificaciones | null>(null);
  const [metas, setMetas] = useState<MetaAhorro[]>([]);
  const [errores, setErrores] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [momento, setMomento] = useState(() => new Date());

  const cargar = useCallback(async () => {
    const solicitud = ++solicitudActual.current;
    const [finanzas, objetivos] = await Promise.allSettled([
      consultarInicio(),
      listarMetas(),
    ]);
    if (solicitud !== solicitudActual.current) return;
    const fallos: string[] = [];
    // Una fuente fallida nunca borra los últimos datos de la otra.
    if (finanzas.status === "fulfilled") setDatos(finanzas.value);
    else
      fallos.push(
        `Presupuesto: ${detalleError(finanzas.reason)} Se conservarán los últimos datos disponibles.`,
      );
    if (objetivos.status === "fulfilled") setMetas(objetivos.value);
    else
      fallos.push(
        `Metas: ${mensajeErrorMetas(objetivos.reason)} El estado de las metas podría estar desactualizado; el presupuesto se comprueba por separado.`,
      );
    setErrores(fallos);
    setMomento(new Date());
    setCargando(false);
    setRefrescando(false);
  }, []);

  useEffect(() => {
    if (!focused) {
      setRefrescando(false);
      return;
    }
    cargar();
    // Recalcula fechas si se deja esta pantalla abierta durante la medianoche.
    const reloj = setInterval(() => setMomento(new Date()), 60000);
    return () => {
      solicitudActual.current += 1;
      clearInterval(reloj);
    };
  }, [focused, cargar]);

  const alertas = useMemo(
    () => generarNotificaciones(datos, metas, momento),
    [datos, metas, momento],
  );
  const actualizar = () => {
    setRefrescando(true);
    cargar();
  };

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        data={alertas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 24, flexGrow: 1 }}
        initialNumToRender={8}
        keyboardShouldPersistTaps="handled"
        refreshing={refrescando}
        onRefresh={actualizar}
        ListHeaderComponent={
          <View>
            <TutorialCard pantalla="Notificaciones" onNav={onNav} />
            <Text className="text-[20px] font-bold text-text mb-[8px]">
              Notificaciones
            </Text>
            <Text className="text-[13px] text-text-secondary mb-[16px]">
              Alertas activas calculadas con tus gastos, presupuesto y metas. Se
              actualizan al entrar o deslizar hacia abajo.
            </Text>
            {errores.length > 0 && (
              <View className="bg-card p-[14px] rounded-[14px] mb-[16px]">
                {errores.map((mensaje, indice) => (
                  <Text
                    key={indice}
                    accessibilityRole="alert"
                    className="text-error text-[12px] mb-[8px]"
                  >
                    {mensaje}
                  </Text>
                ))}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reintentar la carga de notificaciones"
                  onPress={actualizar}
                  className="py-[10px]"
                >
                  <Text className="text-primary font-bold">Reintentar</Text>
                </Pressable>
              </View>
            )}
            {cargando && (
              <ActivityIndicator
                size="large"
                color="#512DA8"
                style={{ marginVertical: 20 }}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          !cargando ? (
            <View className="bg-card rounded-[16px] p-[20px] items-center">
              <Feather
                name={errores.length ? "wifi-off" : "check-circle"}
                size={30}
                color={errores.length ? "#946000" : "#2E7D32"}
              />
              <Text className="text-[16px] font-bold text-text mt-[12px]">
                {errores.length
                  ? "No hay alertas disponibles con los datos cargados"
                  : "Todo en orden"}
              </Text>
              <Text className="text-[13px] text-text-secondary mt-[8px] text-center">
                {errores.length
                  ? "Reintenta para comprobar el estado actual de tu cuenta."
                  : "Tus datos actuales no generan alertas. Aquí aparecerán si te acercas a un límite o cambia el estado de una meta."}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View
            className="bg-card rounded-[14px] p-[16px] mb-[12px]"
            style={{
              borderLeftWidth: 4,
              borderLeftColor: colores[item.severidad],
            }}
          >
            <Text
              className="font-bold text-[11px] mb-[6px]"
              style={{ color: colores[item.severidad] }}
            >
              {etiquetas[item.severidad]}
            </Text>
            <Text className="text-[15px] font-bold text-text mb-[6px]">
              {item.titulo}
            </Text>
            <Text className="text-[13px] text-text-secondary">
              {item.descripcion}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.accion}: ${item.titulo}`}
              onPress={() => onNav(item.destino)}
              className="py-[12px] mt-[4px]"
            >
              <Text className="text-primary font-semibold">
                {item.accion} →
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

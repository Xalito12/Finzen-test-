import React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useTutorial } from "./TutorialProvider";
import type { AccionInterfazTutorial, PantallaTutorial } from "./pasos";

export interface TutorialCardProps {
  pantalla: PantallaTutorial;
  onNav: (destino: number) => void;
  onAccion?: (accion: AccionInterfazTutorial) => void;
  puedeContinuar?: boolean;
}

export default function TutorialCard({
  pantalla,
  onNav,
  onAccion,
  puedeContinuar = false,
}: TutorialCardProps) {
  const tutorial = useTutorial();
  const { height } = useWindowDimensions();
  if (!tutorial.activo || tutorial.cargando) return null;
  const { paso } = tutorial;
  const ir = (destino: number | null) => {
    if (destino !== null) onNav(destino);
  };
  if (paso.pantalla !== pantalla) {
    return (
      <View className="bg-card border-[1px] border-border rounded-[14px] p-[14px] mb-[16px]">
        <Text className="text-primary font-bold">
          Tutorial en curso · Paso {tutorial.pasoNumero} de{" "}
          {tutorial.totalPasos}
        </Text>
        <Text className="text-text-secondary text-[12px] mt-[4px]">
          Puedes explorar libremente. La guía continúa en{" "}
          {paso.pantalla === "Categorias" ? "Categorías" : paso.pantalla}.
        </Text>
        <View className="flex-row flex-wrap gap-[8px] mt-[8px]">
          <Pressable
            accessibilityRole="button"
            onPress={() => onNav(paso.ruta)}
            className="py-[12px] px-[12px] bg-primary rounded-[10px]"
          >
            <Text className="text-card font-semibold">Continuar tutorial</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={tutorial.omitir}
            className="py-[12px] px-[12px]"
          >
            <Text className="text-text-secondary">Omitir tutorial</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  const crearCategoria = () => {
    if (onAccion) onAccion("crear_categoria");
    else onNav(3);
  };
  const puedeAvanzar = paso.id !== "categorias" || puedeContinuar;
  return (
    <View className="bg-card border-[1px] border-primary rounded-[16px] p-[16px] mb-[16px]">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        style={{ maxHeight: Math.max(140, Math.min(320, height * 0.42)) }}
      >
        <View className="flex-row items-center justify-between mb-[8px]">
          <Text className="text-primary text-[12px] font-bold">
            GUÍA FINZEN
          </Text>
          <Text className="text-text-secondary text-[12px]">
            Paso {tutorial.pasoNumero} de {tutorial.totalPasos}
          </Text>
        </View>
        <View className="h-[4px] bg-border rounded-[10px] overflow-hidden mb-[12px]">
          <View
            className="h-full bg-primary"
            style={{
              width: `${(tutorial.pasoNumero / tutorial.totalPasos) * 100}%`,
            }}
          />
        </View>
        <Text
          accessibilityRole="header"
          className="text-text font-bold text-[17px] mb-[8px]"
        >
          {paso.titulo}
        </Text>
        {paso.explicaciones.map((texto, indice) => (
          <Text
            key={indice}
            className="text-text-secondary text-[12px] mb-[8px]"
          >
            {texto}
          </Text>
        ))}
        {tutorial.mensaje ? (
          <Text
            accessibilityRole="alert"
            className="text-error text-[12px] mb-[8px]"
          >
            {tutorial.mensaje}
          </Text>
        ) : null}
        <View className="flex-row flex-wrap items-center gap-[8px] mt-[4px]">
          {paso.id === "categorias" && (
            <Pressable
              accessibilityRole="button"
              onPress={crearCategoria}
              className="bg-primary rounded-[10px] py-[12px] px-[14px]"
            >
              <Text className="text-card font-semibold">Crear categoría</Text>
            </Pressable>
          )}
          {paso.id === "gestion" && onAccion && (
            <Pressable
              accessibilityRole="button"
              onPress={() => onAccion("ver_gastos")}
              className="bg-bg rounded-[10px] py-[12px] px-[14px]"
            >
              <Text className="text-primary font-semibold">
                Ver Gestión de gastos
              </Text>
            </Pressable>
          )}
          {puedeAvanzar && (
            <Pressable
              accessibilityRole="button"
              onPress={() => ir(tutorial.avanzar())}
              className="bg-primary rounded-[10px] py-[12px] px-[14px]"
            >
              <Text className="text-card font-semibold">{paso.siguiente}</Text>
            </Pressable>
          )}
          {tutorial.pasoNumero > 1 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => ir(tutorial.retroceder())}
              className="py-[12px] px-[10px]"
            >
              <Text className="text-primary font-semibold">Atrás</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={tutorial.omitir}
            className="py-[12px] px-[10px]"
          >
            <Text className="text-text-secondary">Omitir tutorial</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

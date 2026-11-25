import React from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions, } from "react-native";
import { useTutorial } from "./TutorialProvider";
import type { AccionInterfazTutorial, PantallaTutorial } from "./pasos";

// Define los datos y las acciones que recibe la tarjeta del tutorial.
export interface TutorialCardProps {
  // Pantalla donde se está mostrando la tarjeta.
  pantalla: PantallaTutorial;

  // Permite navegar a una pantalla mediante su código numérico.
  onNav: (destino: number) => void;

  // Permite solicitar acciones a la pantalla, como mostrar los gastos.
  onAccion?: (accion: AccionInterfazTutorial) => void;

  // Autoriza avanzar desde el paso de categorías.
  puedeContinuar?: boolean;
}

// Muestra las instrucciones del paso actual y los controles del tutorial.
// Si el usuario está en otra pantalla, muestra un acceso para retomar la guía.
export default function TutorialCard({
  pantalla,
  onNav,
  onAccion,
  puedeContinuar = false,
}: TutorialCardProps) {
  const tutorial = useTutorial();
  const { height } = useWindowDimensions();

  // Oculta la tarjeta cuando el tutorial está desactivado o todavía se está cargando.
  if (!tutorial.activo || tutorial.cargando) return null;

  const { paso } = tutorial;

  // Navega al destino indicado por una acción del tutorial.
  const ir = (destino: number | null) => {
    // Solo cambia de pantalla cuando se recibe un destino.
    if (destino !== null) onNav(destino);
  };

  // Muestra un recordatorio si el paso actual pertenece a otra pantalla.
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

        {/* Permite volver a la pantalla del paso actual u omitir la guía. */}
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

  // Solicita abrir la creación de categorías.
  // Si la pantalla no proporciona esa acción, navega a Categorías.
  const crearCategoria = () => {
    // Utiliza la acción recibida cuando está disponible.
    if (onAccion) onAccion("crear_categoria");
    else onNav(3);
  };

  // En el paso de categorías, avanzar depende del permiso de la pantalla.
  // Los demás pasos permiten continuar directamente.
  const puedeAvanzar = paso.id !== "categorias" || puedeContinuar;

  return (
    <View className="bg-card border-[1px] border-primary rounded-[16px] p-[16px] mb-[16px]">
      {/* Ajusta la altura del contenido al tamaño de la ventana y permite desplazarlo. */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        style={{ maxHeight: Math.max(140, Math.min(320, height * 0.42)) }}
      >
        {/* Encabezado con el número del paso actual. */}
        <View className="flex-row items-center justify-between mb-[8px]">
          <Text className="text-primary text-[12px] font-bold">
            GUÍA FINZEN
          </Text>
          <Text className="text-text-secondary text-[12px]">
            Paso {tutorial.pasoNumero} de {tutorial.totalPasos}
          </Text>
        </View>

        {/* Barra que representa el avance dentro del recorrido. */}
        <View className="h-[4px] bg-border rounded-[10px] overflow-hidden mb-[12px]">
          <View
            className="h-full bg-primary"
            style={{
              width: `${(tutorial.pasoNumero / tutorial.totalPasos) * 100}%`,
            }}
          />
        </View>

        {/* Título e instrucciones del paso actual. */}
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

        {/* Muestra un mensaje del tutorial cuando existe. */}
        {tutorial.mensaje ? (
          <Text
            accessibilityRole="alert"
            className="text-error text-[12px] mb-[8px]"
          >
            {tutorial.mensaje}
          </Text>
        ) : null}

        <View className="flex-row flex-wrap items-center gap-[8px] mt-[4px]">
          {/* Acceso para crear una categoría durante su paso correspondiente. */}
          {paso.id === "categorias" && (
            <Pressable
              accessibilityRole="button"
              onPress={crearCategoria}
              className="bg-primary rounded-[10px] py-[12px] px-[14px]"
            >
              <Text className="text-card font-semibold">Crear categoría</Text>
            </Pressable>
          )}

          {/* Solicita mostrar Gestión de gastos si la pantalla ofrece esa acción. */}
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

          {/* Avanza el tutorial y navega si se recibe un destino. */}
          {puedeAvanzar && (
            <Pressable
              accessibilityRole="button"
              onPress={() => ir(tutorial.avanzar())}
              className="bg-primary rounded-[10px] py-[12px] px-[14px]"
            >
              <Text className="text-card font-semibold">{paso.siguiente}</Text>
            </Pressable>
          )}

          {/* Permite retroceder cuando el usuario ya pasó del primer paso. */}
          {tutorial.pasoNumero > 1 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => ir(tutorial.retroceder())}
              className="py-[12px] px-[10px]"
            >
              <Text className="text-primary font-semibold">Atrás</Text>
            </Pressable>
          )}

          {/* Omite el recorrido mediante la acción del proveedor del tutorial. */}
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

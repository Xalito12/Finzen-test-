// Importa React para crear el componente.
import React from "react";
// Importa View para construir los contenedores de la barra.
import { View } from "react-native";

// Componente que muestra una barra de progreso con un porcentaje y un color.
export default function ProgressBar({
  percent,
  color,
}: {
  // Porcentaje que determina el ancho de la parte coloreada.
  percent: number;
  // Color utilizado para rellenar la barra.
  color: string;
}) {
  return (
    // Contenedor de 8 px de alto con fondo y bordes redondeados.
    // overflow-hidden recorta el contenido que sobresale de sus bordes.
    <View className="h-[8px] bg-border rounded-[99px] overflow-hidden">
      {/* Parte coloreada que representa el progreso. */}
      <View
        className="h-full rounded-[99px]"
        style={{
          // Limita el ancho a un máximo del 100 %.
          width: `${Math.min(percent, 100)}%`,
          // Aplica el color recibido por el componente.
          backgroundColor: color,
        }}
      />
    </View>
  );
}

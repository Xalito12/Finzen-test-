// Importa los hooks para leer parámetros y controlar la navegación.
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
// Importa los componentes visuales utilizados en la pantalla.
import { Image, ScrollView, Text, TouchableOpacity, View, } from "react-native";
// Importa el contenedor que respeta las áreas seguras del dispositivo.
import { SafeAreaView } from "react-native-safe-area-context";
// Importa los estilos compartidos para organizar y centrar el contenido.
import { layout } from "../components/layout";
;
// Componente que muestra la información detallada de un elemento.
export default function Detalle() {
  const router = useRouter(); // Hook para controlar la pila de navegación

  // Hook de Expo Router que captura los parámetros enviados mediante la URL/Ruta
  const params = useLocalSearchParams<{
    // Identificador del elemento.
    id: string;
    // Título que se mostrará en la pantalla.
    titulo: string;
    // Descripción o información detallada del elemento.
    detalle: string;
    // Dirección de la imagen que se mostrará.
    imagenUrl: string;
  }>();

    // Muestra la pantalla con márgenes de seguridad laterales e inferiores.
    return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      {/* Aplica el contenedor compartido que centra el contenido. */}
      <View style={layout.frame}>
        {/* Permite desplazar la pantalla cuando el contenido supera su altura. */}
        <ScrollView className="flex-1">
          {/* Carga la imagen desde la dirección recibida en los parámetros. */}
          <Image
            source={{ uri: params.imagenUrl }}
            className="h-64 w-full bg-slate-200"
            resizeMode="cover"
          />

          {/* Agrupa la información y añade espacio alrededor. */}
          <View className="p-6">
            {/* Muestra el identificador del elemento. */}
            <Text className="text-xs font-bold uppercase tracking-wider text-[#7E57C2]">
              Elemento #{params.id}
            </Text>

            {/* Muestra el título recibido. */}
            <Text className="mt-1 text-2xl font-bold text-slate-900">
              {params.titulo}
            </Text>

            {/* Línea horizontal que separa el título de la descripción. */}
            <View className="my-4 h-px bg-slate-200" />

            {/* Muestra la descripción recibida. */}
            <Text className="text-base leading-relaxed text-slate-700">
              {params.detalle}
            </Text>

            {/* Regresa a la pantalla anterior al presionar el botón. */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-8 items-center rounded-lg border border-[#3F51B5] bg-indigo-50 py-3 active:bg-indigo-100"
            >
              {/* Texto que aparece dentro del botón. */}
              <Text className="font-semibold text-[#3F51B5]">
                Volver a la lista
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

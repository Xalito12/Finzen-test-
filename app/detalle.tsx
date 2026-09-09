import React from "react";
import { View, Text, Image, ScrollView, SafeAreaView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function Detalle() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    titulo: string;
    detalle: string;
    imagenUrl: string;
  }>();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <Image
          source={{ uri: params.imagenUrl }}
          className="h-64 w-full bg-slate-200"
          resizeMode="cover"
        />

        <View className="p-6">
          {/* Etiqueta / Acento con Morado Vibrante (#7E57C2) */}
          <Text className="text-xs font-bold uppercase tracking-wider text-[#7E57C2]">
            Elemento #{params.id}
          </Text>
          <Text className="mt-1 text-2xl font-bold text-slate-900">
            {params.titulo}
          </Text>

          <View className="my-4 h-px bg-slate-200" />

          <Text className="text-base leading-relaxed text-slate-700">
            {params.detalle}
          </Text>

          {/* Botón Volver con estilo Secundario / Indigo (#3F51B5) */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-8 items-center rounded-lg border border-[#3F51B5] bg-indigo-50 py-3 active:bg-indigo-100"
          >
            <Text className="font-semibold text-[#3F51B5]">Volver a la lista</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
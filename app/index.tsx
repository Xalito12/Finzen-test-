import React, { useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { Elemento, listaElementosInicial } from "../models/Elemento";

export default function Index() {
  const router = useRouter();
  const [elementos] = useState<Elemento[]>(listaElementosInicial);

  const irADetalle = (item: Elemento) => {
    router.push({
      pathname: "/detalle",
      params: {
        id: item.id,
        titulo: item.titulo,
        detalle: item.detalle,
        imagenUrl: item.imagenUrl,
      },
    });
  };

  const renderItem = ({ item }: { item: Elemento }) => (
    <View className="mb-6 overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm">
      <Image
        source={{ uri: item.imagenUrl }}
        className="h-48 w-full bg-slate-200"
        resizeMode="cover"
      />
      
      <View className="p-4">
        <Text className="text-xl font-bold text-slate-800">{item.titulo}</Text>
        <Text className="mt-1 text-sm text-slate-600" numberOfLines={2}>
          {item.detalle}
        </Text>

        {/* Boton CTA con Indigo Claro (#5C6BC0) */}
        <TouchableOpacity
          onPress={() => irADetalle(item)}
          className="mt-4 items-center rounded-lg bg-[#5C6BC0] py-2.5 active:bg-[#512DA8]"
        >
          <Text className="font-semibold text-white">Ver detalle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <FlatList
        data={elementos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
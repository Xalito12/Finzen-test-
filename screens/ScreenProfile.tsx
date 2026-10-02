import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import BottomNav from "../components/BottomNav";

export default function ScreenProfile({ onNav }: { onNav: (i: number) => void }) {
  const menu = [
    { icon: "credit-card", label: "Sueldo y presupuesto" },
    { icon: "bell", label: "Notificaciones y alertas" },
    { icon: "lock", label: "Seguridad y privacidad" },
    { icon: "settings", label: "Configuración general" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: "#512DA8", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <Feather name="user" size={32} color="#fff" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>Andrés Morales</Text>
          <Text style={{ fontSize: 12, color: "#6B6580" }}>andres@correo.com</Text>
        </View>

        <View style={{ backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
          {menu.map((m, i) => (
            <TouchableOpacity key={m.label} style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: i < menu.length - 1 ? 1 : 0, borderColor: "#F5F3FA" }}>
              <Feather name={m.icon as any} size={18} color="#512DA8" style={{ marginRight: 12 }} />
              <Text style={{ flex: 1, fontSize: 14 }}>{m.label}</Text>
              <Feather name="chevron-right" size={16} color="#6B6580" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => onNav(0)} style={{ height: 48, borderRadius: 14, borderWidth: 1, borderColor: "#C62828", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#C62828", fontWeight: "600" }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav active={8} onNav={onNav} />
    </View>
  );
}
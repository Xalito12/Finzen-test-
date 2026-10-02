import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import ProgressBar from "../components/ProgressBar";

export default function ScreenSalarySetup({ onNext }: { onNext: () => void }) {
  const [salary, setSalary] = useState("850.000");
  const [payDay, setPayDay] = useState("1");
  const days = ["1", "5", "7", "10", "14", "15", "28", "30"];

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(81,45,168,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Feather name="credit-card" size={22} color="#512DA8" />
      </View>
      <Text style={{ color: "#6B6580", fontSize: 13 }}>Paso 1 de 2</Text>
      <Text style={{ fontSize: 24, fontWeight: "700", color: "#1E1B2E", marginBottom: 16 }}>
        Configura tu sueldo mensual
      </Text>

      <ProgressBar percent={50} color="#512DA8" />

      <Text style={{ fontSize: 13, fontWeight: "500", color: "#6B6580", marginTop: 28, marginBottom: 8 }}>
        Sueldo mensual neto (CLP)
      </Text>
      <View style={{ height: 56, borderRadius: 14, borderWidth: 2, borderColor: "#512DA8", backgroundColor: "#fff", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 24 }}>
        <Text style={{ color: "#512DA8", fontSize: 18, fontWeight: "600", marginRight: 8 }}>$</Text>
        <TextInput value={salary} onChangeText={setSalary} keyboardType="numeric" style={{ flex: 1, fontSize: 18, fontWeight: "600", color: "#1E1B2E" }} />
        <Text style={{ color: "#6B6580", fontSize: 13 }}>CLP</Text>
      </View>

      <Text style={{ fontSize: 13, fontWeight: "500", color: "#6B6580", marginBottom: 8 }}>Día de pago</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
        {days.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setPayDay(d)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: payDay === d ? "#512DA8" : "#E8E4F0",
              backgroundColor: payDay === d ? "#512DA8" : "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: payDay === d ? "#fff" : "#1E1B2E", fontWeight: "600" }}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={onNext} style={{ height: 52, borderRadius: 16, backgroundColor: "#512DA8", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Continuar →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
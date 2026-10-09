import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import BottomNav from "../components/BottomNav";
import { db } from "../database/db";

export default function ScreenQuickExpense({ onNav }: { onNav: (i: number) => void }) {
  const [amount, setAmount] = useState("0");
  const [cats, setCats] = useState<any[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!db) return;
    try {
      db.execSync('CREATE TABLE IF NOT EXISTS categorias (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, icono TEXT, limite TEXT, color TEXT);');
      const categoriasDB = db.getAllSync('SELECT * FROM categorias ORDER BY id ASC;') as any[];
      setCats(categoriasDB);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

  // Previene errores tipográficos verificando
  // la existencia de puntos decimales múltiples e intercepta la acción de borrado nativa.
  const handleKey = (k: string) => {
    if (k === "⌫") setAmount((a) => (a.length > 1 ? a.slice(0, -1) : "0"));
    else if (k === "." && amount.includes(".")) return;
    else if (amount === "0" && k !== ".") setAmount(k);
    else setAmount((a) => a + k);
  };

  const guardarGastoReal = () => {
    const montoNumerico = parseFloat(amount);
    if (isNaN(montoNumerico) || montoNumerico <= 0 || cats.length === 0 || !db) return;

    db.execSync('CREATE TABLE IF NOT EXISTS gastos (id INTEGER PRIMARY KEY AUTOINCREMENT, monto TEXT, categoria TEXT, icono TEXT);');
    const categoriaElegida = cats[selected]?.nombre || "General";
    const iconoElegido = cats[selected]?.icono || "🏷️";

    db.runSync('INSERT INTO gastos (monto, categoria, icono) VALUES (?, ?, ?);', [amount, categoriaElegida, iconoElegido]);
    onNav(2);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "700" }}>Nuevo gasto</Text>
          <TouchableOpacity onPress={() => onNav(2)}>
            <Feather name="x" size={24} color="#6B6580" />
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Text style={{ color: "#6B6580", fontSize: 13 }}>¿Cuánto gastaste?</Text>
          <Text style={{ fontSize: 42, fontWeight: "700", color: "#1E1B2E" }}>${amount}</Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {cats.length === 0 ? (
            <Text style={{ color: "#6B6580", fontSize: 13, textAlign: "center", width: "100%", marginVertical: 10 }}>
              No hay categorías disponibles. Crea una primero en la sección Categorías.
            </Text>
          ) : (
            cats.map((c, i) => (
              <TouchableOpacity
                key={c.id || c.nombre}
                onPress={() => setSelected(i)}
                style={{
                  width: "31%",
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: selected === i ? "#512DA8" : "#E8E4F0",
                  backgroundColor: selected === i ? "#512DA8" : "#fff",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20 }}>{c.icono}</Text>
                <Text numberOfLines={1} style={{ fontSize: 11, color: selected === i ? "#fff" : "#1E1B2E", fontWeight: "500", marginTop: 4 }}>
                  {c.nombre}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {keys.map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => handleKey(k)}
              style={{
                width: "31%",
                height: 48,
                borderRadius: 10,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#E8E4F0",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#1E1B2E" }}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={guardarGastoReal}
          //  Bloquea la interacción si no hay categorías creadas o el monto es cero,
          // manteniendo la integridad de la BD.
          disabled={cats.length === 0 || amount === "0"}
          style={{
            height: 50,
            borderRadius: 14,
            backgroundColor: (cats.length === 0 || amount === "0") ? "#B39DDB" : "#512DA8",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Registrar gasto</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav active={4} onNav={onNav} />
    </View>
  );
}
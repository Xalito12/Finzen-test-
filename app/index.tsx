import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SQLite from 'expo-sqlite';
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// ─── Base de Datos ────────────────────────────────────────────────────────────
// Se abre la base de datos o se crea el archivo si es la primera vez
const db = SQLite.openDatabaseSync('mi_base_datos.db');

// ─── Componentes Reutilizables ────────────────────────────────────────────────
function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <View style={{ height: 8, backgroundColor: "#E8E4F0", borderRadius: 99, overflow: "hidden" }}>
      <View
        style={{
          width: `${Math.min(percent, 100)}%`,
          backgroundColor: color,
          height: "100%",
          borderRadius: 99,
        }}
      />
    </View>
  );
}

function MiniBadge({ percent, color }: { percent: number; color: string }) {
  return (
    <View
      style={{
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 5,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>{percent}%</Text>
    </View>
  );
}

// ─── Barra de Navegación Inferior ─────────────────────────────────────────────
function BottomNav({ active, onNav }: { active: number; onNav: (i: number) => void }) {
  const items = [
    { icon: "home", label: "Inicio", screen: 2 },
    { icon: "grid", label: "Gastos", screen: 3 },
    { icon: "plus", label: "", screen: 4 },
    { icon: "target", label: "Metas", screen: 5 },
    { icon: "user", label: "Perfil", screen: 8 },
  ];

  return (
    <View
      style={{
        height: 68,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderColor: "#E8E4F0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingBottom: 6,
      }}
    >
      {items.map((item, i) => {
        if (i === 2) {
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onNav(item.screen)}
              style={{
                top: -16,
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#512DA8",
                alignItems: "center",
                justifyContent: "center",
                elevation: 4,
              }}
            >
              <Feather name="plus" size={26} color="#fff" />
            </TouchableOpacity>
          );
        }
        const isActive = active === item.screen;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => onNav(item.screen)}
            style={{ alignItems: "center", paddingHorizontal: 12 }}
          >
            <Feather name={item.icon as any} size={20} color={isActive ? "#512DA8" : "#8A849C"} />
            <Text
              style={{
                fontSize: 10,
                marginTop: 3,
                color: isActive ? "#512DA8" : "#8A849C",
                fontWeight: isActive ? "600" : "400",
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── 0: Onboarding ────────────────────────────────────────────────────────────
function ScreenOnboarding({ onNext }: { onNext: () => void }) {
  return (
    <LinearGradient
      colors={["#1A1233", "#2D1B6E", "#3F51B5"]}
      style={{ flex: 1, padding: 24, justifyContent: "space-between" }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.15)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="credit-card" size={22} color="#fff" />
        </View>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>FinZen</Text>
      </View>

      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 170,
            height: 170,
            borderRadius: 85,
            borderWidth: 10,
            borderColor: "#7E57C2",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 32, fontWeight: "700" }}>68%</Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>presupuesto</Text>
        </View>
        <Text
          style={{
            color: "#fff",
            fontSize: 26,
            fontWeight: "700",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Tu dinero, bajo control
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 14,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          Visualiza gastos, evita deudas y alcanza tus metas de ahorro fácilmente.
        </Text>
      </View>

      <View style={{ gap: 10, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={onNext}
          style={{
            height: 50,
            borderRadius: 14,
            backgroundColor: "#7E57C2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
            Crear cuenta con correo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            height: 50,
            borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 14 }}>Continuar con Google</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// ─── 1: Configurar Sueldo ─────────────────────────────────────────────────────
function ScreenSalarySetup({ onNext }: { onNext: () => void }) {
  const [salary, setSalary] = useState("850.000");
  const [payDay, setPayDay] = useState("1");
  const days = ["1", "5", "7", "10", "14", "15", "28", "30"];

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: "rgba(81,45,168,0.1)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
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
      <View
        style={{
          height: 56,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: "#512DA8",
          backgroundColor: "#fff",
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          marginBottom: 24,
        }}
      >
        <Text style={{ color: "#512DA8", fontSize: 18, fontWeight: "600", marginRight: 8 }}>$</Text>
        <TextInput
          value={salary}
          onChangeText={setSalary}
          keyboardType="numeric"
          style={{ flex: 1, fontSize: 18, fontWeight: "600", color: "#1E1B2E" }}
        />
        <Text style={{ color: "#6B6580", fontSize: 13 }}>CLP</Text>
      </View>

      <Text style={{ fontSize: 13, fontWeight: "500", color: "#6B6580", marginBottom: 8 }}>
        Día de pago
      </Text>
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

      <TouchableOpacity
        onPress={onNext}
        style={{
          height: 52,
          borderRadius: 16,
          backgroundColor: "#512DA8",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Continuar →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── 2: Dashboard (BARRAS DE PROGRESO Y DATOS REALES) ─────────────────────────
function ScreenDashboard({ onNav }: { onNav: (i: number) => void }) {
  // Sueldo fijo para los cálculos
  const sueldoTotal = 850000;

  // Variables simples para guardar las listas y los totales
  const [listaGastos, setListaGastos] = useState<any[]>([]);
  const [totalGastado, setTotalGastado] = useState(0);
  
  // Variables individuales para cada categoría (Estructura para principiantes)
  const [gastoComida, setGastoComida] = useState(0);
  const [gastoTransporte, setGastoTransporte] = useState(0);
  const [gastoCompras, setGastoCompras] = useState(0);
  const [gastoSalud, setGastoSalud] = useState(0);

  const leerGastosReales = () => {
    // 1. Aseguramos la tabla y leemos los datos
    db.execSync('CREATE TABLE IF NOT EXISTS gastos (id INTEGER PRIMARY KEY AUTOINCREMENT, monto TEXT, categoria TEXT, icono TEXT);');
    const registros = db.getAllSync('SELECT * FROM gastos ORDER BY id DESC;');
    setListaGastos(registros);

    // 2. Sumamos todo manualmente usando un ciclo básico
    let sumaTotal = 0;
    let sumaComida = 0;
    let sumaTransporte = 0;
    let sumaCompras = 0;
    let sumaSalud = 0;

    for (let i = 0; i < registros.length; i++) {
      // Convertimos el texto a número
      let montoNumero = parseInt(registros[i].monto);
      
      // Si el monto no es válido, lo dejamos en 0 para no romper la suma
      if (isNaN(montoNumero)) {
        montoNumero = 0;
      }
      
      // Sumamos al gran total
      sumaTotal = sumaTotal + montoNumero;

      // Sumamos a la categoría correspondiente
      if (registros[i].categoria === "Comida" || registros[i].categoria === "Alimentación") {
        sumaComida = sumaComida + montoNumero;
      }
      if (registros[i].categoria === "Transporte") {
        sumaTransporte = sumaTransporte + montoNumero;
      }
      if (registros[i].categoria === "Compras") {
        sumaCompras = sumaCompras + montoNumero;
      }
      if (registros[i].categoria === "Salud") {
        sumaSalud = sumaSalud + montoNumero;
      }
    }

    // 3. Guardamos los resultados en las variables de estado
    setTotalGastado(sumaTotal);
    setGastoComida(sumaComida);
    setGastoTransporte(sumaTransporte);
    setGastoCompras(sumaCompras);
    setGastoSalud(sumaSalud);
  };

  useEffect(() => {
    leerGastosReales();
  }, []);

  // Cálculos para la tarjeta principal
  let porcentajeTotal = Math.round((totalGastado / sueldoTotal) * 100);
  let saldoDisponible = sueldoTotal - totalGastado;

  // Arreglo para dibujar las barras de colores que vimos en el diseño
  const categorias = [
    { name: "Alimentación", spent: gastoComida, limit: 160000, color: "#7E57C2" },
    { name: "Transporte", spent: gastoTransporte, limit: 80000, color: "#F9A825" },
    { name: "Compras", spent: gastoCompras, limit: 130000, color: "#C62828" },
    { name: "Salud", spent: gastoSalud, limit: 55000, color: "#2E7D32" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 20 }}>
        
        {/* --- CABECERA Y TARJETA MORADA --- */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 13, color: "#6B6580" }}>Buenos días,</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1E1B2E" }}>Andrés 👋</Text>
          </View>
          <TouchableOpacity
            onPress={() => onNav(6)}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="bell" size={20} color="#512DA8" />
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={["#512DA8", "#3F51B5"]}
          style={{ borderRadius: 20, padding: 20, marginBottom: 20 }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Sueldo · CLP</Text>
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700" }}>${sueldoTotal.toLocaleString("es-CL")}</Text>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 12 }}>
                <View>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Gastado</Text>
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>${totalGastado.toLocaleString("es-CL")}</Text>
                </View>
                <View>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Disponible</Text>
                  <Text style={{ color: "#A5F3AE", fontSize: 14, fontWeight: "600" }}>${saldoDisponible.toLocaleString("es-CL")}</Text>
                </View>
              </View>
            </View>
            <MiniBadge percent={porcentajeTotal} color="rgba(255,255,255,0.85)" />
          </View>
        </LinearGradient>

        {/* --- SECCIÓN 1: BARRAS DE PROGRESO DE CATEGORÍAS --- */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "700" }}>Categorías</Text>
          <TouchableOpacity onPress={() => onNav(3)}>
            <Text style={{ color: "#512DA8", fontSize: 13, fontWeight: "600" }}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 10, marginBottom: 20 }}>
          {categorias.map((c) => {
            const p = Math.round((c.spent / c.limit) * 100);
            const colorBarra = p >= 100 ? "#C62828" : p >= 80 ? "#F9A825" : c.color;
            return (
              <View key={c.name} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ fontWeight: "600", fontSize: 14 }}>{c.name}</Text>
                  <Text style={{ fontWeight: "700", color: colorBarra }}>${c.spent.toLocaleString("es-CL")}</Text>
                </View>
                <ProgressBar percent={p} color={colorBarra} />
              </View>
            );
          })}
        </View>

        {/* --- SECCIÓN 2: HISTORIAL DE GASTOS --- */}
        <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 15 }}>Historial de Gastos</Text>
          
          {listaGastos.length === 0 ? (
            <Text style={{ color: "#6B6580", textAlign: "center", marginVertical: 10 }}>
              Aún no hay gastos registrados.
            </Text>
          ) : (
            listaGastos.map((gasto) => (
              <View key={gasto.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F5F3FA' }}>
                <Text style={{ fontSize: 24, marginRight: 15 }}>{gasto.icono}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', color: "#1E1B2E", fontSize: 16 }}>{gasto.categoria}</Text>
                  <Text style={{ color: "#6B6580", fontSize: 12 }}>ID: {gasto.id}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#C62828" }}>
                  ${gasto.monto}
                </Text>
              </View>
            ))
          )}
        </View>
        
      </ScrollView>
      <BottomNav active={2} onNav={onNav} />
    </View>
  );
}

// ─── 3: Categorías ────────────────────────────────────────────────────────────
function ScreenCategories({ onNav }: { onNav: (i: number) => void }) {
  const cats = [
    { name: "Alimentación", icon: "🍔", spent: 112000, limit: 160000, color: "#7E57C2" },
    { name: "Transporte", icon: "🚗", spent: 74000, limit: 80000, color: "#F9A825" },
    { name: "Compras", icon: "🛍️", spent: 158000, limit: 130000, color: "#C62828" },
    { name: "Salud", icon: "❤️", spent: 32000, limit: 55000, color: "#2E7D32" },
    { name: "Entretenimiento", icon: "🎬", spent: 26000, limit: 40000, color: "#3F51B5" },
    { name: "Educación", icon: "📚", spent: 16000, limit: 28000, color: "#5C6BC0" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>Categorías</Text>
        <View style={{ gap: 10 }}>
          {cats.map((c) => {
            const p = Math.round((c.spent / c.limit) * 100);
            const barColor = p >= 100 ? "#C62828" : p >= 80 ? "#F9A825" : c.color;
            return (
              <View key={c.name} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Text style={{ fontSize: 22 }}>{c.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600" }}>{c.name}</Text>
                    <Text style={{ fontSize: 11, color: "#6B6580" }}>Límite: ${c.limit.toLocaleString("es-CL")}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: barColor }}>
                    ${c.spent.toLocaleString("es-CL")}
                  </Text>
                </View>
                <ProgressBar percent={p} color={barColor} />
              </View>
            );
          })}
        </View>
      </ScrollView>
      <BottomNav active={3} onNav={onNav} />
    </View>
  );
}

// ─── 4: Registrar Gasto Rápido ────────────────────────────────────────────────
function ScreenQuickExpense({ onNav }: { onNav: (i: number) => void }) {
  const [amount, setAmount] = useState("0");
  const [selected, setSelected] = useState(0);
  
  const cats = [
    { name: "Comida", icon: "🍔" },
    { name: "Transporte", icon: "🚗" },
    { name: "Compras", icon: "🛍️" },
    { name: "Salud", icon: "❤️" },
    { name: "Ocio", icon: "🎬" },
    { name: "Otro", icon: "➕" },
  ];
  
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

  const handleKey = (k: string) => {
    if (k === "⌫") setAmount((a) => (a.length > 1 ? a.slice(0, -1) : "0"));
    else if (k === "." && amount.includes(".")) return;
    else if (amount === "0" && k !== ".") setAmount(k);
    else setAmount((a) => a + k);
  };

  // --- NUEVA FUNCIÓN PARA GUARDAR EN LA BASE DE DATOS ---
  const guardarGastoReal = () => {
    // 1. Creamos una tabla nueva específica para los gastos si no existe
    db.execSync(
      'CREATE TABLE IF NOT EXISTS gastos (id INTEGER PRIMARY KEY AUTOINCREMENT, monto TEXT, categoria TEXT, icono TEXT);'
    );

    // 2. Extraemos los valores exactos que el usuario eligió en la pantalla
    let montoIngresado = amount;
    let categoriaElegida = cats[selected].name;
    let iconoElegido = cats[selected].icon;

    // 3. Insertamos el gasto real en la tabla
    db.runSync(
      'INSERT INTO gastos (monto, categoria, icono) VALUES (?, ?, ?);',
      [montoIngresado, categoriaElegida, iconoElegido]
    );

    // 4. Regresamos a la pantalla del Dashboard (pantalla número 2)
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
          {cats.map((c, i) => (
            <TouchableOpacity
              key={c.name}
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
              <Text style={{ fontSize: 20 }}>{c.icon}</Text>
              <Text
                style={{
                  fontSize: 11,
                  color: selected === i ? "#fff" : "#1E1B2E",
                  fontWeight: "500",
                  marginTop: 4,
                }}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Teclado numérico */}
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

        {/* BOTÓN ACTUALIZADO PARA LLAMAR A LA BASE DE DATOS */}
        <TouchableOpacity
          onPress={guardarGastoReal}
          style={{
            height: 50,
            borderRadius: 14,
            backgroundColor: "#512DA8",
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

// ─── 5: Metas de Ahorro ───────────────────────────────────────────────────────
function ScreenSavingsGoals({ onNav }: { onNav: (i: number) => void }) {
  const goals = [
    { name: "Vacaciones Patagonia", icon: "🏔️", saved: 220000, target: 400000, color: "#7E57C2", deadline: "Dic 2026" },
    { name: "Fondo de emergencia", icon: "🛡️", saved: 320000, target: 510000, color: "#2E7D32", deadline: "Mar 2027" },
    { name: "MacBook Pro", icon: "💻", saved: 85000, target: 900000, color: "#3F51B5", deadline: "Jun 2027" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>Metas de ahorro</Text>

        <View style={{ gap: 12 }}>
          {goals.map((g) => {
            const p = Math.round((g.saved / g.target) * 100);
            return (
              <View key={g.name} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Text style={{ fontSize: 24 }}>{g.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600" }}>{g.name}</Text>
                    <Text style={{ fontSize: 11, color: "#6B6580" }}>{g.deadline}</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: g.color }}>{p}%</Text>
                </View>
                <ProgressBar percent={p} color={g.color} />
                <Text style={{ fontSize: 11, color: "#6B6580", marginTop: 8 }}>
                  ${g.saved.toLocaleString("es-CL")} de ${g.target.toLocaleString("es-CL")}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <BottomNav active={5} onNav={onNav} />
    </View>
  );
}

// ─── 6: Notificaciones ────────────────────────────────────────────────────────
function ScreenNotifications({ onNav }: { onNav: (i: number) => void }) {
  const alerts = [
    { title: "Límite excedido: Compras", desc: "Llevas $158.000 de $130.000 (118%).", color: "#C62828" },
    { title: "Alerta: Transporte al 93%", desc: "Llevas $74.000 de $80.000.", color: "#F9A825" },
    { title: "Gasto fijo próximo", desc: "Arriendo se cargará el 1 de septiembre.", color: "#3F51B5" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>Notificaciones</Text>
        <View style={{ gap: 10 }}>
          {alerts.map((a, i) => (
            <View
              key={i}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 14,
                borderLeftWidth: 4,
                borderLeftColor: a.color,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 4 }}>{a.title}</Text>
              <Text style={{ fontSize: 12, color: "#6B6580" }}>{a.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNav active={6} onNav={onNav} />
    </View>
  );
}

// ─── 7: Gastos Fijos (Recurrentes) ─────────────────────────────────────────────
function ScreenRecurring({ onNav }: { onNav: (i: number) => void }) {
  const recurring = [
    { name: "Arriendo", icon: "🏠", amount: 380000, day: 1 },
    { name: "Netflix", icon: "📺", amount: 8990, day: 15 },
    { name: "Spotify", icon: "🎵", amount: 5990, day: 15 },
    { name: "Internet", icon: "📶", amount: 24990, day: 10 },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>Gastos Fijos</Text>
        <View style={{ gap: 10 }}>
          {recurring.map((r) => (
            <View
              key={r.name}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 22 }}>{r.icon}</Text>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "600" }}>{r.name}</Text>
                  <Text style={{ fontSize: 11, color: "#6B6580" }}>Día {r.day} de cada mes</Text>
                </View>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700" }}>${r.amount.toLocaleString("es-CL")}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNav active={7} onNav={onNav} />
    </View>
  );
}

// ─── 8: Perfil ────────────────────────────────────────────────────────────────
function ScreenProfile({ onNav }: { onNav: (i: number) => void }) {
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
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: "#512DA8",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Feather name="user" size={32} color="#fff" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>Andrés Morales</Text>
          <Text style={{ fontSize: 12, color: "#6B6580" }}>andres@correo.com</Text>
        </View>

        <View style={{ backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
          {menu.map((m, i) => (
            <TouchableOpacity
              key={m.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: i < menu.length - 1 ? 1 : 0,
                borderColor: "#F5F3FA",
              }}
            >
              <Feather name={m.icon as any} size={18} color="#512DA8" style={{ marginRight: 12 }} />
              <Text style={{ flex: 1, fontSize: 14 }}>{m.label}</Text>
              <Feather name="chevron-right" size={16} color="#6B6580" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => onNav(0)}
          style={{
            height: 48,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#C62828",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#C62828", fontWeight: "600" }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav active={8} onNav={onNav} />
    </View>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState(2); // Empezamos en la 2 (Dashboard) para que lo veas rápido

  const renderScreen = () => {
    switch (screen) {
      case 0:
        return <ScreenOnboarding onNext={() => setScreen(1)} />;
      case 1:
        return <ScreenSalarySetup onNext={() => setScreen(2)} />;
      case 2:
        return <ScreenDashboard onNav={setScreen} />;
      case 3:
        return <ScreenCategories onNav={setScreen} />;
      case 4:
        return <ScreenQuickExpense onNav={setScreen} />;
      case 5:
        return <ScreenSavingsGoals onNav={setScreen} />;
      case 6:
        return <ScreenNotifications onNav={setScreen} />;
      case 7:
        return <ScreenRecurring onNav={setScreen} />;
      case 8:
        return <ScreenProfile onNav={setScreen} />;
      default:
        return <ScreenDashboard onNav={setScreen} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F3FA" }}>
      <StatusBar barStyle="dark-content" />
      {renderScreen()}
    </SafeAreaView>
  );
}
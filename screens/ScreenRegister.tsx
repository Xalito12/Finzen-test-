// screens/ScreenRegister.tsx
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../database/supabase";

export default function ScreenRegister({ onNav }: { onNav: (i: number) => void }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const handleRegistro = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Atención", "Por favor completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setCargando(true);
      // Pasamos 'nombre' en options.data para que quede en auth.users
const { data, error } = await supabase.auth.signUp({
  email: email.trim(),
  password: password,
  options: {
    data: { nombre: nombre.trim() },
  },
});

if (error) {
  Alert.alert("Error al registrar", error.message);
  return;
}

if (data?.user) {
  // Insertar el perfil en Supabase
  await supabase.from("perfiles").upsert({
    id: data.user.id,
    nombre: nombre.trim(),
    sueldo: 0,
    dia_pago: 1,
  });

  Alert.alert("¡Bienvenido!", "Tu cuenta ha sido creada exitosamente.", [
    { text: "Continuar", onPress: () => onNav(1) }, // Lleva a configurar sueldo
  ]);
}


    } catch (err: any) {
      Alert.alert("Error inesperado", err.message || "Ocurrió un error.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#F5F3FA" }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#512DA8",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Feather name="user-plus" size={30} color="#fff" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#1E1B2E" }}>Crear Cuenta</Text>
          <Text style={{ fontSize: 14, color: "#6B6580", marginTop: 4 }}>
            Únete para sincronizar tus finanzas
          </Text>
        </View>

        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 2 }}>
          {/* Nombre completo */}
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B6580", marginBottom: 6 }}>
            TU NOMBRE
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F5F3FA",
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 16,
            }}
          >
            <Feather name="user" size={18} color="#8A849C" />
            <TextInput
              placeholder="Ej. Renato"
              placeholderTextColor="#8A849C"
              value={nombre}
              onChangeText={setNombre}
              style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: "#1E1B2E" }}
            />
          </View>

          {/* Correo */}
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B6580", marginBottom: 6 }}>
            CORREO ELECTRÓNICO
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F5F3FA",
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 16,
            }}
          >
            <Feather name="mail" size={18} color="#8A849C" />
            <TextInput
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#8A849C"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: "#1E1B2E" }}
            />
          </View>

          {/* Contraseña */}
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B6580", marginBottom: 6 }}>
            CONTRASEÑA
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F5F3FA",
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 16,
            }}
          >
            <Feather name="lock" size={18} color="#8A849C" />
            <TextInput
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#8A849C"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!verPassword}
              style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: "#1E1B2E" }}
            />
            <TouchableOpacity onPress={() => setVerPassword(!verPassword)}>
              <Feather name={verPassword ? "eye" : "eye-off"} size={18} color="#8A849C" />
            </TouchableOpacity>
          </View>

          {/* Confirmar Contraseña */}
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B6580", marginBottom: 6 }}>
            CONFIRMAR CONTRASEÑA
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F5F3FA",
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 24,
            }}
          >
            <Feather name="check-circle" size={18} color="#8A849C" />
            <TextInput
              placeholder="Repite tu contraseña"
              placeholderTextColor="#8A849C"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!verPassword}
              style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: "#1E1B2E" }}
            />
          </View>

          <TouchableOpacity
            onPress={handleRegistro}
            disabled={cargando}
            style={{
              backgroundColor: "#512DA8",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Registrarse</Text>
            )}
          </TouchableOpacity>
        </View>

<TouchableOpacity
          onPress={() => onNav(10)}
          style={{ marginTop: 20, alignItems: "center" }}
        >
          <Text style={{ color: "#6B6580", fontSize: 14 }}>
            ¿Ya tienes cuenta? <Text style={{ color: "#512DA8", fontWeight: "700" }}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
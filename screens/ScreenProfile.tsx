// screens/ScreenProfile.tsx
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../components/BottomNav";
import { supabase } from "../database/supabase";

export default function ScreenProfile({ onNav }: { onNav: (i: number) => void }) {
  const [nombre, setNombre] = useState("Usuario");
  const [email, setEmail] = useState("");
  const [sueldo, setSueldo] = useState("0");
  const [diaPago, setDiaPago] = useState("1");
  const [cargando, setCargando] = useState(true);

  // Estados del modal de edición
  const [modalVisible, setModalVisible] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editSueldo, setEditSueldo] = useState("");
  const [editDiaPago, setEditDiaPago] = useState("1");
  const [guardando, setGuardando] = useState(false);

  const dias = [1, 5, 7, 10, 14, 15, 28, 30];

  // 1. Cargar datos directamente desde Supabase
  const cargarDatosPerfil = async () => {
    try {
      setCargando(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCargando(false);
        return;
      }

      setEmail(user.email || "");

      // Consulta en la tabla perfiles de Supabase
      const { data: perfil, error } = await supabase
        .from("perfiles")
        .select("nombre, sueldo, dia_pago")
        .eq("id", user.id)
        .single();

      if (perfil) {
        const nom = perfil.nombre || user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario";
        const sue = (perfil.sueldo || 0).toString();
        const dia = (perfil.dia_pago || 1).toString();

        setNombre(nom);
        setSueldo(sue);
        setDiaPago(dia);

        setEditNombre(nom);
        setEditSueldo(sue);
        setEditDiaPago(dia);
      } else {
        const nom = user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario";
        setNombre(nom);
        setEditNombre(nom);
      }
    } catch (err: any) {
      console.error("Error al cargar perfil:", err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosPerfil();
  }, []);

  // 2. Guardar modificaciones directamente en Supabase
  const handleGuardarCambios = async () => {
    if (!editNombre.trim()) {
      Alert.alert("Atención", "El nombre no puede estar vacío.");
      return;
    }

    const sueldoNum = parseInt(editSueldo.replace(/[^0-9]/g, ""));
    if (isNaN(sueldoNum) || sueldoNum <= 0) {
      Alert.alert("Atención", "Ingresa un monto de sueldo válido.");
      return;
    }

    try {
      setGuardando(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      // Actualizar metadatos en Auth
      await supabase.auth.updateUser({
        data: { nombre: editNombre.trim() },
      });

      // Actualizar fila en la tabla perfiles
      const { error: errorPerfil } = await supabase
        .from("perfiles")
        .upsert({
          id: user.id,
          nombre: editNombre.trim(),
          sueldo: sueldoNum,
          dia_pago: parseInt(editDiaPago),
          actualizado_en: new Date().toISOString(),
        });

      if (errorPerfil) {
        Alert.alert("Error al actualizar", errorPerfil.message);
        return;
      }

      // Refrescar estados locales
      setNombre(editNombre.trim());
      setSueldo(sueldoNum.toString());
      setDiaPago(editDiaPago);
      setModalVisible(false);

      Alert.alert("Éxito", "Tus datos han sido actualizados.");
    } catch (err: any) {
      Alert.alert("Error inesperado", err.message || "No se pudo actualizar.");
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrarSesion = async () => {
    Alert.alert("Cerrar Sesión", "¿Seguro que deseas salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          onNav(0);
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F3FA" }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 110 }}>
        {/* Cabecera */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#1E1B2E" }}>
            Mi Perfil
          </Text>
          <TouchableOpacity
            onPress={() => {
              setEditNombre(nombre);
              setEditSueldo(sueldo);
              setEditDiaPago(diaPago);
              setModalVisible(true);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#E8E4F0",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              gap: 6,
            }}
          >
            <Feather name="edit-3" size={14} color="#512DA8" />
            <Text style={{ color: "#512DA8", fontWeight: "700", fontSize: 13 }}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Usuario */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            alignItems: "center",
            marginBottom: 20,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "#512DA8",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Feather name="user" size={36} color="#fff" />
          </View>

          {cargando ? (
            <ActivityIndicator color="#512DA8" />
          ) : (
            <>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1E1B2E" }}>
                {nombre}
              </Text>
              <Text style={{ fontSize: 13, color: "#6B6580", marginTop: 4 }}>
                {email || "Sin correo"}
              </Text>
            </>
          )}
        </View>

        {/* Información Financiera */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B6580", marginBottom: 12 }}>
            INFORMACIÓN FINANCIERA
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderColor: "#F5F3FA",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Feather name="dollar-sign" size={18} color="#512DA8" />
              <Text style={{ fontSize: 15, color: "#1E1B2E", fontWeight: "500" }}>
                Sueldo Mensual
              </Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#512DA8" }}>
              ${parseInt(sueldo || "0").toLocaleString("es-CL")} CLP
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Feather name="calendar" size={18} color="#512DA8" />
              <Text style={{ fontSize: 15, color: "#1E1B2E", fontWeight: "500" }}>
                Día de Pago
              </Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#512DA8" }}>
              Día {diaPago} de cada mes
            </Text>
          </View>
        </View>

        {/* Cerrar Sesión */}
        <TouchableOpacity
          onPress={handleCerrarSesion}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FEE2E2",
            paddingVertical: 14,
            borderRadius: 12,
            gap: 8,
          }}
        >
          <Feather name="log-out" size={18} color="#C62828" />
          <Text style={{ color: "#C62828", fontWeight: "700", fontSize: 15 }}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para Editar Datos */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              maxHeight: "85%",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1E1B2E" }}>
                Editar Perfil
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color="#6B6580" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Campo Nombre */}
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B6580", marginBottom: 6 }}>
                NOMBRE
              </Text>
              <TextInput
                value={editNombre}
                onChangeText={setEditNombre}
                style={{
                  backgroundColor: "#F5F3FA",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  height: 48,
                  fontSize: 15,
                  color: "#1E1B2E",
                  marginBottom: 16,
                }}
              />

              {/* Campo Sueldo */}
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B6580", marginBottom: 6 }}>
                SUELDO MENSUAL (CLP)
              </Text>
              <TextInput
                value={editSueldo}
                onChangeText={setEditSueldo}
                keyboardType="numeric"
                style={{
                  backgroundColor: "#F5F3FA",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  height: 48,
                  fontSize: 15,
                  color: "#1E1B2E",
                  marginBottom: 16,
                }}
              />

              {/* Selector Día de Pago */}
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B6580", marginBottom: 8 }}>
                DÍA DE PAGO
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {dias.map((d) => {
                  const sel = parseInt(editDiaPago) === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setEditDiaPago(d.toString())}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: sel ? "#512DA8" : "#F5F3FA",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: sel ? "#fff" : "#1E1B2E", fontWeight: "700" }}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Botón Guardar Cambios */}
              <TouchableOpacity
                onPress={handleGuardarCambios}
                disabled={guardando}
                style={{
                  backgroundColor: "#512DA8",
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                {guardando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                    Guardar Cambios
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BottomNav active={8} onNav={onNav} />
    </View>
  );
}
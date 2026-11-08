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

export default function ScreenProfile({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
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
        const nom =
          perfil.nombre ||
          user.user_metadata?.nombre ||
          user.email?.split("@")[0] ||
          "Usuario";
        const sue = (perfil.sueldo || 0).toString();
        const dia = (perfil.dia_pago || 1).toString();

        setNombre(nom);
        setSueldo(sue);
        setDiaPago(dia);

        setEditNombre(nom);
        setEditSueldo(sue);
        setEditDiaPago(dia);
      } else {
        const nom =
          user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario";
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
      const { error: errorPerfil } = await supabase.from("perfiles").upsert({
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
    <View className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 110 }}>
        {/* Cabecera */}
        <View className="flex-row justify-between items-center mb-[20px]">
          <Text className="text-[24px] font-bold text-text">Mi Perfil</Text>
          <TouchableOpacity
            onPress={() => {
              setEditNombre(nombre);
              setEditSueldo(sueldo);
              setEditDiaPago(diaPago);
              setModalVisible(true);
            }}
            className="flex-row items-center bg-border px-[12px] py-[6px] rounded-[20px] gap-[6px]"
          >
            <Feather name="edit-3" size={14} color="#512DA8" />
            <Text className="text-primary font-bold text-[13px]">Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Usuario */}
        <View
          className="bg-card rounded-[16px] p-[20px] items-center mb-[20px]"
          style={{ elevation: 2 }}
        >
          <View className="w-[72px] h-[72px] rounded-[36px] bg-primary items-center justify-center mb-[12px]">
            <Feather name="user" size={36} color="#fff" />
          </View>

          {cargando ? (
            <ActivityIndicator color="#512DA8" />
          ) : (
            <>
              <Text className="text-[20px] font-bold text-text">{nombre}</Text>
              <Text className="text-[13px] text-text-secondary mt-[4px]">
                {email || "Sin correo"}
              </Text>
            </>
          )}
        </View>

        {/* Información Financiera */}
        <View
          className="bg-card rounded-[16px] p-[16px] mb-[24px]"
          style={{ elevation: 2 }}
        >
          <Text className="text-[12px] font-bold text-text-secondary mb-[12px]">
            INFORMACIÓN FINANCIERA
          </Text>

          <View className="flex-row justify-between items-center py-[10px] border-b-[1px] border-bg">
            <View className="flex-row items-center gap-[10px]">
              <Feather name="dollar-sign" size={18} color="#512DA8" />
              <Text className="text-[15px] text-text font-medium">
                Sueldo Mensual
              </Text>
            </View>
            <Text className="text-[15px] font-bold text-primary">
              ${parseInt(sueldo || "0").toLocaleString("es-CL")} CLP
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-[10px]">
            <View className="flex-row items-center gap-[10px]">
              <Feather name="calendar" size={18} color="#512DA8" />
              <Text className="text-[15px] text-text font-medium">
                Día de Pago
              </Text>
            </View>
            <Text className="text-[15px] font-bold text-primary">
              Día {diaPago} de cada mes
            </Text>
          </View>
        </View>

        {/* Cerrar Sesión */}
        <TouchableOpacity
          onPress={handleCerrarSesion}
          className="flex-row items-center justify-center bg-[#FEE2E2] py-[14px] rounded-[12px] gap-[8px]"
        >
          <Feather name="log-out" size={18} color="#C62828" />
          <Text className="text-error font-bold text-[15px]">
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para Editar Datos */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="bg-card rounded-tl-[24px] rounded-tr-[24px] p-[24px] max-h-[85%]">
            <View className="flex-row justify-between items-center mb-[20px]">
              <Text className="text-[18px] font-bold text-text">
                Editar Perfil
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color="#6B6580" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Campo Nombre */}
              <Text className="text-[12px] font-semibold text-text-secondary mb-[6px]">
                NOMBRE
              </Text>
              <TextInput
                value={editNombre}
                onChangeText={setEditNombre}
                className="bg-bg rounded-[12px] px-[14px] h-[48px] text-[15px] text-text mb-[16px]"
              />

              {/* Campo Sueldo */}
              <Text className="text-[12px] font-semibold text-text-secondary mb-[6px]">
                SUELDO MENSUAL (CLP)
              </Text>
              <TextInput
                value={editSueldo}
                onChangeText={setEditSueldo}
                keyboardType="numeric"
                className="bg-bg rounded-[12px] px-[14px] h-[48px] text-[15px] text-text mb-[16px]"
              />

              {/* Selector Día de Pago */}
              <Text className="text-[12px] font-semibold text-text-secondary mb-[8px]">
                DÍA DE PAGO
              </Text>
              <View className="flex-row flex-wrap gap-[8px] mb-[24px]">
                {dias.map((d) => {
                  const sel = parseInt(editDiaPago) === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setEditDiaPago(d.toString())}
                      className="w-[44px] h-[44px] rounded-[10px] items-center justify-center"
                      style={{ backgroundColor: sel ? "#512DA8" : "#F5F3FA" }}
                    >
                      <Text
                        className="font-bold"
                        style={{ color: sel ? "#fff" : "#1E1B2E" }}
                      >
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
                className="bg-primary py-[14px] rounded-[12px] items-center justify-center mb-[10px]"
              >
                {guardando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-card font-bold text-[15px]">
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

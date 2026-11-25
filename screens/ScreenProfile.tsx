import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { layout } from "../components/layout";
import { supabase } from "../database/supabase";
import TutorialCard from "../tutorial/TutorialCard";
import { useTutorial } from "../tutorial/TutorialProvider";

// Muestra los datos personales y financieros del usuario.
// Permite editar el perfil, repetir el tutorial, abrir otras secciones y cerrar sesión.
export default function ScreenProfile({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  // Obtiene la acción para reiniciar el tutorial y comprueba si Perfil está abierto.
  const { reiniciar } = useTutorial();
  const isFocused = useIsFocused();
  const focusedRef = useRef(isFocused);
  focusedRef.current = isFocused;

  // Identifica la consulta más reciente y recuerda si ya se cargó el perfil.
  const ultimaCarga = useRef(0);
  const perfilCargado = useRef(false);

  // Datos que se muestran en la pantalla.
  const [nombre, setNombre] = useState("Usuario");
  const [email, setEmail] = useState("");
  const [sueldo, setSueldo] = useState("0");
  const [diaPago, setDiaPago] = useState("1");
  const [cargando, setCargando] = useState(true);

  // Estados del modal de edición.
  // La referencia permite comprobar si está abierto al terminar una consulta.
  const [modalVisible, setModalVisible] = useState(false);
  const modalVisibleRef = useRef(modalVisible);
  modalVisibleRef.current = modalVisible;
  const [editNombre, setEditNombre] = useState("");
  const [editSueldo, setEditSueldo] = useState("");
  const [editDiaPago, setEditDiaPago] = useState("1");
  const [guardando, setGuardando] = useState(false);

  // Opciones disponibles para seleccionar el día de pago.
  const dias = [1, 5, 7, 10, 14, 15, 28, 30];

  // Refresca al recuperar el foco, conservando el perfil y los borradores.
  // Consulta la sesión y obtiene el nombre, sueldo y día de pago del usuario.
  const cargarDatosPerfil = useCallback(async () => {
    // Evita consultar cuando esta pantalla no está abierta.
    if (!focusedRef.current) return;

    const solicitud = ++ultimaCarga.current;

    // Muestra el indicador de carga únicamente hasta obtener el primer perfil.
    if (!perfilCargado.current) setCargando(true);

    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      // Interrumpe la carga si falla la consulta de la sesión.
      if (errorSesion) throw errorSesion;

      // Exige una sesión válida para consultar el perfil.
      if (!session?.user) throw new Error("No hay una sesión activa.");

      const user = session.user;
      const { data: perfil, error } = await supabase
        .from("perfiles")
        .select("nombre, sueldo, dia_pago")
        .eq("id", user.id)
        .single();

      // Envía el error al bloque catch si falla la consulta del perfil.
      if (error) throw error;

      // Descarta la respuesta si se salió de la pantalla o existe otra consulta más reciente.
      if (!focusedRef.current || solicitud !== ultimaCarga.current) return;

      // Utiliza los datos disponibles y aplica valores predeterminados si faltan.
      const nom =
        perfil?.nombre ||
        user.user_metadata?.nombre ||
        user.email?.split("@")[0] ||
        "Usuario";
      const sue = (perfil?.sueldo || 0).toString();
      const dia = (perfil?.dia_pago || 1).toString();

      setEmail(user.email || "");
      setNombre(nom);
      setSueldo(sue);
      setDiaPago(dia);

      // Actualiza los campos de edición solo si el modal está cerrado.
      // Así conserva lo que el usuario está escribiendo mientras lo tiene abierto.
      if (!modalVisibleRef.current) {
        setEditNombre(nom);
        setEditSueldo(sue);
        setEditDiaPago(dia);
      }

      perfilCargado.current = true;
    } catch (err: any) {
      // Registra el error únicamente si la consulta sigue correspondiendo a esta pantalla.
      if (focusedRef.current && solicitud === ultimaCarga.current) {
        console.error("Error al cargar perfil:", err.message);
      }
    } finally {
      // Finaliza el indicador de carga para la consulta vigente de la pantalla activa.
      if (focusedRef.current && solicitud === ultimaCarga.current)
        setCargando(false);
    }
  }, []);

  // Carga el perfil al entrar e invalida las consultas pendientes al salir.
  useEffect(() => {
    // No inicia la consulta si la pantalla está inactiva.
    if (!isFocused) return;

    cargarDatosPerfil();

    return () => {
      ultimaCarga.current += 1;
    };
  }, [isFocused, cargarDatosPerfil]);

  // 2. Guardar modificaciones directamente en Supabase.
  // Valida los campos y guarda el nombre, sueldo y día de pago del formulario.
  const handleGuardarCambios = async () => {
    // Rechaza un nombre vacío o compuesto solamente por espacios.
    if (!editNombre.trim()) {
      Alert.alert("Atención", "El nombre no puede estar vacío.");
      return;
    }

    const sueldoNum = parseInt(editSueldo.replace(/[^0-9]/g, ""));

    // Solicita un sueldo válido y mayor que cero.
    if (isNaN(sueldoNum) || sueldoNum <= 0) {
      Alert.alert("Atención", "Ingresa un monto de sueldo válido.");
      return;
    }

    try {
      setGuardando(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Detiene el guardado cuando no existe un usuario autenticado.
      if (!user) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      // Actualizar metadatos en Auth.
      await supabase.auth.updateUser({
        data: { nombre: editNombre.trim() },
      });

      // Actualizar fila en la tabla perfiles.
      // upsert también permite crear la fila si todavía no existe.
      const { error: errorPerfil } = await supabase.from("perfiles").upsert({
        id: user.id,
        nombre: editNombre.trim(),
        sueldo: sueldoNum,
        dia_pago: parseInt(editDiaPago),
        actualizado_en: new Date().toISOString(),
      });

      // Informa el error y mantiene abierto el formulario si falla el guardado del perfil.
      if (errorPerfil) {
        Alert.alert("Error al actualizar", errorPerfil.message);
        return;
      }

      // Descarta una lectura anterior que pudiera reemplazar lo recién guardado.
      ultimaCarga.current += 1;
      perfilCargado.current = true;
      setCargando(false);

      // Actualiza los datos visibles y cierra el modal.
      setNombre(editNombre.trim());
      setSueldo(sueldoNum.toString());
      setDiaPago(editDiaPago);
      setModalVisible(false);

      Alert.alert("Éxito", "Tus datos han sido actualizados.");
    } catch (err: any) {
      Alert.alert("Error inesperado", err.message || "No se pudo actualizar.");
    } finally {
      // Finaliza el estado de guardado tanto si la operación funciona como si falla.
      setGuardando(false);
    }
  };

  // Solicita confirmación antes de cerrar la sesión.
  // Al confirmar, cierra la sesión en Supabase y vuelve a la bienvenida.
  const handleCerrarSesion = async () => {
    Alert.alert("Cerrar Sesión", "¿Seguro que deseas salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();

          // Avisa y detiene la navegación si no se pudo cerrar la sesión.
          if (error) {
            Alert.alert("No se pudo cerrar sesión", error.message);
            return;
          }

          onNav(0);
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
      >
        {/* Paso del tutorial correspondiente a la sección Perfil. */}
        <TutorialCard pantalla="Perfil" onNav={onNav} />

        {/* Cabecera */}
        <View className="flex-row justify-between items-center mb-[20px]">
          <Text className="text-[24px] font-bold text-text">Mi Perfil</Text>

          {/* Copia los datos actuales al formulario y abre el modal de edición. */}
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

          {/* Muestra la carga inicial o los datos personales disponibles. */}
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

          {/* Sueldo configurado, presentado con formato numérico de Chile. */}
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

          {/* Día de pago guardado en el perfil. */}
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

        {/* Accesos al tutorial, los gastos fijos y las notificaciones. */}
        <View className="bg-card rounded-[16px] mb-[24px]">
          {/* Reinicia el tutorial y abre Inicio para comenzar el recorrido. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Repetir tutorial de FinZen"
            onPress={() => {
              reiniciar();
              onNav(2);
            }}
            className="flex-row items-center p-[16px] gap-[12px] border-b-[1px] border-bg"
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
          >
            <Feather name="help-circle" size={20} color="#512DA8" />
            <Text className="flex-1 text-text font-semibold text-[15px]">
              Repetir tutorial
            </Text>
            <Feather name="chevron-right" size={20} color="#6B6580" />
          </Pressable>

          {/* Abre la pantalla de gastos fijos. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir gastos fijos"
            onPress={() => onNav(7)}
            className="flex-row items-center p-[16px] gap-[12px] border-b-[1px] border-bg"
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
          >
            <Feather name="repeat" size={20} color="#512DA8" />
            <Text className="flex-1 text-text font-semibold text-[15px]">
              Gastos fijos
            </Text>
            <Feather name="chevron-right" size={20} color="#6B6580" />
          </Pressable>

          {/* Abre la pantalla de notificaciones. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir notificaciones"
            onPress={() => onNav(6)}
            className="flex-row items-center p-[16px] gap-[12px]"
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
          >
            <Feather name="bell" size={20} color="#512DA8" />
            <Text className="flex-1 text-text font-semibold text-[15px]">
              Notificaciones
            </Text>
            <Feather name="chevron-right" size={20} color="#6B6580" />
          </Pressable>
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
      {/* Se muestra únicamente cuando está abierto y Perfil es la pantalla activa. */}
      <Modal
        visible={modalVisible && isFocused}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Ajusta el espacio del formulario al aparecer el teclado. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View
            className="bg-card rounded-tl-[24px] rounded-tr-[24px] p-[24px] max-h-[85%]"
            style={layout.modal}
          >
            <View className="flex-row justify-between items-center mb-[20px]">
              <Text className="text-[18px] font-bold text-text">
                Editar Perfil
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color="#6B6580" />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
                  // Identifica el día seleccionado para destacarlo visualmente.
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
              {/* Se desactiva y muestra un indicador durante el guardado. */}
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
    </View>
  );
}

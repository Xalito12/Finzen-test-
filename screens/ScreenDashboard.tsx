// screens/ScreenDashboard.tsx
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../components/BottomNav";
import MiniBadge from "../components/MiniBadge";
import ProgressBar from "../components/ProgressBar";
import { supabase } from "../database/supabase";

export default function ScreenDashboard({
  onNav,
  active = true,
}: {
  active?: boolean;
  onNav: (i: number) => void;
}) {
  const [perfilCargado, setPerfilCargado] = useState(false);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
  const [sueldoTotal, setSueldoTotal] = useState(0);
  const [editandoSueldo, setEditandoSueldo] = useState(false);
  const [nuevoSueldoInput, setNuevoSueldoInput] = useState("");

  const [listaGastos, setListaGastos] = useState<any[]>([]);
  const [totalGastado, setTotalGastado] = useState(0);
  const [categoriasDinamicas, setCategoriasDinamicas] = useState<any[]>([]);
  const [idEditar, setIdEditar] = useState<number | null>(null);
  const [montoEditar, setMontoEditar] = useState("");

  // 1. Obtener perfil (nombre y sueldo) desde Supabase
  const cargarUsuarioAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay una sesión activa.");

      const { data: perfil, error } = await supabase
        .from("perfiles")
        .select("nombre, sueldo")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (perfil) {
        setNombreUsuario(
          perfil.nombre || user.email?.split("@")[0] || "Usuario",
        );
        setSueldoTotal(Number(perfil.sueldo) || 0);
      } else {
        const nombreFallback =
          user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario";
        setNombreUsuario(nombreFallback);
      }
      setPerfilCargado(true);
      setErrorPerfil(false);
    } catch (err: any) {
      setErrorPerfil(true);
      console.error("Error al cargar perfil:", err.message);
    } finally {
      setCargandoPerfil(false);
    }
  };

  // 2. Leer categorías y gastos exclusivos del usuario desde Supabase
  const leerDatosReales = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener gastos de este usuario
      const { data: registrosGastos, error: errorGastos } = await supabase
        .from("gastos")
        .select("*")
        .eq("usuario_id", user.id)
        .order("id", { ascending: false });

      if (errorGastos) throw errorGastos;
      const listaG = registrosGastos || [];

      let sumaTotal = 0;
      for (let i = 0; i < listaG.length; i++) {
        let montoNum = Number(listaG[i].monto);
        if (!isNaN(montoNum)) sumaTotal += montoNum;
      }

      // Obtener categorías de este usuario
      const { data: categoriasDB, error: errorCategorias } = await supabase
        .from("categorias")
        .select("*")
        .eq("usuario_id", user.id)
        .order("id", { ascending: true });

      if (errorCategorias) throw errorCategorias;

      // Procesar gastos agrupados por cada categoría
      const categoriasProcesadas = (categoriasDB || []).map((cat) => {
        let sumaCat = 0;
        for (let j = 0; j < listaG.length; j++) {
          if (
            listaG[j].categoria === cat.nombre ||
            (cat.nombre === "Alimentación" && listaG[j].categoria === "Comida")
          ) {
            let montoNum = Number(listaG[j].monto);
            if (!isNaN(montoNum)) sumaCat += montoNum;
          }
        }

        let limiteNum = Number(cat.limite);
        if (isNaN(limiteNum) || limiteNum <= 0) limiteNum = 1;

        return {
          id: cat.id,
          name: cat.nombre,
          spent: sumaCat,
          limit: limiteNum,
          color: cat.color || "#512DA8",
          icono: cat.icono || "🏷️",
        };
      });

      setListaGastos(listaG);
      setTotalGastado(sumaTotal);
      setCategoriasDinamicas(categoriasProcesadas);
    } catch (err: any) {
      console.error("Error al cargar datos de Supabase:", err.message);
    }
  };

  useEffect(() => {
    if (!active) return;
    setEditandoSueldo(false);
    setIdEditar(null);
    // Al regresar, conserva los datos visibles mientras consulta los nuevos.
    cargarUsuarioAuth();
    leerDatosReales();
  }, [active]);

  // 3. Modificar sueldo directamente en Supabase
  const guardarNuevoSueldo = async () => {
    const valorLimpio = parseInt(nuevoSueldoInput.replace(/[^0-9]/g, ""));
    if (isNaN(valorLimpio) || valorLimpio <= 0) {
      Alert.alert("Atención", "Ingresa un monto de sueldo válido.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      const { error } = await supabase
        .from("perfiles")
        .update({ sueldo: valorLimpio })
        .eq("id", user.id);

      if (error) {
        Alert.alert("Error al actualizar", error.message);
        return;
      }

      setSueldoTotal(valorLimpio);
      setEditandoSueldo(false);
      setNuevoSueldoInput("");
      Alert.alert("Éxito", "Sueldo actualizado correctamente.");
    } catch (err: any) {
      Alert.alert("Error inesperado", err.message || "No se pudo actualizar.");
    }
  };

  // 4. Borrar gasto de Supabase
  const borrarGasto = async (idBorrar: number) => {
    try {
      const { error } = await supabase
        .from("gastos")
        .delete()
        .eq("id", idBorrar);

      if (error) {
        Alert.alert("Error al eliminar", error.message);
        return;
      }

      if (idEditar === idBorrar) setIdEditar(null);
      leerDatosReales();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const prepararEdicion = (gasto: any) => {
    setIdEditar(gasto.id);
    setMontoEditar(gasto.monto.toString());
  };

  // 5. Editar monto de un gasto en Supabase
  const guardarEdicionGasto = async () => {
    if (idEditar === null) return;
    const montoNum = parseInt(montoEditar.replace(/[^0-9]/g, ""));

    if (isNaN(montoNum) || montoNum <= 0) {
      Alert.alert("Atención", "Ingresa un monto válido.");
      return;
    }

    try {
      const { error } = await supabase
        .from("gastos")
        .update({ monto: montoNum })
        .eq("id", idEditar);

      if (error) {
        Alert.alert("Error al actualizar", error.message);
        return;
      }

      setIdEditar(null);
      setMontoEditar("");
      leerDatosReales();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const porcentajeTotal =
    sueldoTotal > 0 ? Math.round((totalGastado / sueldoTotal) * 100) : 0;
  const saldoDisponible = sueldoTotal - totalGastado;

  if (!perfilCargado) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        {cargandoPerfil ? (
          <ActivityIndicator size="large" color="#512DA8" />
        ) : (
          <View className="items-center p-[20px]">
            <Text className="text-text-secondary">
              No se pudo cargar tu perfil.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setCargandoPerfil(true);
                cargarUsuarioAuth();
                leerDatosReales();
              }}
              className="bg-primary rounded-[12px] p-[16px] mt-[12px]"
            >
              <Text className="text-white font-bold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}
        <BottomNav active={2} onNav={onNav} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      {errorPerfil && (
        <Text className="text-error p-[12px]">
          No se pudo actualizar el perfil. Se muestran los últimos datos
          cargados.
        </Text>
      )}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Saludo dinámico con el nombre del usuario */}
        <View className="flex-row justify-between items-center mb-[20px]">
          <View>
            <Text className="text-[13px] text-text-secondary">
              Buenos días,
            </Text>
            <Text className="text-[20px] font-bold text-text">
              {nombreUsuario} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onNav(6)}
            className="w-[40px] h-[40px] rounded-[12px] bg-card items-center justify-center"
          >
            <Feather name="bell" size={20} color="#512DA8" />
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Resumen Financiero */}
        <LinearGradient
          colors={["#512DA8", "#512DA8"]}
          style={{ borderRadius: 20, padding: 20, marginBottom: 20 }}
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text
                className="text-[11px]"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Disponible · CLP
              </Text>
              <Text className="text-[#A5F3AE] text-[24px] font-bold">
                ${saldoDisponible.toLocaleString("es-CL")}
              </Text>
              <View className="flex-row gap-[14px] mt-[12px] items-center">
                <View>
                  <Text
                    className="text-[10px]"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    Gastado
                  </Text>
                  <Text className="text-card text-[14px] font-semibold">
                    ${totalGastado.toLocaleString("es-CL")}
                  </Text>
                </View>
                <View>
                  <View className="flex-row items-center gap-[4px]">
                    <Text
                      className="text-[10px]"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      Sueldo
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setNuevoSueldoInput(sueldoTotal.toString());
                        setEditandoSueldo(true);
                      }}
                    >
                      <Feather name="edit-2" size={10} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-card text-[14px] font-semibold">
                    ${sueldoTotal.toLocaleString("es-CL")}
                  </Text>
                </View>
              </View>
            </View>
            <MiniBadge
              percent={porcentajeTotal}
              color="rgba(255,255,255,0.85)"
            />
          </View>
        </LinearGradient>

        {/* Formulario flotante para editar sueldo */}
        {editandoSueldo && (
          <View className="bg-card rounded-[14px] p-[16px] mb-[20px] border-[1px] border-primary">
            <View className="flex-row justify-between items-center mb-[8px]">
              <Text className="text-[15px] font-bold text-text">
                Modificar Sueldo Mensual
              </Text>
              <TouchableOpacity onPress={() => setEditandoSueldo(false)}>
                <Feather name="x" size={18} color="#8A849C" />
              </TouchableOpacity>
            </View>
            <TextInput
              value={nuevoSueldoInput}
              onChangeText={setNuevoSueldoInput}
              keyboardType="numeric"
              placeholder="Ingresa tu nuevo sueldo"
              placeholderTextColor="#8A849C"
              className="bg-bg rounded-[10px] px-[12px] h-[42px] mb-[12px] text-[15px] text-text"
            />
            <TouchableOpacity
              onPress={guardarNuevoSueldo}
              className="bg-primary h-[42px] rounded-[10px] items-center justify-center"
            >
              <Text className="text-card font-semibold text-[14px]">
                Actualizar Sueldo
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sección de Categorías */}
        <View className="flex-row justify-between mb-[12px]">
          <Text className="text-[15px] font-bold">Categorías</Text>
          <TouchableOpacity onPress={() => onNav(3)}>
            <Text className="text-primary text-[13px] font-semibold">
              Ver todas
            </Text>
          </TouchableOpacity>
        </View>

        <View className="gap-[10px] mb-[20px]">
          {categoriasDinamicas.map((c) => {
            const p = Math.round((c.spent / c.limit) * 100);
            const colorBarra =
              p >= 100 ? "#C62828" : p >= 80 ? "#F9A825" : c.color;
            return (
              <View
                key={c.id || c.name}
                className="bg-card rounded-[14px] p-[14px]"
              >
                <View className="flex-row justify-between mb-[8px]">
                  <View className="flex-row items-center gap-[8px]">
                    <Text className="text-[16px]">{c.icono}</Text>
                    <Text className="font-semibold text-[14px]">{c.name}</Text>
                  </View>
                  <Text className="font-bold" style={{ color: colorBarra }}>
                    ${c.spent.toLocaleString("es-CL")}
                  </Text>
                </View>
                <ProgressBar percent={p} color={colorBarra} />
              </View>
            );
          })}
        </View>

        {/* Cuadro de edición de un gasto */}
        {idEditar !== null && (
          <View className="bg-card rounded-[14px] p-[16px] mb-[20px] border-[1px] border-primary">
            <View className="flex-row justify-between items-center mb-[12px]">
              <Text className="text-[16px] font-bold text-text">
                Editar Monto del Gasto
              </Text>
              <TouchableOpacity onPress={() => setIdEditar(null)}>
                <Feather name="x" size={20} color="#8A849C" />
              </TouchableOpacity>
            </View>
            <Text className="text-[12px] font-semibold text-text-secondary mb-[4px]">
              Nuevo Monto ($)
            </Text>
            <TextInput
              value={montoEditar}
              onChangeText={setMontoEditar}
              keyboardType="numeric"
              className="bg-bg rounded-[10px] px-[12px] h-[44px] mb-[16px] text-[15px] text-text"
            />
            <TouchableOpacity
              onPress={guardarEdicionGasto}
              className="bg-primary h-[44px] rounded-[10px] items-center justify-center"
            >
              <Text className="text-card font-semibold text-[14px]">
                Guardar Cambios
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista y Gestión de Gastos */}
        <View className="bg-card rounded-[14px] p-[14px]">
          <Text className="text-[16px] font-bold mb-[15px]">
            Gestión de Gastos
          </Text>
          {listaGastos.length === 0 ? (
            <Text className="text-text-secondary text-center my-[10px]">
              Aún no hay gastos registrados.
            </Text>
          ) : (
            listaGastos.map((gasto) => (
              <View
                key={gasto.id}
                className="flex-row items-center py-[12px] border-b-[1px] border-bg"
              >
                <Text className="text-[24px] mr-[15px]">{gasto.icono}</Text>
                <View className="flex-1">
                  <Text className="font-bold text-text text-[16px]">
                    {gasto.categoria}
                  </Text>
                  <Text className="text-text-secondary text-[12px]">
                    ID: {gasto.id}
                  </Text>
                </View>
                <Text className="text-[16px] font-bold text-error mr-[12px]">
                  ${Number(gasto.monto).toLocaleString("es-CL")}
                </Text>
                <View className="flex-row gap-[10px]">
                  <TouchableOpacity
                    onPress={() => prepararEdicion(gasto)}
                    className="p-[4px]"
                  >
                    <Feather name="edit-2" size={18} color="#512DA8" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => borrarGasto(gasto.id)}
                    className="p-[4px]"
                  >
                    <Feather name="trash-2" size={18} color="#C62828" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <BottomNav active={2} onNav={onNav} />
    </View>
  );
}

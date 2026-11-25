import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { supabase } from "../database/supabase";
import TutorialCard from "../tutorial/TutorialCard";
import { useTutorial } from "../tutorial/TutorialProvider";

// Permite registrar un gasto indicando su monto y categoría.
// También permite crear una categoría sin salir de esta pantalla.
export default function ScreenQuickExpense({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  // Obtiene la acción del tutorial y comprueba si la pantalla está abierta.
  const { notificarAccion } = useTutorial();
  const isFocused = useIsFocused();
  const focusedRef = useRef(isFocused);
  focusedRef.current = isFocused;

  // Controla las consultas pendientes y conserva la categoría seleccionada.
  const ultimaCarga = useRef(0);
  const categoriasCargadas = useRef(false);
  const categoriaSeleccionada = useRef<string | number | null>(null);

  // Controla el formulario para crear una categoría.
  const [crearCategoria, setCrearCategoria] = useState(false);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [creando, setCreando] = useState(false);

  // Guarda el monto escrito y las categorías disponibles.
  // selected corresponde a la posición de la categoría elegida en la lista.
  const [amount, setAmount] = useState("0");
  const [cats, setCats] = useState<any[]>([]);
  const [selected, setSelected] = useState(0);

  // Controla los indicadores de carga y guardado.
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Refresca al entrar sin ocultar las categorías que ya están cargadas.
  // Conserva la selección anterior si esa categoría todavía existe.
  const cargarCategoriasUsuario = useCallback(async () => {
    // No consulta si esta pantalla está inactiva.
    if (!focusedRef.current) return;

    const solicitud = ++ultimaCarga.current;

    // Muestra la carga inicial solo mientras no se hayan obtenido categorías.
    if (!categoriasCargadas.current) setCargando(true);

    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      // Interrumpe la consulta si falla la recuperación de la sesión.
      if (errorSesion) throw errorSesion;

      // Exige una sesión válida antes de consultar las categorías.
      if (!session?.user) throw new Error("No hay una sesión activa.");

      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre, icono, limite, color")
        .eq("usuario_id", session.user.id)
        .order("id", { ascending: true });

      // Envía el error al bloque catch si falla la consulta.
      if (error) throw error;

      // Descarta respuestas anteriores o recibidas después de salir de la pantalla.
      if (!focusedRef.current || solicitud !== ultimaCarga.current) return;

      const categorias = data || [];
      const indice = categorias.findIndex(
        (c) => c.id === categoriaSeleccionada.current,
      );

      // Conserva la selección encontrada o utiliza la primera categoría.
      const siguiente = indice >= 0 ? indice : 0;
      setCats(categorias);
      setSelected(siguiente);
      categoriaSeleccionada.current = categorias[siguiente]?.id ?? null;
      categoriasCargadas.current = true;
    } catch (err: any) {
      // Registra el error únicamente si la consulta todavía corresponde a esta vista.
      if (focusedRef.current && solicitud === ultimaCarga.current) {
        console.error("Error al cargar categorías:", err.message);
      }
    } finally {
      // Finaliza el indicador de carga para la consulta vigente de la pantalla activa.
      if (focusedRef.current && solicitud === ultimaCarga.current)
        setCargando(false);
    }
  }, []);

  // Actualiza las categorías al entrar e invalida las consultas pendientes al salir.
  useEffect(() => {
    // No inicia la carga si la pantalla está inactiva.
    if (!isFocused) return;

    cargarCategoriasUsuario();

    return () => {
      ultimaCarga.current += 1;
    };
  }, [isFocused, cargarCategoriasUsuario]);

  // Selecciona una categoría existente con el mismo nombre o crea una nueva.
  // La categoría creada utiliza un icono, límite y color predeterminados.
  const guardarNuevaCategoria = async () => {
    const nombre = nombreCategoria.trim();

    // Evita guardar sin nombre o mientras otra creación está en proceso.
    if (!nombre || creando) return;

    setCreando(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      // Interrumpe la operación si falla la consulta del usuario.
      if (authError) throw authError;

      // Exige un usuario autenticado para crear la categoría.
      if (!user) throw new Error("No hay una sesión activa.");

      const existente = cats.findIndex(
        (c) => c.nombre.toLowerCase() === nombre.toLowerCase(),
      );

      // Selecciona la categoría si su nombre ya aparece en la lista cargada.
      if (existente >= 0) {
        categoriaSeleccionada.current = cats[existente].id;
        setSelected(existente);
      } else {
        // Crea una categoría vinculada al usuario actual.
        const { data, error } = await supabase
          .from("categorias")
          .insert({
            usuario_id: user.id,
            nombre,
            icono: "🏷️",
            limite: 100000,
            color: "#512DA8",
          })
          .select()
          .single();

        // Envía el error al bloque catch si falla la creación.
        if (error) throw error;

        // Invalida lecturas anteriores y añade la nueva categoría como seleccionada.
        ultimaCarga.current += 1;
        categoriaSeleccionada.current = data.id;
        setSelected(cats.length);
        setCats([...cats, data]);
      }

      setNombreCategoria("");
      setCrearCategoria(false);
    } catch (error: any) {
      Alert.alert("Error al crear categoría", error.message);
    } finally {
      // Finaliza el indicador de creación aunque ocurra un error.
      setCreando(false);
    }
  };

  // Teclas del teclado numérico: números, separador decimal y borrado.
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

  // Actualiza el monto según la tecla pulsada.
  // Permite borrar caracteres y evita ingresar más de un punto decimal.
  const handleKey = (k: string) => {
    // Borra el último carácter o vuelve a cero si solo queda uno.
    if (k === "⌫") setAmount((a) => (a.length > 1 ? a.slice(0, -1) : "0"));

    // Ignora un segundo punto decimal.
    else if (k === "." && amount.includes(".")) return;

    // Reemplaza el cero inicial cuando se pulsa un número.
    else if (amount === "0" && k !== ".") setAmount(k);

    // Agrega la tecla al final del monto actual.
    else setAmount((a) => a + k);
  };

  // 2. Guardar el nuevo gasto en la tabla gastos de Supabase asociado al usuario.
  // Después limpia el formulario, notifica al tutorial y cambia de pantalla.
  const guardarGastoReal = async () => {
    const montoNumerico = parseFloat(amount);

    // Rechaza un monto no numérico, no positivo o un registro sin categorías disponibles.
    if (isNaN(montoNumerico) || montoNumerico <= 0 || cats.length === 0) {
      Alert.alert("Atención", "Ingresa un monto válido.");
      return;
    }

    try {
      setGuardando(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Impide guardar el gasto si no existe una sesión activa.
      if (!user) {
        Alert.alert("Error", "No hay una sesión activa.");
        return;
      }

      const categoriaElegida = cats[selected]?.nombre || "General";
      const iconoElegido = cats[selected]?.icono || "🏷️";

      const { error } = await supabase.from("gastos").insert({
        usuario_id: user.id,
        monto: montoNumerico,
        categoria: categoriaElegida,
        icono: iconoElegido,
      });

      // Muestra el error y conserva el formulario si falla el registro.
      if (error) {
        Alert.alert("Error al registrar gasto", error.message);
        return;
      }

      // La pestaña conserva su estado: limpia el monto para no repetir el gasto.
      setAmount("0");
      setCrearCategoria(false);
      setNombreCategoria("");

      // Utiliza el destino del tutorial o vuelve a Inicio si no indica otro.
      const destino = notificarAccion("gasto_creado");
      onNav(destino ?? 2);
    } catch (err: any) {
      Alert.alert(
        "Error inesperado",
        err.message || "No se pudo guardar el gasto.",
      );
    } finally {
      // Finaliza el indicador de guardado tanto si funciona como si falla.
      setGuardando(false);
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
      >
        {/* Paso del tutorial correspondiente al registro de gastos. */}
        <TutorialCard pantalla="Gasto" onNav={onNav} />

        {/* Cabecera */}
        <View className="flex-row justify-between items-center mb-[20px]">
          <Text className="text-[20px] font-bold text-text">Nuevo gasto</Text>
          <TouchableOpacity onPress={() => onNav(2)}>
            <Feather name="x" size={24} color="#6B6580" />
          </TouchableOpacity>
        </View>

        {/* Display del Monto */}
        <View className="items-center mb-[24px]">
          <Text className="text-text-secondary text-[13px]">
            ¿Cuánto gastaste?
          </Text>
          <Text className="text-[42px] font-bold text-text">${amount}</Text>
        </View>

        {/* Selector de Categorías */}
        {cargando ? (
          <ActivityIndicator color="#512DA8" className="my-[20px]" />
        ) : (
          <View className="flex-row flex-wrap gap-[8px] mb-[20px]">
            {cats.length === 0 ? (
              <Text className="text-text-secondary text-[13px] text-center w-[100%] my-[10px]">
                No tienes categorías. Agrega una con Otros…
              </Text>
            ) : (
              // Genera los botones y destaca visualmente la categoría seleccionada.
              cats.map((c, i) => (
                <TouchableOpacity
                  key={c.id || c.nombre}
                  onPress={() => {
                    categoriaSeleccionada.current = c.id;
                    setSelected(i);
                  }}
                  className="w-[31%] py-[12px] rounded-[12px] border-[1px] items-center"
                  style={{
                    borderColor: selected === i ? "#512DA8" : "#E8E4F0",
                    backgroundColor: selected === i ? "#512DA8" : "#fff",
                  }}
                >
                  <Text className="text-[20px]">{c.icono}</Text>
                  <Text
                    numberOfLines={1}
                    className="text-[11px] font-medium mt-[4px]"
                    style={{ color: selected === i ? "#fff" : "#1E1B2E" }}
                  >
                    {c.nombre}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            {/* Abre el formulario para crear una categoría personalizada. */}
            <TouchableOpacity
              onPress={() => setCrearCategoria(true)}
              className="w-[31%] py-[12px] rounded-[12px] bg-card items-center border-[1px] border-border"
            >
              <Feather name="plus" size={20} color="#512DA8" />
              <Text className="text-primary mt-[4px]">Otros…</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Formulario para crear y seleccionar una categoría desde esta pantalla. */}
        {crearCategoria && (
          <View className="p-[16px] bg-card rounded-[12px] mb-[20px] gap-[12px]">
            <Text className="font-bold">Nueva categoría</Text>
            <TextInput
              autoFocus
              placeholder="Ej. Mascotas"
              value={nombreCategoria}
              onChangeText={setNombreCategoria}
              className="p-[12px] bg-bg rounded-[8px]"
            />
            <Text className="text-text-secondary text-[12px]">
              Límite inicial: $100.000. Puedes editarlo en Categorías.
            </Text>

            {/* Guarda la categoría y evita pulsar mientras se está creando. */}
            <TouchableOpacity
              disabled={creando || !nombreCategoria.trim()}
              onPress={guardarNuevaCategoria}
            >
              <Text className="text-primary font-bold">
                {creando ? "Creando…" : "Crear y seleccionar"}
              </Text>
            </TouchableOpacity>

            {/* Oculta el formulario sin crear una categoría. */}
            <TouchableOpacity
              disabled={creando}
              onPress={() => setCrearCategoria(false)}
            >
              <Text>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Teclado Numérico */}
        <View className="flex-row flex-wrap gap-[8px] mb-[20px]">
          {keys.map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => handleKey(k)}
              className="w-[31%] h-[48px] rounded-[10px] bg-card items-center justify-center border-[1px] border-border"
            >
              <Text className="text-[18px] font-semibold text-text">{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón Guardar Gasto */}
        {/* Se desactiva si faltan categorías, el monto es cero o se está guardando. */}
        <TouchableOpacity
          onPress={guardarGastoReal}
          disabled={cats.length === 0 || amount === "0" || guardando}
          className="h-[50px] rounded-[14px] items-center justify-center"
          style={{
            backgroundColor:
              cats.length === 0 || amount === "0" || guardando
                ? "#B39DDB"
                : "#512DA8",
          }}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-card text-[15px] font-semibold">
              Registrar gasto
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Navegación inferior */}
    </View>
  );
}

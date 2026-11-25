import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState, } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { layout } from "../components/layout";
import { consultarCategorias, resumirGastos, type CategoriaResumen, } from "../database/consultasFinanzas";
import { supabase } from "../database/supabase";
import TutorialCard from "../tutorial/TutorialCard";
import { useTutorial } from "../tutorial/TutorialProvider";
import { confirmarEliminacion } from "../utils/confirmarEliminacion";

// Añade el total gastado a los datos de una categoría.
type CategoriaConTotales = CategoriaResumen & { gastado: number };

// Utiliza el mismo tipo de identificador definido para las categorías.
type IdCategoria = CategoriaResumen["id"];

// Cede el turno para que React Native pinte la retirada antes de comenzar
// el trabajo de sesión/persistencia. No adelanta un borrado al onPressIn.
function esperarPintado() {
  return new Promise<void>((resolve) => {
    // Si está disponible, espera al siguiente cuadro antes de continuar.
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    } else {
      // Si no está disponible, utiliza un temporizador.
      setTimeout(resolve, 0);
    }
  });
}

// Opciones sugeridas que el usuario puede agregar a su cuenta.
// Cada sugerencia incluye nombre, icono, límite y color.
const categoriasSugeridas = [
  { nombre: "Alimentación", icono: "🍔", limite: 160000, color: "#7E57C2" },
  { nombre: "Transporte", icono: "🚗", limite: 80000, color: "#F9A825" },
  { nombre: "Compras", icono: "🛍️", limite: 130000, color: "#C62828" },
  { nombre: "Salud", icono: "❤️", limite: 55000, color: "#2E7D32" },
  { nombre: "Vivienda", icono: "🏠", limite: 380000, color: "#512DA8" },
  { nombre: "Servicios", icono: "💡", limite: 100000, color: "#F9A825" },
  { nombre: "Educación", icono: "📚", limite: 100000, color: "#3F51B5" },
  { nombre: "Mascotas", icono: "🐾", limite: 50000, color: "#2E7D32" },
  { nombre: "Entretenimiento", icono: "🎬", limite: 60000, color: "#7E57C2" },
  { nombre: "Ropa", icono: "👕", limite: 70000, color: "#C62828" },
];

// Pantalla para consultar, crear, editar y eliminar categorías.
// También muestra los gastos acumulados y el estado de sus límites.
export default function ScreenCategories({
  onNav,
}: {
  onNav: (i: number) => void;
}) {
  // Controla el tutorial y comprueba si esta pantalla está abierta.
  const { notificarAccion, activo: tutorialActivo } = useTutorial();
  const isFocused = useIsFocused();
  const focusedRef = useRef(isFocused);
  focusedRef.current = isFocused;

  // Identifica la consulta más reciente para descartar respuestas anteriores.
  const ultimaCarga = useRef(0);

  // Controla el panel de sugerencias y la operación de agregar una categoría.
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const agregandoRef = useRef(false);

  // Guarda las categorías y conserva una referencia a la lista actual.
  const [categoriasGuardadas, setListaCategorias] = useState<
    CategoriaConTotales[]
  >([]);
  const categoriasRef = useRef(categoriasGuardadas);
  categoriasRef.current = categoriasGuardadas;

  // Registra las categorías cuya eliminación está en proceso.
  const eliminaciones = useRef(new Map<IdCategoria, CategoriaConTotales>());

  // Conserva las eliminaciones confirmadas frente a lecturas antiguas.
  const eliminadasConfirmadas = useRef(new Set<IdCategoria>());
  const montado = useRef(true);
  const [idsEliminando, setIdsEliminando] = useState<ReadonlySet<IdCategoria>>(
    new Set(),
  );

  // Obtiene la lista visible ocultando las categorías que se están eliminando.
  const listaCategorias = useMemo(
    () => categoriasGuardadas.filter((c) => !idsEliminando.has(c.id)),
    [categoriasGuardadas, idsEliminando],
  );

  // Cuenta las categorías en alerta y las que superaron su límite.
  const { enAlerta, sobrepasadas } = useMemo(() => {
    let enAlerta = 0,
      sobrepasadas = 0;

    for (const categoria of listaCategorias) {
      const limite = Number(categoria.limite);
      const porcentaje = Math.round(
        (categoria.gastado /
          (Number.isFinite(limite) && limite > 0 ? limite : 1)) *
        100,
      );

      // Cuenta como sobrepasada si el porcentaje calculado supera el 100 %.
      if (porcentaje > 100) sobrepasadas++;

      // Cuenta como alerta si el porcentaje está entre el 80 % y el 100 %.
      else if (porcentaje >= 80) enAlerta++;
    }

    return { enAlerta, sobrepasadas };
  }, [listaCategorias]);

  // Indica si el componente sigue montado para evitar actualizarlo al salir.
  useEffect(() => {
    montado.current = true;

    return () => {
      montado.current = false;
    };
  }, []);

  // Controla el formulario y sus campos.
  // El identificador 0 indica que se está creando una categoría nueva.
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [idEditar, setIdEditar] = useState<IdCategoria | 0>(0);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [iconoNuevo, setIconoNuevo] = useState("");
  const [limiteNuevo, setLimiteNuevo] = useState("");

  // 1. Cargar las categorías y gastos de ESTE usuario desde Supabase.
  // Calcula el total gastado que corresponde a cada categoría.
  const cargarCategorias = useCallback(async () => {
    // Evita consultar cuando la pantalla no está abierta.
    if (!focusedRef.current) return;

    const solicitud = ++ultimaCarga.current;

    try {
      const { categorias: categoriasDB, gastos: listaGastos } =
        await consultarCategorias();

      // Descarta la respuesta si se salió de la pantalla o existe otra más reciente.
      if (!focusedRef.current || solicitud !== ultimaCarga.current) return;

      const resumen = resumirGastos(listaGastos);
      let categoriasConTotales = [];

      for (let i = 0; i < (categoriasDB || []).length; i++) {
        // Omite las categorías cuya eliminación ya fue confirmada.
        if (eliminadasConfirmadas.current.has(categoriasDB[i].id)) continue;

        const categoriaActual = { ...categoriasDB[i], gastado: 0 };
        categoriaActual.gastado = resumen.gastoCategoria(
          categoriaActual.nombre,
        );

        categoriasConTotales.push(categoriaActual);
      }

      setListaCategorias(categoriasConTotales);
    } catch (err: any) {
      // Registra el error únicamente si la consulta todavía corresponde a esta vista.
      if (focusedRef.current && solicitud === ultimaCarga.current) {
        console.error("Error al cargar categorías de Supabase:", err.message);
      }
    }
  }, []);

  // Actualiza las categorías al entrar en esta pantalla.
  // Al salir, invalida las consultas que todavía estén pendientes.
  useEffect(() => {
    // No inicia la carga si la pantalla está inactiva.
    if (!isFocused) return;

    cargarCategorias();

    return () => {
      ultimaCarga.current += 1;
    };
  }, [isFocused, cargarCategorias]);

  // Informa al tutorial cuando el usuario abre la sección Categorías.
  useEffect(() => {
    // Notifica la acción solamente mientras esta pantalla está abierta.
    if (isFocused) notificarAccion("categorias_abiertas");
  }, [isFocused, tutorialActivo, notificarAccion]);

  // Comprueba si existe una eliminación pendiente con el mismo nombre.
  // Ignora las diferencias entre mayúsculas, minúsculas y espacios exteriores.
  const nombreEnEliminacion = (nombre: string) =>
    [...eliminaciones.current.values()].some(
      (c) => c.nombre.trim().toLowerCase() === nombre.trim().toLowerCase(),
    );

  // 2. Guardar o actualizar la categoría en Supabase.
  // Valida el nombre, identifica al usuario y guarda los campos del formulario.
  const guardarCategoria = async () => {
    const esNueva = idEditar === 0;

    // Impide guardar una categoría con un nombre que todavía se está eliminando.
    if (nombreEnEliminacion(nombreNuevo)) {
      Alert.alert(
        "Un momento",
        "Espera a que termine de eliminarse esa categoría.",
      );
      return;
    }

    // Solicita un nombre si el campo está vacío o contiene solamente espacios.
    if (!nombreNuevo.trim()) {
      Alert.alert("Atención", "Por favor ingresa un nombre para la categoría.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Detiene el guardado cuando no existe un usuario autenticado.
      if (!user) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      // Define los valores que se guardarán y aplica los valores predeterminados.
      const colorFijo = "#512DA8";
      const limiteNum = parseInt(limiteNuevo.replace(/[^0-9]/g, "")) || 100000;
      const iconoDefinido = iconoNuevo.trim() || "🏷️";

      // El identificador 0 indica que debe crearse una categoría nueva.
      if (idEditar === 0) {
        // Crear categoría vinculada al usuario.
        const { error } = await supabase.from("categorias").insert({
          usuario_id: user.id,
          nombre: nombreNuevo.trim(),
          icono: iconoDefinido,
          limite: limiteNum,
          color: colorFijo,
        });

        // Muestra el error y detiene el proceso si falla la creación.
        if (error) {
          Alert.alert("Error", error.message);
          return;
        }
      } else {
        // Actualizar categoría existente perteneciente al usuario.
        const { error } = await supabase
          .from("categorias")
          .update({
            nombre: nombreNuevo.trim(),
            icono: iconoDefinido,
            limite: limiteNum,
          })
          .eq("id", idEditar)
          .eq("usuario_id", user.id);

        // Muestra el error y detiene el proceso si falla la actualización.
        if (error) {
          Alert.alert("Error", error.message);
          return;
        }
      }

      // Limpia el formulario, lo cierra y actualiza la lista.
      setNombreNuevo("");
      setIconoNuevo("");
      setLimiteNuevo("");
      setIdEditar(0);
      setMostrarFormulario(false);
      cargarCategorias();

      // Informa al tutorial únicamente cuando se creó una categoría nueva.
      if (esNueva) {
        const destino = notificarAccion("categoria_creada");

        // Cambia de pantalla si el tutorial devuelve un destino.
        if (destino !== null) onNav(destino);
      }
    } catch (err: any) {
      Alert.alert(
        "Error inesperado",
        err.message || "No se pudo guardar la categoría.",
      );
    }
  };

  // Agrega una categoría sugerida a la cuenta si todavía no existe.
  // Controla los toques repetidos y comunica la creación al tutorial.
  const agregarSugerida = async (
    categoria: (typeof categoriasSugeridas)[number],
  ) => {
    // Evita otra operación simultánea o agregar un nombre que se está eliminando.
    if (agregandoRef.current || nombreEnEliminacion(categoria.nombre)) return;

    agregandoRef.current = true;
    setAgregando(true);
    let creada = false;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      // Interrumpe el proceso si falla la consulta del usuario.
      if (authError) throw authError;

      // Solicita una sesión válida antes de agregar la sugerencia.
      if (!user) throw new Error("No hay sesión activa.");

      const { data: existentes, error: errorConsulta } = await supabase
        .from("categorias")
        .select("nombre")
        .eq("usuario_id", user.id);

      // Interrumpe el proceso si no fue posible consultar las categorías existentes.
      if (errorConsulta) throw errorConsulta;

      // Guarda la sugerencia solamente si no existe otra categoría con ese nombre.
      if (
        !(existentes || []).some(
          (c) =>
            c.nombre.trim().toLowerCase() === categoria.nombre.toLowerCase(),
        )
      ) {
        const { error } = await supabase
          .from("categorias")
          .insert({ ...categoria, usuario_id: user.id });

        // Envía el error al bloque catch si falla el guardado.
        if (error) throw error;

        creada = true;
      }

      await cargarCategorias();
      setMostrarSugerencias(false);

      // Avanza el tutorial únicamente si se agregó una categoría nueva.
      if (creada) {
        const destino = notificarAccion("categoria_creada");

        // Navega cuando el tutorial indica otra pantalla.
        if (destino !== null) onNav(destino);
      }
    } catch (error: any) {
      Alert.alert("Error al agregar categoría", error.message);
    } finally {
      // Libera el bloqueo tanto si la operación terminó bien como si falló.
      agregandoRef.current = false;
      setAgregando(false);
    }
  };

  // Abre el formulario vacío para crear una categoría personalizada.
  const nuevaCategoria = () => {
    setMostrarSugerencias(false);
    setIdEditar(0);
    setNombreNuevo("");
    setIconoNuevo("");
    setLimiteNuevo("");
    setMostrarFormulario(true);
  };

  // Carga los datos de una categoría en el formulario para editarlos.
  const prepararEdicion = (categoria: any) => {
    setNombreNuevo(categoria.nombre);
    setIconoNuevo(categoria.icono);
    setLimiteNuevo(categoria.limite.toString());
    setIdEditar(categoria.id);
    setMostrarFormulario(true);
  };

  // Solicita confirmación antes de iniciar la eliminación de una categoría.
  const pedirEliminarCategoria = (categoria: CategoriaConTotales) => {
    // Evita solicitar otra eliminación si esa categoría ya se está procesando.
    if (eliminaciones.current.has(categoria.id)) return;

    confirmarEliminacion(
      "Eliminar categoría",
      `¿Quieres eliminar la categoría «${categoria.nombre}»?`,
      () => {
        // Elimina solo si la pantalla sigue activa y la categoría todavía está en la lista.
        if (
          montado.current &&
          focusedRef.current &&
          categoriasRef.current.some((c) => c.id === categoria.id)
        ) {
          void borrarCategoria(categoria.id);
        }
      },
    );
  };

  // Retira la fila al tocar, sin esperar la respuesta de la red.
  // Confirma el borrado en Supabase y restaura la categoría si ocurre un error.
  const borrarCategoria = async (idBorrar: IdCategoria) => {
    const categoria = categoriasGuardadas.find((c) => c.id === idBorrar);

    // No continúa si la categoría ya no está en la lista o se está eliminando.
    if (!categoria || eliminaciones.current.has(idBorrar)) return;

    eliminaciones.current.set(idBorrar, categoria);
    ultimaCarga.current += 1;
    setIdsEliminando(new Set(eliminaciones.current.keys()));

    // Cierra el formulario si corresponde a la categoría que se eliminará.
    if (idEditar === idBorrar) {
      setMostrarFormulario(false);
      setIdEditar(0);
    }

    try {
      await esperarPintado();

      // Detiene el trabajo si el componente ya fue desmontado.
      if (!montado.current) return;

      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      // Interrumpe la operación si falla la consulta de la sesión.
      if (errorSesion) throw errorSesion;

      // Exige una sesión activa para eliminar datos.
      if (!session?.user) throw new Error("No hay una sesión activa.");

      const { data, error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", idBorrar)
        .eq("usuario_id", session.user.id)
        .select("id");

      // Envía el error al bloque catch si falla el borrado.
      if (error) throw error;

      // Una fila ya eliminada en otra sesión tampoco debe reaparecer.
      // Si no se devolvió una fila eliminada, comprueba si todavía existe.
      if (!data?.length) {
        const { data: existente, error: errorConsulta } = await supabase
          .from("categorias")
          .select("id")
          .eq("id", idBorrar)
          .eq("usuario_id", session.user.id)
          .maybeSingle();

        // Interrumpe la comprobación si falla la consulta.
        if (errorConsulta) throw errorConsulta;

        // Considera que el borrado falló si la categoría continúa en la base de datos.
        if (existente)
          throw new Error(
            "No se pudo eliminar la categoría. Revisa tus permisos o inténtalo nuevamente.",
          );
      }

      eliminadasConfirmadas.current.add(idBorrar);

      // Actualiza la lista solamente si el componente sigue montado.
      if (montado.current)
        setListaCategorias((actuales) =>
          actuales.filter((c) => c.id !== idBorrar),
        );
    } catch (error: unknown) {
      // Restaura la categoría y muestra el error si la pantalla sigue montada.
      if (montado.current) {
        // Restaura solo esta categoría; no repone otras eliminadas después.
        setListaCategorias((actuales) =>
          actuales.some((c) => c.id === idBorrar)
            ? actuales
            : [...actuales, categoria],
        );

        Alert.alert(
          "No se pudo eliminar",
          error instanceof Error
            ? error.message
            : "Se restauró la categoría. Inténtalo nuevamente.",
        );
      }
    } finally {
      eliminaciones.current.delete(idBorrar);

      // Actualiza los indicadores de eliminación si el componente sigue montado.
      if (montado.current) {
        setIdsEliminando(new Set(eliminaciones.current.keys()));
      }

      // La respuesta del DELETE ya confirma el cambio. No se vuelve a
      // descargar toda la lista para terminar una eliminación local.
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
      >
        {/* Muestra el paso del tutorial correspondiente a Categorías. */}
        <TutorialCard
          pantalla="Categorias"
          onNav={onNav}
          puedeContinuar={listaCategorias.length > 0}
          onAccion={(accion) => {
            // Abre las sugerencias cuando el tutorial solicita crear una categoría.
            if (accion === "crear_categoria") {
              setMostrarFormulario(false);
              setMostrarSugerencias(true);
            }
          }}
        />

        {/* Encabezado y botón para abrir las categorías sugeridas. */}
        <View className="flex-row justify-between items-center mb-[20px]">
          <Text className="text-[24px] font-black text-text">Categorías</Text>
          <TouchableOpacity
            onPress={() => {
              setMostrarFormulario(false);
              setMostrarSugerencias(true);
            }}
            className="bg-primary flex-row items-center px-[12px] py-[8px] rounded-[8px]"
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text className="font-bold ml-[4px]" style={{ color: "white" }}>
              Nueva
            </Text>
          </TouchableOpacity>
        </View>

        {/* Formulario para crear una categoría o modificar una existente. */}
        {mostrarFormulario && (
          <View
            className="bg-card p-[20px] rounded-[16px] mb-[20px]"
            style={{ elevation: 2 }}
          >
            <View className="flex-row justify-between items-center mb-[20px]">
              <Text className="text-[18px] font-extrabold text-text">
                {idEditar === 0 ? "Nueva Categoría" : "Editar Categoría"}
              </Text>

              {/* Cierra el formulario y termina la selección de edición. */}
              <TouchableOpacity
                onPress={() => {
                  setMostrarFormulario(false);
                  setIdEditar(0);
                }}
              >
                <Feather name="x" size={20} color="#8A849C" />
              </TouchableOpacity>
            </View>

            {/* Campo para escribir el nombre de la categoría. */}
            <Text className="text-[12px] font-bold text-text-secondary mb-[6px] ml-[4px]">
              Nombre de la categoría
            </Text>
            <View className="flex-row items-center bg-bg rounded-[12px] px-[14px] h-[52px] mb-[16px]">
              <Feather
                name="tag"
                size={18}
                color="#8A849C"
                style={{ marginRight: 10 }}
              />
              <TextInput
                placeholder="Ej. Mascotas"
                value={nombreNuevo}
                onChangeText={setNombreNuevo}
                className="flex-1 text-[15px] text-text"
              />
            </View>

            {/* Campos para definir el icono y el límite de gasto. */}
            <View className="flex-row gap-[12px] mb-[24px]">
              <View className="flex-1">
                <Text className="text-[12px] font-bold text-text-secondary mb-[6px] ml-[4px]">
                  Ícono
                </Text>
                <View className="bg-bg rounded-[12px] h-[52px] justify-center items-center">
                  <TextInput
                    placeholder="🐶"
                    value={iconoNuevo}
                    onChangeText={setIconoNuevo}
                    maxLength={2}
                    className="text-[22px] text-center w-[100%]"
                  />
                </View>
              </View>
              <View style={{ flex: 2.5 }}>
                <Text className="text-[12px] font-bold text-text-secondary mb-[6px] ml-[4px]">
                  Límite mensual
                </Text>
                <View className="flex-row items-center bg-bg rounded-[12px] px-[14px] h-[52px]">
                  <Text className="text-muted mr-[6px] text-[16px] font-bold">
                    $
                  </Text>
                  <TextInput
                    placeholder="50000"
                    value={limiteNuevo}
                    onChangeText={setLimiteNuevo}
                    keyboardType="numeric"
                    className="flex-1 text-[15px] text-text"
                  />
                </View>
              </View>
            </View>

            {/* Ejecuta el guardado y cambia su texto según sea creación o edición. */}
            <TouchableOpacity
              onPress={guardarCategoria}
              className="bg-primary h-[52px] rounded-[12px] items-center justify-center flex-row"
            >
              <Feather
                name="save"
                size={18}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text
                className="font-bold text-[15px]"
                style={{ color: "white" }}
              >
                {idEditar === 0 ? "Crear categoría" : "Guardar cambios"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Informa cuando todavía hay eliminaciones pendientes de confirmar. */}
        {idsEliminando.size > 0 && (
          <Text
            accessibilityLiveRegion="polite"
            className="text-primary text-[12px] mb-[12px]"
          >
            {idsEliminando.size === 1
              ? "Guardando eliminación…"
              : "Guardando eliminaciones…"}
          </Text>
        )}

        {/* Resumen con el total de categorías y sus estados. */}
        <View className="flex-row bg-card rounded-[16px] p-[20px] justify-around mb-[20px]">
          <View className="items-center">
            <Text className="text-[24px] font-black text-primary">
              {listaCategorias.length}
            </Text>
            <Text className="text-[11px] text-muted">Total categorías</Text>
          </View>
          <View className="w-[1px] bg-border mx-[10px]" />
          <View className="items-center">
            <Text className="text-[24px] font-black text-alert">
              {enAlerta}
            </Text>
            <Text className="text-[11px] text-muted">En alerta</Text>
          </View>
          <View className="w-[1px] bg-border mx-[10px]" />
          <View className="items-center">
            <Text className="text-[24px] font-black text-error">
              {sobrepasadas}
            </Text>
            <Text className="text-[11px] text-muted">Sobrepasadas</Text>
          </View>
        </View>

        {/* Lista de tarjetas de las categorías del usuario. */}
        <View className="gap-[16px]">
          {/* Mensaje mostrado cuando no existen categorías visibles. */}
          {listaCategorias.length === 0 && (
            <Text className="text-text-secondary">
              No tienes categorías. Puedes crear una con Otros…
            </Text>
          )}

          {/* Calcula el porcentaje y prepara la tarjeta de cada categoría. */}
          {listaCategorias.map((c) => {
            let limiteNum = Number(c.limite);

            // Usa 1 como base de cálculo si el límite es inválido o no es positivo.
            if (isNaN(limiteNum) || limiteNum <= 0) limiteNum = 1;

            let p = Math.round((c.gastado / limiteNum) * 100);

            // Apariencia predeterminada cuando la categoría está dentro de su límite.
            let colorEstado = "#7E57C2";
            let fondoEstado = "rgba(126, 87, 194, 0.1)";
            let textoEstado = "OK";

            // Muestra el estado rojo cuando el porcentaje calculado supera el 100 %.
            if (p > 100) {
              colorEstado = "#C62828";
              fondoEstado = "rgba(198, 40, 40, 0.1)";
              textoEstado = "Sobrepasado";
            } else if (p >= 80) {
              // Muestra el estado de alerta entre el 80 % y el 100 %.
              colorEstado = "#F9A825";
              fondoEstado = "rgba(249, 168, 37, 0.1)";
              textoEstado = "En alerta";
            }

            return (
              <View
                key={c.id}
                className="bg-card rounded-[16px] p-[16px] border-[1px]"
                style={{ borderColor: fondoEstado }}
              >
                {/* Icono, nombre y estado de la categoría. */}
                <View className="flex-row justify-between items-start mb-[12px]">
                  <View className="flex-1 flex-row items-center gap-[12px]">
                    <View className="w-[48px] h-[48px] rounded-[12px] bg-bg items-center justify-center">
                      <Text className="text-[24px]">{c.icono}</Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        numberOfLines={2}
                        className="text-[16px] font-bold text-text"
                      >
                        {c.nombre}
                      </Text>
                      <View
                        className="self-start px-[8px] py-[2px] rounded-[8px] mt-[4px]"
                        style={{ backgroundColor: fondoEstado }}
                      >
                        <Text
                          className="text-[10px] font-bold"
                          style={{ color: colorEstado }}
                        >
                          {textoEstado}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Botones para editar o solicitar la eliminación. */}
                  <View className="flex-row gap-[4px]">
                    <Pressable
                      onPress={() => prepararEdicion(c)}
                      accessibilityRole="button"
                      accessibilityLabel={`Editar categoría ${c.nombre}`}
                      hitSlop={4}
                      style={({ pressed }) => ({
                        minWidth: 44,
                        minHeight: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 22,
                        backgroundColor: pressed ? "#E8E4F0" : "transparent",
                      })}
                    >
                      <Feather name="edit-2" size={18} color="#512DA8" />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar categoría ${c.nombre}`}
                      hitSlop={4}
                      onPress={() => pedirEliminarCategoria(c)}
                      style={({ pressed }) => ({
                        minWidth: 44,
                        minHeight: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 22,
                        backgroundColor: pressed ? "#FEE2E2" : "transparent",
                      })}
                    >
                      <Feather name="trash-2" size={18} color="#C62828" />
                    </Pressable>
                  </View>
                </View>

                {/* Barra de gasto cuyo ancho visual no supera el 100 %. */}
                <View className="h-[8px] bg-border rounded-[99px] overflow-hidden mb-[8px]">
                  <View
                    className="h-[100%] rounded-[99px]"
                    style={{
                      width: `${Math.min(p, 100)}%`,
                      backgroundColor: colorEstado,
                    }}
                  />
                </View>

                {/* Montos y porcentaje con formato numérico de Chile. */}
                <View className="flex-row justify-between">
                  <Text className="text-[12px] text-muted">
                    ${c.gastado.toLocaleString("es-CL")} gastado
                  </Text>
                  <Text
                    className="text-[12px] font-bold"
                    style={{ color: colorEstado }}
                  >
                    {p}% · límite ${limiteNum.toLocaleString("es-CL")}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Abre el formulario para crear una categoría personalizada. */}
          <TouchableOpacity
            onPress={nuevaCategoria}
            className="bg-card rounded-[16px] p-[20px] flex-row items-center gap-[12px]"
          >
            <Feather name="plus-circle" size={24} color="#512DA8" />
            <Text className="text-primary text-[16px] font-bold">Otros…</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Panel de categorías sugeridas, visible solamente en esta pantalla. */}
      <Modal
        visible={mostrarSugerencias && isFocused}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // Permite cerrar el panel si no hay una categoría agregándose.
          if (!agregando) {
            setMostrarSugerencias(false);
          }
        }}
      >
        <View
          className="flex-1 justify-center p-[24px]"
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <View
            className="bg-card rounded-[20px] p-[20px] max-h-[85%]"
            style={layout.modal}
          >
            <View className="flex-row items-center justify-between mb-[12px]">
              <Text className="text-[20px] font-bold text-text flex-1">
                Agregar categoría
              </Text>

              {/* Cierra el panel; se desactiva mientras se agrega una categoría. */}
              <TouchableOpacity
                accessibilityLabel="Cerrar sugerencias"
                disabled={agregando}
                onPress={() => setMostrarSugerencias(false)}
                className="p-[10px]"
              >
                <Feather
                  name="x"
                  size={24}
                  color="#512DA8"
                />
              </TouchableOpacity>
            </View>

            <Text className="text-text-secondary mb-[12px]">
              Toca una para agregarla. Puedes editar su límite después.
            </Text>

            {/* Oculta las sugerencias ya guardadas o pendientes de eliminación. */}
            <ScrollView keyboardShouldPersistTaps="handled">
              {categoriasSugeridas
                .filter(
                  (c) =>
                    !categoriasGuardadas.some(
                      (actual) =>
                        actual.nombre.trim().toLowerCase() ===
                        c.nombre.toLowerCase(),
                    ) && !nombreEnEliminacion(c.nombre),
                )
                .map((c) => (
                  <TouchableOpacity
                    key={c.nombre}
                    disabled={agregando}
                    onPress={() => agregarSugerida(c)}
                    className="flex-row items-center gap-[12px] py-[14px] border-b-[1px] border-bg"
                    style={{
                      opacity: agregando ? 0.5 : 1,
                    }}
                  >
                    <Text className="text-[24px]">
                      {c.icono}
                    </Text>

                    <View className="flex-1">
                      <Text className="text-text font-semibold text-[16px]">
                        {c.nombre}
                      </Text>

                      <Text className="text-text-secondary text-[12px]">
                        Límite mensual: $
                        {c.limite.toLocaleString("es-CL")}
                      </Text>
                    </View>

                    <Feather
                      name="plus"
                      size={20}
                      color="#512DA8"
                    />
                  </TouchableOpacity>
                ))}

              {/* Permite crear una categoría diferente de las sugeridas. */}
              <TouchableOpacity
                disabled={agregando}
                onPress={nuevaCategoria}
                className="flex-row items-center gap-[12px] py-[18px]"
              >
                <Feather
                  name="edit-3"
                  size={24}
                  color="#512DA8"
                />

                <Text className="text-primary text-[16px] font-bold">
                  Otros…
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Mensaje de espera durante el guardado de una sugerencia. */}
            {agregando ? (
              <Text className="text-primary mt-[12px]">
                Agregando categoría…
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

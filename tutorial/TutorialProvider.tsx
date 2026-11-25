import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, } from "react";
import { cargarEstadoTutorial, guardarProgresoTutorial, progresoCompletadoTutorial, progresoInicialTutorial, sincronizarTutorialCompletado, type ProgresoTutorial, } from "../database/tutorialService";
import { pasosTutorial, type AccionTutorial, type PasoTutorial } from "./pasos";

// Define el estado y las acciones que pueden utilizar los componentes del tutorial.
interface TutorialContexto {
  activo: boolean;
  cargando: boolean;
  paso: PasoTutorial;
  pasoId: PasoTutorial["id"];
  pasoNumero: number;
  totalPasos: number;
  mensaje: string;
  avanzar: () => number | null;
  retroceder: () => number | null;
  omitir: () => void;
  reiniciar: () => number;
  notificarAccion: (accion: AccionTutorial) => number | null;
}

// Valores predeterminados cuando un componente consulta el contexto sin un proveedor.
// Mantienen el tutorial inactivo y proporcionan acciones sin efectos.
const fallback: TutorialContexto = {
  activo: false,
  cargando: false,
  paso: pasosTutorial[0],
  pasoId: "inicio",
  pasoNumero: 1,
  totalPasos: pasosTutorial.length,
  mensaje: "",
  avanzar: () => null,
  retroceder: () => null,
  omitir: () => {},
  reiniciar: () => 2,
  notificarAccion: () => null,
};

// Crea el contexto compartido del tutorial.
const Contexto = createContext<TutorialContexto>(fallback);

// Permite acceder al estado y las acciones del tutorial desde otros componentes.
export const useTutorial = () => useContext(Contexto);

// Administra el recorrido del tutorial para el usuario.
// Recupera el progreso, controla los pasos y solicita su guardado y sincronización.
export function TutorialProvider({
  usuarioId,
  children,
}: {
  usuarioId: string;
  children: React.ReactNode;
}) {
  // Estado visible del tutorial y mensajes relacionados con su carga o guardado.
  const [activo, setActivo] = useState(false),
    [cargando, setCargando] = useState(true),
    [mensaje, setMensaje] = useState("");

  const [progreso, setProgreso] = useState<ProgresoTutorial>(
    progresoInicialTutorial,
  );

  // Mantiene el estado actualizado de inmediato para las acciones del tutorial.
  const estadoActual = useRef({
    activo: false,
    progreso: progresoInicialTutorial(),
  });

  // Controla el montaje, las cargas vigentes y el último cambio de progreso.
  const montado = useRef(true),
    generacion = useRef(0),
    ultimoCambio = useRef(0);

  // Encadena los guardados locales para ejecutarlos en el orden solicitado.
  const colaLocal = useRef<Promise<void>>(Promise.resolve());

  // Recupera el progreso del usuario y descarta respuestas que quedaron desactualizadas.
  useEffect(() => {
    montado.current = true;
    const solicitud = ++generacion.current;

    cargarEstadoTutorial(usuarioId)
      .then((estado) => {
        // Ignora la respuesta si el componente se desmontó o la carga fue reemplazada.
        if (!montado.current || solicitud !== generacion.current) return;

        estadoActual.current = {
          activo: estado.activo,
          progreso: estado.progreso,
        };

        setActivo(estado.activo);
        setProgreso(estado.progreso);
        setMensaje(estado.mensaje);
        setCargando(false);

        // Intenta sincronizar una finalización pendiente cuando el estado lo indica.
        if (estado.sincronizarFinal)
          void sincronizarTutorialCompletado(usuarioId).catch(() => {});
      })
      .catch(() => {
        // Muestra el aviso únicamente si la carga sigue vigente y el componente está montado.
        if (montado.current && solicitud === generacion.current) {
          setCargando(false);
          setMensaje(
            "Puedes abrir la guía desde Perfil cuando la conexión esté disponible.",
          );
        }
      });

    // Invalida la carga pendiente al desmontar el componente o cambiar de usuario.
    return () => {
      montado.current = false;
      generacion.current++;
    };
  }, [usuarioId]);

  // Programa el guardado local del progreso.
  // Cuando está completado, también intenta sincronizar la finalización con la cuenta.
  const persistir = useCallback(
    (nuevo: ProgresoTutorial) => {
      const cambio = ++ultimoCambio.current;

      // Serializa escrituras locales para que pulsar rápido no guarde un paso anterior al nuevo.
      colaLocal.current = colaLocal.current
        .catch(() => {})
        .then(() => guardarProgresoTutorial(usuarioId, nuevo));

      const guardado = colaLocal.current;

      void guardado.catch(() => {
        // Informa el fallo solo si corresponde al último cambio y el componente sigue montado.
        if (montado.current && cambio === ultimoCambio.current)
          setMensaje(
            "No se pudo guardar el avance en este dispositivo; puedes continuar usando la guía.",
          );
      });

      // Sincroniza la finalización cuando el nuevo progreso está marcado como completado.
      if (nuevo.completado) {
        void guardado
          .catch(() => {})
          .then(() => sincronizarTutorialCompletado(usuarioId))
          .catch(() => {
            // Muestra el aviso de sincronización únicamente para el último cambio vigente.
            if (montado.current && cambio === ultimoCambio.current)
              setMensaje(
                "El tutorial terminó aquí. Se intentará sincronizar al volver a abrir tu cuenta.",
              );
          });
      }
    },
    [usuarioId],
  );

  // Actualiza el progreso, controla la visibilidad y solicita guardar el cambio.
  const aplicar = useCallback(
    (nuevo: ProgresoTutorial, mostrar: boolean) => {
      estadoActual.current = { activo: mostrar, progreso: nuevo };
      setProgreso(nuevo);
      setActivo(mostrar);
      setMensaje("");
      persistir(nuevo);
    },
    [persistir],
  );

  // Avanza al siguiente paso y devuelve su ruta de navegación.
  // Al terminar el recorrido, oculta la guía y devuelve la ruta de Inicio.
  const avanzar = useCallback((): number | null => {
    const estado = estadoActual.current;

    // No avanza si el tutorial está inactivo.
    if (!estado.activo) return null;

    const siguiente = estado.progreso.paso + 1;

    // Marca el tutorial como completado si ya no quedan pasos.
    if (siguiente >= pasosTutorial.length) {
      aplicar(progresoCompletadoTutorial(), false);
      return 2;
    }

    aplicar({ ...estado.progreso, paso: siguiente }, true);
    return pasosTutorial[siguiente].ruta;
  }, [aplicar]);

  // Retrocede un paso y devuelve la pantalla donde debe mostrarse.
  const retroceder = useCallback((): number | null => {
    const estado = estadoActual.current;

    // No retrocede si el tutorial está inactivo o ya está en el primer paso.
    if (!estado.activo || estado.progreso.paso === 0) return null;

    const anterior = estado.progreso.paso - 1;
    aplicar({ ...estado.progreso, paso: anterior }, true);
    return pasosTutorial[anterior].ruta;
  }, [aplicar]);

  // Omite el recorrido guardándolo como completado y ocultando la guía.
  const omitir = useCallback(() => {
    // Aplica la omisión solamente si el tutorial está activo.
    if (estadoActual.current.activo)
      aplicar(progresoCompletadoTutorial(), false);
  }, [aplicar]);

  // Reinicia el recorrido como una repetición voluntaria y devuelve la ruta de Inicio.
  const reiniciar = useCallback(() => {
    // El avance voluntario se guarda localmente; no reabre la guía en otros dispositivos.
    generacion.current++;
    setCargando(false);
    aplicar(progresoInicialTutorial(true), true);
    return 2;
  }, [aplicar]);

  // Recibe acciones realizadas en la aplicación.
  // Avanza automáticamente cuando la acción corresponde al paso actual.
  const notificarAccion = useCallback(
    (accion: AccionTutorial): number | null => {
      const estado = estadoActual.current;
      const paso = pasosTutorial[estado.progreso.paso];

      // Ignora las acciones cuando el tutorial está inactivo.
      if (!estado.activo) return null;

      // Avanza desde la introducción cuando el usuario abre Categorías.
      if (accion === "categorias_abiertas" && paso.id === "inicio")
        return avanzar();

      // Avanza si se creó una categoría o un gasto durante su paso correspondiente.
      if (
        (accion === "categoria_creada" && paso.id === "categorias") ||
        (accion === "gasto_creado" && paso.id === "gasto")
      )
        return avanzar();

      return null;
    },
    [avanzar],
  );

  // Obtiene los datos del paso actual.
  const paso = pasosTutorial[progreso.paso];

  // Prepara el estado y las acciones que se compartirán con los componentes.
  const valor = useMemo(
    () => ({
      activo,
      cargando,
      paso,
      pasoId: paso.id,
      pasoNumero: progreso.paso + 1,
      totalPasos: pasosTutorial.length,
      mensaje,
      avanzar,
      retroceder,
      omitir,
      reiniciar,
      notificarAccion,
    }),
    [
      activo,
      cargando,
      paso,
      progreso.paso,
      mensaje,
      avanzar,
      retroceder,
      omitir,
      reiniciar,
      notificarAccion,
    ],
  );

  // Entrega el contexto del tutorial a los componentes hijos.
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
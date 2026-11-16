import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  cargarEstadoTutorial,
  guardarProgresoTutorial,
  progresoCompletadoTutorial,
  progresoInicialTutorial,
  sincronizarTutorialCompletado,
  type ProgresoTutorial,
} from "../database/tutorialService";
import { pasosTutorial, type AccionTutorial, type PasoTutorial } from "./pasos";

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
const Contexto = createContext<TutorialContexto>(fallback);
export const useTutorial = () => useContext(Contexto);

export function TutorialProvider({
  usuarioId,
  children,
}: {
  usuarioId: string;
  children: React.ReactNode;
}) {
  const [activo, setActivo] = useState(false),
    [cargando, setCargando] = useState(true),
    [mensaje, setMensaje] = useState("");
  const [progreso, setProgreso] = useState<ProgresoTutorial>(
    progresoInicialTutorial,
  );
  const estadoActual = useRef({
    activo: false,
    progreso: progresoInicialTutorial(),
  });
  const montado = useRef(true),
    generacion = useRef(0),
    ultimoCambio = useRef(0);
  const colaLocal = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    montado.current = true;
    const solicitud = ++generacion.current;
    cargarEstadoTutorial(usuarioId)
      .then((estado) => {
        if (!montado.current || solicitud !== generacion.current) return;
        estadoActual.current = {
          activo: estado.activo,
          progreso: estado.progreso,
        };
        setActivo(estado.activo);
        setProgreso(estado.progreso);
        setMensaje(estado.mensaje);
        setCargando(false);
        if (estado.sincronizarFinal)
          void sincronizarTutorialCompletado(usuarioId).catch(() => {});
      })
      .catch(() => {
        if (montado.current && solicitud === generacion.current) {
          setCargando(false);
          setMensaje(
            "Puedes abrir la guía desde Perfil cuando la conexión esté disponible.",
          );
        }
      });
    return () => {
      montado.current = false;
      generacion.current++;
    };
  }, [usuarioId]);

  const persistir = useCallback(
    (nuevo: ProgresoTutorial) => {
      const cambio = ++ultimoCambio.current;
      // Serializa escrituras locales para que pulsar rápido no guarde un paso anterior al nuevo.
      colaLocal.current = colaLocal.current
        .catch(() => {})
        .then(() => guardarProgresoTutorial(usuarioId, nuevo));
      const guardado = colaLocal.current;
      void guardado.catch(() => {
        if (montado.current && cambio === ultimoCambio.current)
          setMensaje(
            "No se pudo guardar el avance en este dispositivo; puedes continuar usando la guía.",
          );
      });
      if (nuevo.completado) {
        void guardado
          .catch(() => {})
          .then(() => sincronizarTutorialCompletado(usuarioId))
          .catch(() => {
            if (montado.current && cambio === ultimoCambio.current)
              setMensaje(
                "El tutorial terminó aquí. Se intentará sincronizar al volver a abrir tu cuenta.",
              );
          });
      }
    },
    [usuarioId],
  );

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
  const avanzar = useCallback((): number | null => {
    const estado = estadoActual.current;
    if (!estado.activo) return null;
    const siguiente = estado.progreso.paso + 1;
    if (siguiente >= pasosTutorial.length) {
      aplicar(progresoCompletadoTutorial(), false);
      return 2;
    }
    aplicar({ ...estado.progreso, paso: siguiente }, true);
    return pasosTutorial[siguiente].ruta;
  }, [aplicar]);
  const retroceder = useCallback((): number | null => {
    const estado = estadoActual.current;
    if (!estado.activo || estado.progreso.paso === 0) return null;
    const anterior = estado.progreso.paso - 1;
    aplicar({ ...estado.progreso, paso: anterior }, true);
    return pasosTutorial[anterior].ruta;
  }, [aplicar]);
  const omitir = useCallback(() => {
    if (estadoActual.current.activo)
      aplicar(progresoCompletadoTutorial(), false);
  }, [aplicar]);
  const reiniciar = useCallback(() => {
    // El avance voluntario se guarda localmente; no reabre la guía en otros dispositivos.
    generacion.current++;
    setCargando(false);
    aplicar(progresoInicialTutorial(true), true);
    return 2;
  }, [aplicar]);
  const notificarAccion = useCallback(
    (accion: AccionTutorial): number | null => {
      const estado = estadoActual.current;
      const paso = pasosTutorial[estado.progreso.paso];
      if (!estado.activo) return null;
      if (accion === "categorias_abiertas" && paso.id === "inicio")
        return avanzar();
      if (
        (accion === "categoria_creada" && paso.id === "categorias") ||
        (accion === "gasto_creado" && paso.id === "gasto")
      )
        return avanzar();
      return null;
    },
    [avanzar],
  );
  const paso = pasosTutorial[progreso.paso];
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
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

import { Alert, Platform } from "react-native";

let confirmacionActiva: object | null = null;

// Una confirmación compartida evita cuadros duplicados por varios toques.
export function confirmarEliminacion(
  titulo: string,
  mensaje: string,
  alConfirmar: () => void,
): void {
  if (confirmacionActiva) return;
  const identificador = {};
  confirmacionActiva = identificador;
  const cerrar = () => {
    if (confirmacionActiva === identificador) confirmacionActiva = null;
  };
  const eliminar = () => {
    if (confirmacionActiva !== identificador) return;
    cerrar();
    alConfirmar();
  };

  if (Platform.OS === "web") {
    try {
      const navegador = globalThis as typeof globalThis & {
        confirm?: (texto: string) => boolean;
      };
      const aceptado =
        typeof navegador.confirm === "function" &&
        navegador.confirm(`${titulo}\n\n${mensaje}`);
      cerrar();
      if (aceptado) alConfirmar();
    } catch {
      cerrar();
    }
    return;
  }

  try {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: "Cancelar", style: "cancel", onPress: cerrar },
        { text: "Eliminar", style: "destructive", onPress: eliminar },
      ],
      { cancelable: true, onDismiss: cerrar },
    );
  } catch {
    cerrar();
  }
}

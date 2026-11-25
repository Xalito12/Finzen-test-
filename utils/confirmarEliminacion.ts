import { Alert, Platform } from "react-native";

// Identifica la confirmación abierta para impedir que se muestren varias a la vez.
let confirmacionActiva: object | null = null;

// Una confirmación compartida evita cuadros duplicados por varios toques.
// Utiliza el diálogo del navegador en web y una alerta nativa en móviles.
// Ejecuta alConfirmar cuando el usuario acepta la eliminación.
export function confirmarEliminacion(
  titulo: string,
  mensaje: string,
  alConfirmar: () => void,
): void {
  // Evita abrir otra confirmación mientras existe una activa.
  if (confirmacionActiva) return;

  const identificador = {};
  confirmacionActiva = identificador;

  // Libera el bloqueo únicamente si pertenece a esta confirmación.
  const cerrar = () => {
    // Evita modificar una confirmación diferente que pudiera haberse abierto después.
    if (confirmacionActiva === identificador) confirmacionActiva = null;
  };

  // Comprueba que la confirmación sigue vigente y ejecuta la acción de eliminación.
  const eliminar = () => {
    // Ignora la acción si esta confirmación ya no está activa.
    if (confirmacionActiva !== identificador) return;

    cerrar();
    alConfirmar();
  };

  // Utiliza la confirmación del navegador cuando la aplicación se ejecuta en web.
  if (Platform.OS === "web") {
    try {
      const navegador = globalThis as typeof globalThis & {
        confirm?: (texto: string) => boolean;
      };

      // Comprueba que confirm esté disponible y obtiene la respuesta del usuario.
      const aceptado =
        typeof navegador.confirm === "function" &&
        navegador.confirm(`${titulo}\n\n${mensaje}`);

      cerrar();

      // Ejecuta la acción solamente cuando el usuario acepta.
      if (aceptado) alConfirmar();
    } catch {
      // Libera el bloqueo si ocurre un error durante este proceso.
      cerrar();
    }

    return;
  }

  // Muestra una alerta nativa con las opciones de cancelar o eliminar.
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
    // Libera el bloqueo si falla la apertura de la alerta.
    cerrar();
  }
}

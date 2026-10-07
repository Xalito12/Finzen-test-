import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

// Abre o crea la base de datos de manera síncrona únicamente si el entorno es móvil (iOS/Android).
// En Web asigna null para evitar fallos de ejecución, ya que SQLite requiere motor nativo.
export const db = Platform.OS !== "web" ? SQLite.openDatabaseSync("mi_base_datos.db") : null;
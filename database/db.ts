import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

// En móvil usa SQLite nativo; en la web queda en null para no crashear
export const db = Platform.OS !== "web" ? SQLite.openDatabaseSync("mi_base_datos.db") : null;
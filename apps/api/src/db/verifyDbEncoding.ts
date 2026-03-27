import { prisma } from "../config/prisma.js";

/**
 * PostgreSQL uses UTF8 (not utf8mb4 naming like MySQL).
 * This check helps surface misconfigured DB instances where pasted Urdu can break.
 */
export async function verifyDbEncoding(): Promise<void> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ server_encoding: string; client_encoding: string }>>(
      'SELECT current_setting(\'server_encoding\') AS server_encoding, current_setting(\'client_encoding\') AS client_encoding;'
    );
    const row = rows?.[0];
    if (!row) return;
    const server = String(row.server_encoding || "").toUpperCase();
    const client = String(row.client_encoding || "").toUpperCase();
    if (server !== "UTF8" || client !== "UTF8") {
      console.warn(`[DB] Encoding warning: server=${server}, client=${client}. Expected UTF8 for Urdu text safety.`);
    } else {
      console.log(`[DB] Encoding OK: server=${server}, client=${client}`);
    }
  } catch (error) {
    console.warn("[DB] Unable to verify encoding:", error);
  }
}


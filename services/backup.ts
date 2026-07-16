import { db, exportDatabase } from "@/database/db"
import type { AppSettings, BackupRecord, TailorOperation } from "@/types/tailor"

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const iterations = 150_000

function bytesToBase64(bytes: Uint8Array) {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

async function deriveKey(secret: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(secret), "PBKDF2", false, ["deriveKey"])
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
}

export async function encryptBackup(secret: string) {
  const data = await exportDatabase()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(secret, salt)
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(data)))
  return JSON.stringify({ format: "tailor-encrypted-backup", version: 1, salt: bytesToBase64(salt), iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(encrypted)) })
}

export async function decryptBackup(payload: string, secret: string) {
  const parsed = JSON.parse(payload)
  if (parsed.format !== "tailor-encrypted-backup") throw new Error("invalid-format")
  const key = await deriveKey(secret, base64ToBytes(parsed.salt))
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(parsed.iv) }, key, base64ToBytes(parsed.data))
  const backup = JSON.parse(decoder.decode(decrypted)) as { format: string; operations: TailorOperation[]; settings?: AppSettings }
  if (backup.format !== "tailor-daily-backup" || !Array.isArray(backup.operations)) throw new Error("invalid-backup")
  return backup
}

export async function saveBackupRecord(payload: string, source: BackupRecord["source"] = "local") {
  const record: BackupRecord = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), size: new Blob([payload]).size, source, status: "success", payload }
  await db.transaction("rw", db.backups, db.settings, async () => {
    await db.backups.put(record)
    await db.settings.update("main", { lastBackupAt: record.createdAt, lastBackupStatus: "success" })
  })
  return record
}

export async function saveBackupFailure(error: string, source: BackupRecord["source"] = "local") {
  const record: BackupRecord = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), size: 0, source, status: "failed", error }
  await db.transaction("rw", db.backups, db.settings, async () => {
    await db.backups.put(record)
    await db.settings.update("main", { lastBackupStatus: "failed" })
  })
  return record
}

export async function restoreBackup(operations: TailorOperation[], settings: AppSettings | undefined, mode: "merge" | "replace") {
  await db.transaction("rw", db.operations, db.settings, async () => {
    if (mode === "replace") await db.operations.clear()
    await db.operations.bulkPut(operations)
    if (settings) await db.settings.put({ ...settings, id: "main" })
  })
}

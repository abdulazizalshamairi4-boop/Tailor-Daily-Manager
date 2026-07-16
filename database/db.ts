import Dexie, { type EntityTable } from "dexie"
import type { AppSettings, BackupRecord, TailorOperation } from "@/types/tailor"

class TailorDatabase extends Dexie {
  operations!: EntityTable<TailorOperation, "id">
  settings!: EntityTable<AppSettings, "id">
  backups!: EntityTable<BackupRecord, "id">

  constructor() {
    super("tailor-daily-manager")
    this.version(1).stores({
      operations: "id, date, pieceType, currency, status, createdAt, updatedAt, *customers.name, *customers.pageNumber",
      settings: "id",
    })
    this.version(2).stores({
      operations: "id, date, pieceType, currency, status, createdAt, updatedAt, *customers.name, *customers.pageNumber, *customers.phone",
      settings: "id, lastBackupAt, lastBackupStatus",
      backups: "id, createdAt, source, status",
    }).upgrade(async (transaction) => {
      await transaction.table("operations").toCollection().modify((operation: TailorOperation) => {
        operation.customers = operation.customers.map((customer) => ({ ...customer, phone: customer.phone ?? "", notes: customer.notes ?? "", measurements: customer.measurements ?? {} }))
      })
    })
  }
}

export const db = new TailorDatabase()

export async function saveOperation(operation: TailorOperation) {
  await db.operations.put(operation)
}

export async function exportDatabase() {
  const [operations, settings] = await Promise.all([db.operations.toArray(), db.settings.get("main")])
  return { format: "tailor-daily-backup", schemaVersion: 2, exportedAt: new Date().toISOString(), operations, settings }
}

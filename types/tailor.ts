export type Currency = "SAR" | "YER"
export type OperationStatus = "active" | "completed"
export type PaymentStatus = "paid" | "partial" | "unpaid"

export interface Measurements {
  length?: string
  shoulder?: string
  sleeve?: string
  chest?: string
  neck?: string
  width?: string
}

export interface CustomerRow {
  id: string
  name: string
  pageNumber: string
  phone?: string
  notes?: string
  measurements?: Measurements
}

export interface TailorOperation {
  id: string
  pieceType: string
  quantity: number
  unitPrice: number
  currency: Currency
  paid: number
  date: string
  notes: string
  customers: CustomerRow[]
  status: OperationStatus
  createdAt: string
  updatedAt: string
}

export interface BackupRecord {
  id: string
  createdAt: string
  size: number
  status: "success" | "failed"
  source: "local" | "drive" | "safety"
  payload?: string
  error?: string
}

export interface AppSettings {
  id: "main"
  shopName: string
  ownerName: string
  phone: string
  defaultCurrency: Currency
  theme: "light" | "dark" | "system"
  autoBackup: boolean
  backupSchedule: "daily" | "weekly" | "manual"
  backupSecret?: string
  lastBackupAt?: string
  lastBackupStatus?: "success" | "failed"
  driveClientId: string
}

export type AppView = "dashboard" | "operations" | "customers" | "reports" | "print" | "backup" | "settings"

export const DEFAULT_SETTINGS: AppSettings = {
  id: "main",
  shopName: "خياطتي",
  ownerName: "",
  phone: "",
  defaultCurrency: "SAR",
  theme: "light",
  autoBackup: true,
  backupSchedule: "weekly",
  driveClientId: "",
}

export const PIECE_TYPES = ["ثوب", "بدلة", "قميص", "بنطال", "عباءة", "جاكيت"] as const

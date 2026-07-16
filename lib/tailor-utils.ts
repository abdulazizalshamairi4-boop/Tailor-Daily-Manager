import type { Currency, TailorOperation } from "@/types/tailor"

export const currencyLabel: Record<Currency, string> = {
  SAR: "ر.س",
  YER: "ر.ي",
}

export function formatMoney(value: number, currency: Currency) {
  return `${new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(value)} ${currencyLabel[currency]}`
}

export function operationTotal(operation: Pick<TailorOperation, "quantity" | "unitPrice">) {
  return operation.quantity * operation.unitPrice
}

export function operationRemaining(operation: TailorOperation) {
  return Math.max(0, operationTotal(operation) - operation.paid)
}

export function totalsByCurrency(operations: TailorOperation[]) {
  return operations.reduce<Record<Currency, { total: number; paid: number; remaining: number }>>(
    (totals, operation) => {
      const total = operationTotal(operation)
      totals[operation.currency].total += total
      totals[operation.currency].paid += operation.paid
      totals[operation.currency].remaining += Math.max(0, total - operation.paid)
      return totals
    },
    { SAR: { total: 0, paid: 0, remaining: 0 }, YER: { total: 0, paid: 0, remaining: 0 } },
  )
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

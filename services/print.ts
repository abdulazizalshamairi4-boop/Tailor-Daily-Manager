import type { AppSettings, PaymentStatus, TailorOperation } from "@/types/tailor"
import { formatMoney, operationRemaining, operationTotal, totalsByCurrency } from "@/lib/tailor-utils"

export interface PrintFilters {
  mode: "all" | "single" | "date" | "range" | "customer" | "piece" | "payment"
  operationId?: string
  date?: string
  from?: string
  to?: string
  customer?: string
  pieceType?: string
  paymentStatus?: PaymentStatus
}

export function paymentStatus(operation: TailorOperation): PaymentStatus {
  const remaining = operationRemaining(operation)
  if (remaining === 0) return "paid"
  if (operation.paid > 0) return "partial"
  return "unpaid"
}

export function filterForPrint(operations: TailorOperation[], filters: PrintFilters) {
  return operations.filter((operation) => {
    const day = operation.date.slice(0, 10)
    if (filters.mode === "single") return operation.id === filters.operationId
    if (filters.mode === "date") return day === filters.date
    if (filters.mode === "range") return (!filters.from || day >= filters.from) && (!filters.to || day <= filters.to)
    if (filters.mode === "customer") return operation.customers.some((customer) => customer.name === filters.customer)
    if (filters.mode === "piece") return operation.pieceType === filters.pieceType
    if (filters.mode === "payment") return paymentStatus(operation) === filters.paymentStatus
    return true
  })
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char)
}

export function buildPrintDocument(operations: TailorOperation[], settings: AppSettings, title: string) {
  const totals = totalsByCurrency(operations)
  const rows = operations.map((operation, index) => `<tr><td>${index + 1}</td><td>${new Intl.DateTimeFormat("ar-SA").format(new Date(operation.date))}</td><td>${escapeHtml(operation.pieceType)}</td><td>${escapeHtml(operation.customers.map((customer) => customer.name).filter(Boolean).join("، ") || "—")}</td><td>${operation.quantity}</td><td>${formatMoney(operationTotal(operation), operation.currency)}</td><td>${formatMoney(operation.paid, operation.currency)}</td><td>${formatMoney(operationRemaining(operation), operation.currency)}</td></tr>`).join("")
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#20312e;margin:0}.head{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0f3d3e;padding-bottom:14px}.brand{display:flex;align-items:center;gap:12px}.logo{width:48px;height:48px;border-radius:14px;background:#0f3d3e;color:#fff;display:grid;place-items:center;font-size:24px}.meta{font-size:12px;color:#66736f}.summary{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:18px 0}.box{border:1px solid #d9dfdc;border-radius:10px;padding:10px}.box strong{display:block;margin-top:4px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#0f3d3e;color:#fff}th,td{padding:8px;border:1px solid #d9dfdc;text-align:right}tr{break-inside:avoid}.foot{margin-top:18px;text-align:center;font-size:10px;color:#66736f}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><header class="head"><div class="brand"><div class="logo">✂</div><div><h1>${escapeHtml(settings.shopName)}</h1><div class="meta">${escapeHtml(settings.ownerName || "إدارة الخياطة")}</div></div></div><div><strong>${escapeHtml(title)}</strong><div class="meta">${new Intl.DateTimeFormat("ar-SA", { dateStyle: "full", timeStyle: "short" }).format(new Date())}</div></div></header><section class="summary"><div class="box">الريال السعودي<strong>${formatMoney(totals.SAR.total, "SAR")} · محصّل ${formatMoney(totals.SAR.paid, "SAR")} · متبقي ${formatMoney(totals.SAR.remaining, "SAR")}</strong></div><div class="box">الريال اليمني<strong>${formatMoney(totals.YER.total, "YER")} · محصّل ${formatMoney(totals.YER.paid, "YER")} · متبقي ${formatMoney(totals.YER.remaining, "YER")}</strong></div></section><table><thead><tr><th>#</th><th>التاريخ</th><th>القطعة</th><th>العميل</th><th>العدد</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th></tr></thead><tbody>${rows}</tbody></table><footer class="foot">عدد العمليات: ${operations.length} · تم الإنشاء بواسطة ${escapeHtml(settings.shopName)}</footer><script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`
}

export function printOperations(operations: TailorOperation[], settings: AppSettings, title: string) {
  const frame = document.createElement("iframe")
  frame.style.position = "fixed"; frame.style.width = "1px"; frame.style.height = "1px"; frame.style.opacity = "0"
  document.body.appendChild(frame)
  frame.contentDocument?.open(); frame.contentDocument?.write(buildPrintDocument(operations, settings, title)); frame.contentDocument?.close()
  window.setTimeout(() => frame.remove(), 60_000)
}


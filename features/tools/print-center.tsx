"use client"

import { useMemo, useState } from "react"
import { LoaderCircle, Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { formatMoney, totalsByCurrency } from "@/lib/tailor-utils"
import { filterForPrint, printOperations, type PrintFilters } from "@/services/print"
import type { AppSettings, PaymentStatus, TailorOperation } from "@/types/tailor"

const modes = [{ value: "all", label: "جميع العمليات" }, { value: "single", label: "عملية واحدة" }, { value: "date", label: "حسب التاريخ" }, { value: "range", label: "حسب الفترة" }, { value: "customer", label: "حسب العميل" }, { value: "piece", label: "نوع القطعة" }, { value: "payment", label: "حالة الدفع" }] as const

export function PrintCenter({ operations, settings }: { operations: TailorOperation[]; settings: AppSettings }) {
  const [filters, setFilters] = useState<PrintFilters>({ mode: "all" })
  const [printing, setPrinting] = useState(false)
  const results = useMemo(() => filterForPrint(operations, filters), [filters, operations])
  const totals = totalsByCurrency(results)
  const customers = [...new Set(operations.flatMap((operation) => operation.customers.map((customer) => customer.name).filter(Boolean)))]
  const pieces = [...new Set(operations.map((operation) => operation.pieceType))]
  const title = modes.find((mode) => mode.value === filters.mode)?.label ?? "تقرير العمليات"
  async function print() { if (!results.length || printing) return; setPrinting(true); try { printOperations(results, settings, title); toast.success("تم فتح نافذة الطباعة") } catch { toast.error("تعذر تجهيز الطباعة") } finally { window.setTimeout(() => setPrinting(false), 500) } }
  return <div className="flex flex-col gap-5">
    <div><p className="eyebrow">مستندات جاهزة</p><h1 className="text-3xl font-bold">مركز الطباعة</h1><p className="mt-1 text-sm text-muted-foreground">حدد النطاق، راجع الإجماليات، ثم اطبع التقرير.</p></div>
    <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
      <Card><CardHeader><CardTitle>نطاق التقرير</CardTitle><CardDescription>جميع المرشحات تعمل على بيانات جهازك مباشرة.</CardDescription></CardHeader><CardContent><FieldGroup>
        <Field><FieldLabel>نوع التقرير</FieldLabel><select className="h-10 rounded-lg border bg-background px-3" value={filters.mode} onChange={(event) => setFilters({ mode: event.target.value as PrintFilters["mode"] })}>{modes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></Field>
        {filters.mode === "single" && <Field><FieldLabel>العملية</FieldLabel><select className="h-10 rounded-lg border bg-background px-3" onChange={(event) => setFilters({ ...filters, operationId: event.target.value })}><option value="">اختر</option>{operations.map((operation) => <option key={operation.id} value={operation.id}>{operation.pieceType} · {operation.date.slice(0, 10)}</option>)}</select></Field>}
        {filters.mode === "date" && <Field><FieldLabel>التاريخ</FieldLabel><Input type="date" onChange={(event) => setFilters({ ...filters, date: event.target.value })} /></Field>}
        {filters.mode === "range" && <div className="grid grid-cols-2 gap-3"><Field><FieldLabel>من</FieldLabel><Input type="date" onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></Field><Field><FieldLabel>إلى</FieldLabel><Input type="date" onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></Field></div>}
        {filters.mode === "customer" && <Field><FieldLabel>العميل</FieldLabel><select className="h-10 rounded-lg border bg-background px-3" onChange={(event) => setFilters({ ...filters, customer: event.target.value })}><option value="">اختر</option>{customers.map((customer) => <option key={customer} value={customer}>{customer}</option>)}</select></Field>}
        {filters.mode === "piece" && <Field><FieldLabel>نوع القطعة</FieldLabel><select className="h-10 rounded-lg border bg-background px-3" onChange={(event) => setFilters({ ...filters, pieceType: event.target.value })}><option value="">اختر</option>{pieces.map((piece) => <option key={piece} value={piece}>{piece}</option>)}</select></Field>}
        {filters.mode === "payment" && <Field><FieldLabel>حالة الدفع</FieldLabel><select className="h-10 rounded-lg border bg-background px-3" onChange={(event) => setFilters({ ...filters, paymentStatus: event.target.value as PaymentStatus })}><option value="">اختر</option><option value="paid">مدفوع</option><option value="partial">جزئي</option><option value="unpaid">غير مدفوع</option></select></Field>}
      </FieldGroup></CardContent></Card>
      <Card><CardHeader><CardTitle>معاينة الملخص</CardTitle><CardDescription>{results.length} عملية ضمن النطاق المحدد.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-muted p-4"><p className="text-sm text-muted-foreground">الريال السعودي</p><strong className="mt-1 block">{formatMoney(totals.SAR.total, "SAR")}</strong><p className="text-xs text-muted-foreground">محصّل {formatMoney(totals.SAR.paid, "SAR")} · متبقي {formatMoney(totals.SAR.remaining, "SAR")}</p></div><div className="rounded-xl bg-muted p-4"><p className="text-sm text-muted-foreground">الريال اليمني</p><strong className="mt-1 block">{formatMoney(totals.YER.total, "YER")}</strong><p className="text-xs text-muted-foreground">محصّل {formatMoney(totals.YER.paid, "YER")} · متبقي {formatMoney(totals.YER.remaining, "YER")}</p></div></div><Button size="lg" onClick={print} disabled={!results.length || printing}>{printing ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Printer data-icon="inline-start" />}طباعة التقرير</Button></CardContent></Card>
    </div>
  </div>
}

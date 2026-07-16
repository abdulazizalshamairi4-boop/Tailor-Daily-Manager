"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { formatMoney, operationRemaining, operationTotal, totalsByCurrency } from "@/lib/tailor-utils"
import type { TailorOperation } from "@/types/tailor"

const chartConfig = { total: { label: "الدخل", color: "var(--chart-1)" }, paid: { label: "المحصّل", color: "var(--chart-2)" } } satisfies ChartConfig

export function ReportsView({ operations }: { operations: TailorOperation[] }) {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const filtered = useMemo(() => operations.filter((operation) => operation.date.startsWith(month)), [month, operations])
  const totals = totalsByCurrency(filtered)
  const chartData = useMemo(() => Object.values(filtered.reduce<Record<string, { day: string; total: number; paid: number }>>((map, operation) => { const day = operation.date.slice(8, 10); const current = map[day] ?? { day, total: 0, paid: 0 }; current.total += operationTotal(operation); current.paid += operation.paid; map[day] = current; return map }, {})).sort((a, b) => a.day.localeCompare(b.day)), [filtered])
  async function exportExcel() { const XLSX = await import("xlsx"); const rows = filtered.map((item) => ({ التاريخ: item.date.slice(0, 10), القطعة: item.pieceType, العدد: item.quantity, العملة: item.currency, الإجمالي: operationTotal(item), المدفوع: item.paid, المتبقي: operationRemaining(item), العملاء: item.customers.map((customer) => customer.name).join("، ") })); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "التقرير"); XLSX.writeFile(workbook, `تقرير-${month}.xlsx`) }
  return <div className="flex flex-col gap-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">أداء العمل</p><h1 className="text-3xl font-bold">التقارير الشهرية</h1></div><div className="flex gap-2"><Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /><Button variant="outline" onClick={exportExcel} disabled={!filtered.length}><FileSpreadsheet data-icon="inline-start" />Excel</Button></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(["total", "paid", "remaining"] as const).map((key) => <Card key={key}><CardHeader><CardDescription>{{ total: "إجمالي الأجور", paid: "المحصّل", remaining: "المتبقي" }[key]}</CardDescription><CardTitle>{formatMoney(totals.SAR[key], "SAR")}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{formatMoney(totals.YER[key], "YER")}</p></CardContent></Card>)}<Card><CardHeader><CardDescription>القطع</CardDescription><CardTitle>{filtered.reduce((sum, item) => sum + item.quantity, 0)}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{filtered.length} عملية</p></CardContent></Card></div><Card><CardHeader><CardTitle>اتجاه الدخل</CardTitle><CardDescription>الإجمالي والمحصّل بحسب اليوم، مع عرض رقمي موحد للاتجاه فقط.</CardDescription></CardHeader><CardContent>{chartData.length ? <ChartContainer config={chartConfig} className="h-72 w-full"><BarChart accessibilityLayer data={chartData}><CartesianGrid vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="total" fill="var(--color-total)" radius={6} /><Bar dataKey="paid" fill="var(--color-paid)" radius={6} /></BarChart></ChartContainer> : <p className="py-20 text-center text-sm text-muted-foreground">لا توجد بيانات لهذا الشهر.</p>}</CardContent></Card></div>
}

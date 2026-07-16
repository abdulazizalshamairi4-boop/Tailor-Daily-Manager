"use client"

import { Archive, ArrowLeft, Banknote, BarChart3, CircleDollarSign, PackageCheck, Scissors, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney, operationRemaining, operationTotal, totalsByCurrency } from "@/lib/tailor-utils"
import type { AppView, TailorOperation } from "@/types/tailor"

const icons = [Scissors, CircleDollarSign, Banknote, PackageCheck]

export function DashboardView({ operations, onAdd, onViewAll, onNavigate }: { operations: TailorOperation[]; onAdd: () => void; onViewAll: () => void; onNavigate: (view: AppView) => void }) {
  const totals = totalsByCurrency(operations)
  const customers = new Set(operations.flatMap((operation) => operation.customers.map((customer) => customer.name.trim()).filter(Boolean)))
  const summary = [
    { label: "إجمالي القطع", value: new Intl.NumberFormat("ar-SA").format(operations.reduce((sum, item) => sum + item.quantity, 0)), hint: `${operations.length} عملية` },
    { label: "إجمالي الأجور", value: formatMoney(totals.SAR.total, "SAR"), hint: totals.YER.total ? `+ ${formatMoney(totals.YER.total, "YER")}` : "كل العمليات" },
    { label: "تم تحصيله", value: formatMoney(totals.SAR.paid, "SAR"), hint: totals.YER.paid ? `+ ${formatMoney(totals.YER.paid, "YER")}` : "المبالغ المسحوبة" },
    { label: "المتبقي", value: formatMoney(totals.SAR.remaining, "SAR"), hint: totals.YER.remaining ? `+ ${formatMoney(totals.YER.remaining, "YER")}` : "قيد التحصيل" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-3xl bg-primary p-6 text-primary-foreground shadow-xl sm:flex-row sm:items-center sm:justify-between lg:p-8">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit">إدارة يومك بوضوح</Badge>
          <h1 className="max-w-2xl text-balance text-3xl font-bold tracking-tight lg:text-4xl">كل غرزة محسوبة، وكل عميل في مكانه.</h1>
          <p className="max-w-xl text-pretty leading-relaxed text-primary-foreground/75">سجل أعمال الخياطة، تابع المستحقات، واحتفظ بدفترك آمناً حتى دون اتصال بالإنترنت.</p>
        </div>
        <Button size="lg" variant="secondary" onClick={onAdd}><Scissors data-icon="inline-start" />عملية جديدة</Button>
      </section>

      <section aria-label="اختصارات" className="grid grid-cols-2 gap-3 sm:hidden"><Button variant="outline" className="h-14 justify-start" onClick={() => onNavigate("reports")}><BarChart3 />تقرير الشهر</Button><Button variant="outline" className="h-14 justify-start" onClick={() => onNavigate("backup")}><Archive />نسخة احتياطية</Button></section>

      <section aria-label="ملخص اليوم" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item, index) => { const Icon = icons[index]; return (
          <Card key={item.label} className="stat-card overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div><CardDescription>{item.label}</CardDescription><CardTitle className="mt-2 text-2xl tabular-nums">{item.value}</CardTitle></div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Icon /></span>
            </CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{item.hint}</p></CardContent>
          </Card>
        )})}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div><CardTitle>آخر العمليات</CardTitle><CardDescription>أحدث الأعمال المسجلة في الدفتر</CardDescription></div>
            <Button variant="ghost" onClick={onViewAll}>عرض الكل<ArrowLeft data-icon="inline-end" /></Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {operations.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center"><span className="flex size-12 items-center justify-center rounded-2xl bg-muted"><Scissors /></span><div><p className="font-medium">دفترك جاهز لأول عملية</p><p className="text-sm text-muted-foreground">ابدأ بإضافة تفاصيل أول طلب خياطة.</p></div><Button onClick={onAdd}>إضافة أول عملية</Button></div>
            ) : operations.slice(0, 5).map((operation) => (
              <button key={operation.id} type="button" onClick={onViewAll} className="flex items-center justify-between gap-4 rounded-xl border p-3 text-right transition-colors hover:bg-muted/60">
                <div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Scissors /></span><div className="min-w-0"><p className="truncate font-medium">{operation.pieceType} · {operation.quantity} قطع</p><p className="truncate text-xs text-muted-foreground">{operation.customers.map((customer) => customer.name).filter(Boolean).join("، ") || "دون عميل"}</p></div></div>
                <div className="shrink-0 text-left"><p className="font-semibold tabular-nums">{formatMoney(operationTotal(operation), operation.currency)}</p><p className="text-xs text-muted-foreground">متبقي {formatMoney(operationRemaining(operation), operation.currency)}</p></div>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>نظرة سريعة</CardTitle><CardDescription>حالة دفتر العمل الحالي</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm text-muted-foreground"><Users />العملاء</span><strong>{customers.size}</strong></div>
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm text-muted-foreground"><PackageCheck />عمليات مكتملة</span><strong>{operations.filter((item) => item.status === "completed").length}</strong></div>
            <div className="rounded-xl bg-muted p-4"><p className="text-sm font-medium">بياناتك على هذا الجهاز</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">يعمل دفتر الخياط دون إنترنت. أنشئ نسخة احتياطية دورياً للحفاظ على سجلاتك.</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Archive, ArrowLeft, BarChart3, CheckCircle2, Database, HardDrive, PackageCheck, Scissors, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney, operationRemaining, operationTotal } from "@/lib/tailor-utils"
import type { AppView, BackupRecord, TailorOperation } from "@/types/tailor"

function formatBytes(bytes?: number) {
  if (!bytes) return "غير متاح"
  return `${(bytes / 1024 / 1024).toLocaleString("ar-SA", { maximumFractionDigits: 1 })} م.ب`
}

export function DashboardView({ operations, backups, onAdd, onViewAll, onNavigate }: { operations: TailorOperation[]; backups: BackupRecord[]; onAdd: () => void; onViewAll: () => void; onNavigate: (view: AppView) => void }) {
  const [storage, setStorage] = useState<{ usage?: number; quota?: number }>({})
  useEffect(() => { void navigator.storage?.estimate().then((estimate) => setStorage({ usage: estimate.usage, quota: estimate.quota })).catch(() => undefined) }, [])
  const customers = new Set(operations.flatMap((operation) => operation.customers.map((customer) => customer.name.trim()).filter(Boolean)))
  const today = new Date().toDateString()
  const todayOperations = operations.filter((operation) => new Date(operation.date).toDateString() === today).length
  const latest = operations[0]
  const lastBackup = backups[0]

  return (
    <div className="flex flex-col gap-6">
      <section className="hero-panel relative overflow-hidden rounded-3xl p-6 lg:p-8">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit">إدارة يومك بوضوح</Badge>
            <h1 className="max-w-2xl text-balance text-3xl font-bold tracking-tight lg:text-4xl">كل غرزة محسوبة، وكل عميل في مكانه.</h1>
            <p className="max-w-xl text-pretty leading-relaxed text-primary-foreground/80">سجل أعمال الخياطة، تابع المستحقات، واحتفظ بدفترك آمناً حتى دون اتصال بالإنترنت.</p>
          </div>
          <Button size="lg" variant="secondary" onClick={onAdd}><Scissors data-icon="inline-start" />عملية جديدة</Button>
        </div>
      </section>

      <section aria-label="اختصارات" className="grid grid-cols-2 gap-3 sm:hidden"><Button variant="outline" className="h-14 justify-start" onClick={() => onNavigate("reports")}><BarChart3 />تقرير الشهر</Button><Button variant="outline" className="h-14 justify-start" onClick={() => onNavigate("backup")}><Archive />نسخة احتياطية</Button></section>

      <section aria-label="حالة العمل" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="stat-card"><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardDescription>عمليات اليوم</CardDescription><CardTitle className="mt-2 text-3xl tabular-nums">{todayOperations}</CardTitle></div><span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><PackageCheck /></span></CardHeader><CardContent><p className="text-xs text-muted-foreground">من أصل {operations.length} عملية محفوظة</p></CardContent></Card>
        <Card className="stat-card"><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardDescription>العملاء</CardDescription><CardTitle className="mt-2 text-3xl tabular-nums">{customers.size}</CardTitle></div><span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Users /></span></CardHeader><CardContent><p className="text-xs text-muted-foreground">أسماء فريدة في الدفتر</p></CardContent></Card>
        <Card className="stat-card"><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardDescription>آخر نسخة</CardDescription><CardTitle className="mt-2 text-lg">{lastBackup ? new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(lastBackup.createdAt)) : "لم تُنشأ بعد"}</CardTitle></div><span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Archive /></span></CardHeader><CardContent><p className="text-xs text-muted-foreground">{lastBackup?.status === "failed" ? "فشلت آخر محاولة" : lastBackup ? "نسخة مشفرة محفوظة" : "أنشئ نسخة لحماية بياناتك"}</p></CardContent></Card>
        <Card className="stat-card"><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardDescription>سلامة البيانات</CardDescription><CardTitle className="mt-2 text-lg">جاهزة للعمل</CardTitle></div><span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Database /></span></CardHeader><CardContent><p className="text-xs text-muted-foreground">استخدام تقريبي {formatBytes(storage.usage)}</p></CardContent></Card>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
        <Card><CardHeader className="flex flex-row items-center justify-between gap-3"><div><CardTitle>آخر العمليات</CardTitle><CardDescription>أحدث الأعمال المسجلة في الدفتر</CardDescription></div><Button variant="ghost" onClick={onViewAll}>عرض الكل<ArrowLeft data-icon="inline-end" /></Button></CardHeader><CardContent className="flex flex-col gap-2">{operations.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center"><span className="flex size-12 items-center justify-center rounded-2xl bg-muted"><Scissors /></span><div><p className="font-medium">دفترك جاهز لأول عملية</p><p className="text-sm text-muted-foreground">ابدأ بإضافة تفاصيل أول طلب خياطة.</p></div><Button onClick={onAdd}>إضافة أول عملية</Button></div> : operations.slice(0, 5).map((operation) => <button key={operation.id} type="button" onClick={onViewAll} className="flex items-center justify-between gap-4 rounded-xl border p-3 text-right transition-colors hover:bg-muted/60"><div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Scissors /></span><div className="min-w-0"><p className="truncate font-medium">{operation.pieceType} · {operation.quantity} قطع</p><p className="truncate text-xs text-muted-foreground">{operation.customers.map((customer) => customer.name).filter(Boolean).join("، ") || "دون عميل"}</p></div></div><div className="shrink-0 text-left"><p className="font-semibold tabular-nums">{formatMoney(operationTotal(operation), operation.currency)}</p><p className="text-xs text-muted-foreground">متبقي {formatMoney(operationRemaining(operation), operation.currency)}</p></div></button>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>نبض الدفتر</CardTitle><CardDescription>معلومات تشغيلية من جهازك</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 />عمليات مكتملة</span><strong>{operations.filter((item) => item.status === "completed").length}</strong></div><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm text-muted-foreground"><HardDrive />سعة متاحة</span><strong className="text-sm">{storage.quota && storage.usage ? formatBytes(storage.quota - storage.usage) : "غير متاح"}</strong></div><div className="rounded-xl bg-muted p-4"><p className="text-sm font-medium">{latest ? `آخر عمل: ${latest.pieceType}` : "لا توجد أعمال بعد"}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{latest ? `${latest.quantity} قطع · ${new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(latest.date))}` : "أضف أول عملية لتظهر تفاصيلها هنا."}</p></div></CardContent></Card>
      </div>
    </div>
  )
}

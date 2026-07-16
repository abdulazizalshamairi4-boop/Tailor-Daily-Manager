"use client"

import { useMemo, useState } from "react"
import { Copy, MoreHorizontal, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { db, saveOperation } from "@/database/db"
import { formatMoney, operationRemaining, operationTotal } from "@/lib/tailor-utils"
import type { TailorOperation } from "@/types/tailor"

export function OperationsView({ operations, onAdd, onEdit, onPrint }: { operations: TailorOperation[]; onAdd: () => void; onEdit: (operation: TailorOperation) => void; onPrint: (operation: TailorOperation) => void }) {
  const [search, setSearch] = useState("")
  const [period, setPeriod] = useState("all")
  const filtered = useMemo(() => operations.filter((operation) => {
    const query = search.trim().toLowerCase()
    const text = [operation.pieceType, operation.notes, ...operation.customers.flatMap((customer) => [customer.name, customer.pageNumber])].join(" ").toLowerCase()
    const date = new Date(operation.date)
    const now = new Date()
    const matchesPeriod = period === "all" || (period === "today" && date.toDateString() === now.toDateString()) || (period === "month" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear())
    return (!query || text.includes(query)) && matchesPeriod
  }), [operations, period, search])

  async function remove(operation: TailorOperation) {
    if (!window.confirm(`حذف عملية ${operation.pieceType}؟`)) return
    await db.operations.delete(operation.id)
    toast.success("تم حذف العملية")
  }

  async function duplicate(operation: TailorOperation) {
    const now = new Date().toISOString()
    await saveOperation({ ...operation, id: crypto.randomUUID(), date: now, createdAt: now, updatedAt: now, customers: operation.customers.map((customer) => ({ ...customer, id: crypto.randomUUID() })) })
    toast.success("تم إنشاء نسخة جديدة من العملية")
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">سجل العمل</p><h1 className="text-balance text-3xl font-bold">العمليات</h1><p className="mt-1 text-sm text-muted-foreground">ابحث، صفِّ، وعدّل كل أعمال الخياطة.</p></div>
        <Button size="lg" onClick={onAdd}><Plus data-icon="inline-start" />عملية جديدة</Button>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row">
          <label className="relative flex-1"><span className="sr-only">البحث في العمليات</span><Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="ps-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالعميل، القطعة، الصفحة أو الملاحظات..." /></label>
          <select aria-label="الفترة" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-8 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">كل الفترات</option><option value="today">اليوم</option><option value="month">هذا الشهر</option></select>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{filtered.length} نتيجة</p></div>
      {filtered.length === 0 ? <Card><CardContent className="flex min-h-56 flex-col items-center justify-center gap-2 text-center"><Search /><p className="font-medium">لا توجد عمليات مطابقة</p><p className="text-sm text-muted-foreground">غيّر البحث أو أضف عملية جديدة.</p></CardContent></Card> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((operation) => (
            <Card key={operation.id} className="group transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-4 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-accent font-bold text-accent-foreground">{operation.quantity}</span><div><h2 className="font-semibold">{operation.pieceType}</h2><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(operation.date))}</p></div></div>
                  <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="إجراءات العملية" />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuGroup><DropdownMenuItem onClick={() => onEdit(operation)}><Pencil />تعديل</DropdownMenuItem><DropdownMenuItem onClick={() => duplicate(operation)}><Copy />نسخ كعملية جديدة</DropdownMenuItem><DropdownMenuItem onClick={() => onPrint(operation)}><Printer />طباعة العملية</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => remove(operation)}><Trash2 />حذف</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-2">{operation.customers.length ? operation.customers.map((customer) => <Badge key={customer.id} variant="secondary">{customer.name || "عميل"}{customer.pageNumber ? ` · ص ${customer.pageNumber}` : ""}</Badge>) : <Badge variant="outline">دون عميل</Badge>}</div>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-3 text-sm"><div><p className="text-xs text-muted-foreground">الإجمالي</p><strong>{formatMoney(operationTotal(operation), operation.currency)}</strong></div><div><p className="text-xs text-muted-foreground">المسحوب</p><strong>{formatMoney(operation.paid, operation.currency)}</strong></div><div><p className="text-xs text-muted-foreground">المتبقي</p><strong className="text-primary">{formatMoney(operationRemaining(operation), operation.currency)}</strong></div></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

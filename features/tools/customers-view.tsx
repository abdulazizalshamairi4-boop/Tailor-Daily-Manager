"use client"

import { useMemo, useState } from "react"
import { Phone, Ruler, Search, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { CustomerRow, TailorOperation } from "@/types/tailor"

export function CustomersView({ operations }: { operations: TailorOperation[] }) {
  const [search, setSearch] = useState("")
  const customers = useMemo(() => operations.flatMap((operation) => operation.customers.map((customer) => ({ ...customer, operation }))).filter(({ name, phone, pageNumber }) => [name, phone, pageNumber].join(" ").toLowerCase().includes(search.toLowerCase())), [operations, search])
  return <div className="flex flex-col gap-5"><div><p className="eyebrow">دليل سريع</p><h1 className="text-3xl font-bold">العملاء</h1><p className="mt-1 text-sm text-muted-foreground">الأسماء والقياسات مرتبطة مباشرة بالعمليات.</p></div><label className="relative"><span className="sr-only">البحث عن عميل</span><Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="ps-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="الاسم، الجوال أو رقم الصفحة" /></label>{!customers.length ? <Card><CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center"><Users /><p className="font-medium">لا يوجد عملاء مطابقون</p></CardContent></Card> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{customers.map(({ operation, ...customer }, index) => <CustomerCard key={`${operation.id}-${customer.id}-${index}`} customer={customer} pieceType={operation.pieceType} />)}</div>}</div>
}

function CustomerCard({ customer, pieceType }: { customer: CustomerRow; pieceType: string }) {
  const measures = Object.entries(customer.measurements ?? {}).filter(([, value]) => value)
  return <Card><CardHeader><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-accent font-bold">{customer.name?.slice(0, 1) || "ع"}</span><div className="min-w-0"><CardTitle className="truncate">{customer.name || "عميل غير مسمى"}</CardTitle><CardDescription>{pieceType}{customer.pageNumber ? ` · صفحة ${customer.pageNumber}` : ""}</CardDescription></div></div></CardHeader><CardContent className="flex flex-col gap-3">{customer.phone && <a dir="ltr" href={`tel:${customer.phone}`} className="flex items-center justify-end gap-2 text-sm text-primary"><Phone />{customer.phone}</a>}{measures.length > 0 && <div className="flex flex-wrap gap-2"><Ruler />{measures.slice(0, 4).map(([key, value]) => <Badge key={key} variant="secondary">{key}: {value}</Badge>)}</div>}{customer.notes && <p className="text-sm text-muted-foreground">{customer.notes}</p>}</CardContent></Card>
}

"use client"

import { useEffect } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { ChevronDown, LoaderCircle, Plus, Save, Trash2 } from "lucide-react"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { db, saveOperation } from "@/database/db"
import { formatMoney } from "@/lib/tailor-utils"
import { DEFAULT_SETTINGS, PIECE_TYPES, type TailorOperation } from "@/types/tailor"

const measurementSchema = z.object({ length: z.string(), shoulder: z.string(), sleeve: z.string(), chest: z.string(), neck: z.string(), width: z.string() })
const customerSchema = z.object({ name: z.string(), pageNumber: z.string(), phone: z.string(), notes: z.string(), measurements: measurementSchema })
const schema = z.object({
  pieceType: z.string().trim().min(2, "أدخل نوع القطعة"), quantity: z.coerce.number().int().min(1, "العدد يجب أن يكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0), currency: z.enum(["SAR", "YER"]), paid: z.coerce.number().min(0), date: z.string().min(1),
  notes: z.string(), status: z.enum(["active", "completed"]), customers: z.array(customerSchema),
}).refine((value) => value.paid <= value.quantity * value.unitPrice, { path: ["paid"], message: "المسحوب لا يمكن أن يتجاوز الإجمالي" })
type FormValues = z.infer<typeof schema>
const emptyMeasurements = { length: "", shoulder: "", sleeve: "", chest: "", neck: "", width: "" }
const emptyCustomer = { name: "", pageNumber: "", phone: "", notes: "", measurements: emptyMeasurements }

function defaults(operation?: TailorOperation, currency: "SAR" | "YER" = "SAR"): FormValues {
  if (!operation) return { pieceType: "ثوب", quantity: 1, unitPrice: 0, currency, paid: 0, date: new Date().toISOString().slice(0, 10), notes: "", status: "active", customers: [emptyCustomer] }
  return { ...operation, date: operation.date.slice(0, 10), customers: operation.customers.map((customer) => ({ name: customer.name, pageNumber: customer.pageNumber, phone: customer.phone ?? "", notes: customer.notes ?? "", measurements: { ...emptyMeasurements, ...customer.measurements } })) }
}

export function OperationDialog({ open, onOpenChange, operation }: { open: boolean; onOpenChange: (open: boolean) => void; operation?: TailorOperation }) {
  const form = useForm<FormValues>({ defaultValues: defaults(operation) })
  const customers = useFieldArray({ control: form.control, name: "customers" })
  const values = useWatch({ control: form.control, defaultValue: defaults(operation) })
  const total = (Number(values.quantity) || 0) * (Number(values.unitPrice) || 0)
  const currency = values.currency ?? "SAR"

  useEffect(() => { if (open) void db.settings.get("main").then((settings) => form.reset(defaults(operation, settings?.defaultCurrency ?? DEFAULT_SETTINGS.defaultCurrency))) }, [open, operation, form])
  useEffect(() => {
    const quantity = Math.max(1, Number(values.quantity) || 1)
    if (quantity > customers.fields.length) for (let index = customers.fields.length; index < quantity; index++) customers.append(emptyCustomer)
  }, [values.quantity, customers])

  async function submit(raw: FormValues) {
    const result = schema.safeParse(raw)
    if (!result.success) { toast.error("راجع الحقول المطلوبة"); return }
    const data = result.data; const now = new Date().toISOString(); const existing = operation?.customers ?? []
    try {
      await saveOperation({ ...data, id: operation?.id ?? crypto.randomUUID(), date: new Date(`${data.date}T12:00:00`).toISOString(), customers: data.customers.filter((customer) => customer.name.trim() || customer.pageNumber.trim()).map((customer, index) => ({ ...customer, id: existing[index]?.id ?? crypto.randomUUID() })), createdAt: operation?.createdAt ?? now, updatedAt: now })
      toast.success(operation ? "تم تحديث العملية" : "تم حفظ العملية بنجاح"); onOpenChange(false)
    } catch { toast.error("تعذر حفظ العملية") }
  }

  return <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
    <DrawerContent className="mx-auto max-w-3xl" dir="rtl">
      <DrawerHeader className="text-right"><DrawerTitle>{operation ? "تعديل العملية" : "عملية خياطة جديدة"}</DrawerTitle><DrawerDescription>أدخل التفاصيل الأساسية، ثم أضف بيانات العملاء والقياسات عند الحاجة.</DrawerDescription></DrawerHeader>
      <form id="operation-form" onSubmit={form.handleSubmit(submit)} className="overflow-y-auto px-4 pb-5">
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!form.formState.errors.pieceType}><FieldLabel htmlFor="pieceType">نوع القطعة</FieldLabel><Input id="pieceType" list="piece-types" {...form.register("pieceType")} /><datalist id="piece-types">{PIECE_TYPES.map((type) => <option key={type} value={type} />)}</datalist><FieldError errors={[form.formState.errors.pieceType]} /></Field>
            <Field><FieldLabel htmlFor="date">التاريخ</FieldLabel><Input id="date" type="date" {...form.register("date")} /></Field>
            <Field><FieldLabel htmlFor="quantity">عدد القطع</FieldLabel><Input id="quantity" type="number" min="1" {...form.register("quantity")} /></Field>
            <Field><FieldLabel htmlFor="unitPrice">سعر القطعة</FieldLabel><Input id="unitPrice" type="number" min="0" step="0.01" {...form.register("unitPrice")} /></Field>
            <Field><FieldLabel htmlFor="currency">العملة</FieldLabel><select id="currency" className="h-9 rounded-lg border bg-background px-3" {...form.register("currency")}><option value="SAR">ريال سعودي</option><option value="YER">ريال يمني</option></select></Field>
            <Field data-invalid={!!form.formState.errors.paid}><FieldLabel htmlFor="paid">المبلغ المسحوب</FieldLabel><Input id="paid" type="number" min="0" step="0.01" {...form.register("paid")} /><FieldError errors={[form.formState.errors.paid]} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted p-4 text-sm"><div><p className="text-xs text-muted-foreground">الإجمالي</p><strong>{formatMoney(total, currency)}</strong></div><div><p className="text-xs text-muted-foreground">المسحوب</p><strong>{formatMoney(Number(values.paid) || 0, currency)}</strong></div><div><p className="text-xs text-muted-foreground">المتبقي</p><strong className="text-primary">{formatMoney(Math.max(0, total - (Number(values.paid) || 0)), currency)}</strong></div></div>
          <Field><div className="flex items-center justify-between gap-3"><FieldLabel>العملاء</FieldLabel><Button type="button" variant="outline" size="sm" onClick={() => customers.append(emptyCustomer)}><Plus data-icon="inline-start" />إضافة</Button></div>
            <div className="flex flex-col gap-3">{customers.fields.map((field, index) => <Collapsible key={field.id} className="rounded-2xl border bg-card p-3" defaultOpen={index === 0}>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2"><Input aria-label={`اسم العميل ${index + 1}`} placeholder="اسم العميل" {...form.register(`customers.${index}.name`)} /><Input aria-label={`رقم الصفحة ${index + 1}`} placeholder="رقم الصفحة" {...form.register(`customers.${index}.pageNumber`)} /><Button type="button" variant="ghost" size="icon" aria-label="حذف العميل" onClick={() => customers.remove(index)} disabled={customers.fields.length === 1}><Trash2 /></Button></div>
              <CollapsibleTrigger render={<Button type="button" variant="ghost" size="sm" className="mt-2 w-full" />}><ChevronDown data-icon="inline-start" />الجوال والملاحظات والقياسات</CollapsibleTrigger>
              <CollapsibleContent className="pt-3"><div className="grid gap-3 sm:grid-cols-2"><Input aria-label="الجوال" dir="ltr" placeholder="رقم الجوال" {...form.register(`customers.${index}.phone`)} /><Input aria-label="ملاحظات العميل" placeholder="ملاحظات العميل" {...form.register(`customers.${index}.notes`)} />{Object.entries({ length: "الطول", shoulder: "الكتف", sleeve: "الكم", chest: "الصدر", neck: "الرقبة", width: "العرض" }).map(([key, label]) => <Input key={key} aria-label={label} placeholder={label} {...form.register(`customers.${index}.measurements.${key as keyof typeof emptyMeasurements}`)} />)}</div></CollapsibleContent>
            </Collapsible>)}</div>
          </Field>
          <Field><FieldLabel htmlFor="notes">ملاحظات العملية</FieldLabel><Textarea id="notes" rows={3} {...form.register("notes")} /></Field>
        </FieldGroup>
      </form>
      <DrawerFooter className="flex-row"><Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>إلغاء</Button><Button type="submit" form="operation-form" className="flex-1" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}{form.formState.isSubmitting ? "جارٍ الحفظ" : "حفظ"}</Button></DrawerFooter>
    </DrawerContent>
  </Drawer>
}

"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useLiveQuery } from "dexie-react-hooks"
import { Archive, BarChart3, CloudOff, Download, FileText, LayoutDashboard, Menu, Plus, RefreshCw, Scissors, Settings, Users, Wifi } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { db } from "@/database/db"
import { DashboardView } from "@/features/dashboard/dashboard-view"
import { OperationDialog } from "@/features/operations/operation-dialog"
import { OperationsView } from "@/features/operations/operations-view"
import { DEFAULT_SETTINGS } from "@/types/tailor"
import { printOperations } from "@/services/print"
import type { AppView, TailorOperation } from "@/types/tailor"

function ViewLoading() { return <div className="view-enter flex min-h-72 items-center justify-center text-sm text-muted-foreground" role="status">جارٍ تحميل الشاشة…</div> }
const CustomersView = dynamic(() => import("@/features/tools/customers-view").then((mod) => mod.CustomersView), { loading: ViewLoading })
const ReportsView = dynamic(() => import("@/features/tools/reports-view").then((mod) => mod.ReportsView), { loading: ViewLoading })
const PrintCenter = dynamic(() => import("@/features/tools/print-center").then((mod) => mod.PrintCenter), { loading: ViewLoading })
const BackupView = dynamic(() => import("@/features/tools/backup-settings").then((mod) => mod.BackupView), { loading: ViewLoading })
const SettingsView = dynamic(() => import("@/features/tools/backup-settings").then((mod) => mod.SettingsView), { loading: ViewLoading })

const navigation = [
  { id: "dashboard" as const, label: "الرئيسية", icon: LayoutDashboard }, { id: "operations" as const, label: "العمليات", icon: Scissors },
  { id: "customers" as const, label: "العملاء", icon: Users }, { id: "reports" as const, label: "التقارير", icon: BarChart3 },
  { id: "print" as const, label: "الطباعة", icon: FileText }, { id: "backup" as const, label: "النسخ", icon: Archive }, { id: "settings" as const, label: "الإعدادات", icon: Settings },
]
const mobileNavigation = navigation.slice(0, 4)
type InstallPrompt = Event & { prompt: () => Promise<void> }

function NavContent({ view, setView }: { view: AppView; setView: (view: AppView) => void }) { return <nav aria-label="التنقل الرئيسي" className="flex flex-col gap-1">{navigation.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setView(id)} data-active={view === id} className="nav-item flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"><Icon />{label}</button>)}</nav> }

export function TailorApp() {
  const operations = useLiveQuery(() => db.operations.orderBy("date").reverse().toArray(), [], [])
  const settings = useLiveQuery(() => db.settings.get("main"), [], DEFAULT_SETTINGS) ?? DEFAULT_SETTINGS
  const backups = useLiveQuery(() => db.backups.orderBy("createdAt").reverse().toArray(), [], [])
  const [view, setView] = useState<AppView>("dashboard"); const [mobileOpen, setMobileOpen] = useState(false); const [dialogOpen, setDialogOpen] = useState(false); const [editing, setEditing] = useState<TailorOperation>(); const [online, setOnline] = useState(true); const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null); const [updateWorker, setUpdateWorker] = useState<ServiceWorker | null>(null)
  useEffect(() => { void db.settings.get("main").then((value) => { if (!value) return db.settings.put(DEFAULT_SETTINGS) }) }, [])
  useEffect(() => { const connection = () => setOnline(navigator.onLine); const install = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt) }; const update = (event: Event) => setUpdateWorker((event as CustomEvent<ServiceWorker>).detail); connection(); window.addEventListener("online", connection); window.addEventListener("offline", connection); window.addEventListener("beforeinstallprompt", install); window.addEventListener("tailor-sw-update", update); return () => { window.removeEventListener("online", connection); window.removeEventListener("offline", connection); window.removeEventListener("beforeinstallprompt", install); window.removeEventListener("tailor-sw-update", update) } }, [])
  function navigate(next: AppView) { setView(next); setMobileOpen(false) } function add() { setEditing(undefined); setDialogOpen(true) } function edit(operation: TailorOperation) { setEditing(operation); setDialogOpen(true) }
  async function applyUpdate() { if (dialogOpen && !window.confirm("لديك نموذج مفتوح. أغلقه وتابع التحديث؟")) return; updateWorker?.postMessage({ type: "SKIP_WAITING" }); let reloaded = false; navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloaded) { reloaded = true; window.location.reload() } }) }
  return <div className="min-h-dvh bg-background">
    <aside className="fixed inset-y-0 right-0 hidden w-64 border-l border-sidebar-border bg-sidebar p-5 text-sidebar-foreground lg:flex lg:flex-col"><div className="flex items-center gap-3 px-2 py-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground"><Scissors /></span><div><p className="font-bold">{settings.shopName}</p><p className="text-xs text-sidebar-foreground/55">دفترك يعمل دون اتصال</p></div></div><div className="my-6 h-px bg-sidebar-border" /><NavContent view={view} setView={navigate} /><div className="mt-auto rounded-2xl bg-sidebar-accent p-4"><div className="flex items-center gap-2 text-xs font-medium">{online ? <Wifi /> : <CloudOff />}{online ? "متصل" : "دون اتصال"}</div><p className="mt-2 text-xs leading-relaxed text-sidebar-foreground/55">{settings.lastBackupAt ? `آخر نسخة ${new Intl.DateTimeFormat("ar-SA").format(new Date(settings.lastBackupAt))}` : "أنشئ أول نسخة احتياطية"}</p></div></aside>
    <div className="lg:pr-64"><header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-xl"><div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة"><Menu /></Button><div><p className="font-bold">خياطتي</p><p className="text-xs text-muted-foreground">{navigation.find((item) => item.id === view)?.label}</p></div></div><div className="flex items-center gap-2">{!online && <Badge variant="outline"><CloudOff />دون اتصال</Badge>}{installPrompt && <Button variant="outline" size="sm" onClick={async () => { await installPrompt.prompt(); setInstallPrompt(null) }}><Download /><span className="hidden sm:inline">تثبيت</span></Button>}<Button className="hidden sm:flex" size="sm" onClick={add}><Plus />عملية جديدة</Button></div></div></header>
      {updateWorker && <div className="sticky top-16 z-20 flex items-center justify-center gap-3 bg-accent px-4 py-2 text-sm text-accent-foreground"><RefreshCw />يتوفر إصدار جديد<Button size="sm" variant="outline" onClick={applyUpdate}>تحديث الآن</Button></div>}
      <main key={view} className="view-enter mx-auto min-h-[calc(100dvh-4rem)] max-w-[1500px] p-4 pb-32 sm:p-6 sm:pb-32 lg:p-8 lg:pb-8">{view === "dashboard" && <DashboardView operations={operations} backups={backups} onAdd={add} onViewAll={() => setView("operations")} onNavigate={setView} />}{view === "operations" && <OperationsView operations={operations} onAdd={add} onEdit={edit} onPrint={(operation) => printOperations([operation], settings, `عملية ${operation.pieceType}`)} />}{view === "customers" && <CustomersView operations={operations} />}{view === "reports" && <ReportsView operations={operations} />}{view === "print" && <PrintCenter operations={operations} settings={settings} />}{view === "backup" && <BackupView settings={settings} />}{view === "settings" && <SettingsView settings={settings} />}</main></div>
    <Button size="icon-lg" className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-5 z-40 size-14 rounded-full shadow-xl lg:hidden" onClick={add} aria-label="إضافة عملية جديدة"><Plus /></Button>
    <nav aria-label="التنقل على الهاتف" className="fixed inset-x-3 bottom-[calc(.75rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-5 items-center rounded-2xl border bg-background/95 p-1.5 shadow-lg backdrop-blur-xl lg:hidden">{mobileNavigation.map(({ id, label, icon: Icon }, index) => <button key={id} type="button" style={{ "--nav-index": index } as React.CSSProperties} onClick={() => setView(id)} data-active={view === id} className="mobile-nav-item flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] text-muted-foreground transition-[color,background-color,transform] active:scale-95 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"><Icon />{label}</button>)}<button type="button" onClick={() => setMobileOpen(true)} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] text-muted-foreground"><Menu />المزيد</button></nav>
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="right" dir="rtl" className="bg-sidebar text-sidebar-foreground [&>button]:left-4 [&>button]:right-auto [&>button]:text-sidebar-foreground"><SheetHeader><SheetTitle className="flex items-center gap-2 text-sidebar-foreground"><Scissors />{settings.shopName}</SheetTitle><SheetDescription className="text-sidebar-foreground/80">كل أدوات العمل والنسخ والطباعة.</SheetDescription></SheetHeader><div className="p-4"><NavContent view={view} setView={navigate} /></div></SheetContent></Sheet><OperationDialog open={dialogOpen} onOpenChange={setDialogOpen} operation={editing} />
  </div>
}

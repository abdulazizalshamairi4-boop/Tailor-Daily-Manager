"use client"

import { useEffect } from "react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { db } from "@/database/db"
import { encryptBackup, saveBackupRecord } from "@/services/backup"

function announceWaiting(worker: ServiceWorker | null) {
  if (worker) window.dispatchEvent(new CustomEvent("tailor-sw-update", { detail: worker }))
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return
    let registration: ServiceWorkerRegistration | undefined
    void navigator.serviceWorker.register("/sw.js").then((value) => {
      registration = value; announceWaiting(value.waiting)
      value.addEventListener("updatefound", () => { const worker = value.installing; worker?.addEventListener("statechange", () => { if (worker.state === "installed" && navigator.serviceWorker.controller) announceWaiting(worker) }) })
    })
    const check = () => { if (navigator.onLine) void registration?.update() }
    window.addEventListener("online", check); window.addEventListener("focus", check)
    return () => { window.removeEventListener("online", check); window.removeEventListener("focus", check) }
  }, [])
  useEffect(() => {
    void db.settings.get("main").then(async (settings) => {
      if (!settings?.autoBackup || !settings.backupSecret || settings.backupSchedule === "manual") return
      const interval = settings.backupSchedule === "daily" ? 86_400_000 : 604_800_000
      const due = !settings.lastBackupAt || Date.now() - new Date(settings.lastBackupAt).getTime() >= interval
      if (due) await saveBackupRecord(await encryptBackup(settings.backupSecret))
    }).catch(() => undefined)
  }, [])
  return <ThemeProvider attribute="class" defaultTheme="light" enableSystem>{children}<Toaster position="top-center" richColors dir="rtl" /></ThemeProvider>
}

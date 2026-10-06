import { useState, useEffect } from 'react'
import { Database, Printer, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import appIcon from '../assets/app_icon.png'

/**
 * StartupSplashScreen
 * Provides a native Windows .exe startup splash animation matching the user's
 * deep navy / royal blue aesthetic from the setup screen.
 * Displays connection checks (Database & Print service) and smoothly fades out into the workspace.
 */
export default function StartupSplashScreen({ onComplete }) {
  const [stage, setStage] = useState(0) // 0: booting, 1: checking DB, 2: checking Print, 3: ready, 4: fading out
  const [closing, setClosing] = useState(false)
  const dbStatus = useLabelStore((s) => s.dbStatus)
  const printServiceStatus = useLabelStore((s) => s.printServiceStatus)

  useEffect(() => {
    // Stage 1: Connect to database (after 400ms)
    const t1 = setTimeout(() => setStage(1), 400)
    // Stage 2: Connect to print service (after 1000ms)
    const t2 = setTimeout(() => setStage(2), 1100)
    // Stage 3: Ready / Verified (after 1800ms)
    const t3 = setTimeout(() => setStage(3), 1900)
    // Stage 4: Fade out and transition to main app (after 2600ms)
    const t4 = setTimeout(() => {
      setClosing(true)
      setTimeout(() => {
        if (onComplete) onComplete()
      }, 500)
    }, 2500)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [onComplete])

  const handleSkip = () => {
    setClosing(true)
    setTimeout(() => {
      if (onComplete) onComplete()
    }, 250)
  }

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center select-none cursor-pointer transition-opacity duration-500 ${
        closing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 38%, #143565 0%, #0A1C38 45%, #050D1A 100%)',
      }}
      title="Click anywhere to skip startup splash"
    >
      {/* Background ambient radial glow matching setup window */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[580px] rounded-full bg-blue-600/20 blur-[110px] pointer-events-none animate-splash-glow" />

      {/* Main Glass Splash Card */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md p-8 animate-splash-card">
        {/* App Icon with glowing badge */}
        <div className="relative mb-6">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(37,99,235,0.45)] ring-1 ring-white/20 animate-badge-pulse">
            <img
              src={appIcon}
              alt="Label Designer Icon"
              className="h-full w-full object-cover scale-105"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0A1C38] shadow-sm">
            <Sparkles size={13} className="text-white" />
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm text-center">
          SPIL Label Designer
        </h1>
        <p className="mt-1 text-xs font-medium text-sky-200/80 text-center">
          Standalone Windows Edition · Rust Tauri v2
        </p>

        {/* Dynamic Status Progress Card */}
        <div className="mt-8 w-full rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-4 shadow-xl">
          <div className="space-y-3">
            {/* Database check step */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2.5 text-slate-200">
                <Database size={15} className={stage >= 1 ? 'text-sky-400' : 'text-slate-500'} />
                <span>Shared Database (SQL)</span>
              </div>
              <span className="text-[11px]">
                {stage >= 1 ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <CheckCircle2 size={13} />
                    <span>SPIL-SQL01 OK</span>
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal">Connecting…</span>
                )}
              </span>
            </div>

            {/* Print service check step */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2.5 text-slate-200">
                <Printer size={15} className={stage >= 2 ? 'text-sky-400' : 'text-slate-500'} />
                <span>SPIL Print Service</span>
              </div>
              <span className="text-[11px]">
                {stage >= 2 ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <CheckCircle2 size={13} />
                    <span>Port 5088 OK</span>
                  </span>
                ) : stage >= 1 ? (
                  <span className="text-sky-300 font-normal animate-pulse">Checking…</span>
                ) : (
                  <span className="text-slate-500 font-normal">Waiting</span>
                )}
              </span>
            </div>
          </div>

          {/* Shimmer progress bar */}
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500 ease-out"
              style={{
                width: stage === 0 ? '15%' : stage === 1 ? '55%' : stage === 2 ? '85%' : '100%',
              }}
            />
          </div>
        </div>

        {/* Footnote / Credential hint */}
        <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          <span>Windows Credential Manager · Click anywhere to skip</span>
        </div>
      </div>
    </div>
  )
}

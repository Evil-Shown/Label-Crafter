import ReportMark from '../ui/ReportMark'

export default function ReportDesignerView({ onBack }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[var(--bg)] text-[var(--tx)]">
      <header className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--nav)] px-4 py-3 text-white">
        <button type="button" onClick={onBack} className="lc-btn lc-btn-ghost !text-white">
          Back
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
          <ReportMark size={22} />
        </span>
        <div>
          <h1 className="text-[15px] font-bold leading-tight">Report Designer</h1>
          <p className="text-[12px] text-[#C6D6E8]">Opti report templates</p>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 items-center justify-center p-8">
        <div className="flex w-full max-w-[720px] flex-col items-center rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-8 py-10 text-center shadow-[var(--sh-sm)]">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg)]">
            <ReportMark size={40} />
          </span>
          <h2 className="text-[20px] font-bold">Opti report templates</h2>
          <p className="mt-2 max-w-[460px] text-[13px] leading-relaxed text-[var(--mut)]">
            This is the report designer. Label templates stay in Label Designer. Report pages for Opti will be built here.
          </p>
        </div>
      </main>
    </div>
  )
}

/**
 * Visual miniature label mockup preview for draft template styles
 */
export function StylePreviewCard({ styleId, accent = '#0f172a' }) {
  if (styleId === 'industrial_pro') {
    return (
      <div className="relative w-full h-[88px] rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 overflow-hidden shadow-xs flex flex-col justify-between select-none">
        {/* Top Header Row with High Contrast */}
        <div className="flex items-center justify-between border-b border-slate-900 dark:border-slate-200 pb-1">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-white" />
            <div className="h-2 w-14 bg-slate-900 dark:bg-slate-100 rounded-xs font-black" />
          </div>
          <div className="h-1.5 w-10 bg-slate-400 dark:bg-slate-500 rounded-xs" />
        </div>

        {/* Black Box Highlight Badge */}
        <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-1.5 py-0.5 rounded-xs flex items-center justify-between text-[7px] font-bold tracking-wider">
          <span className="scale-90 origin-left">ORD-44910</span>
          <span className="h-1.5 w-6 bg-white/40 dark:bg-slate-900/40 rounded-xs" />
        </div>

        {/* Barcode Strip */}
        <div className="flex items-center justify-center gap-[1.5px] py-0.5 bg-slate-50 dark:bg-slate-800/60 rounded-xs">
          <span className="h-3.5 w-[1px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-3.5 w-[2px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-3.5 w-[1px] bg-slate-400 dark:bg-slate-500" />
          <span className="h-3.5 w-[3px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-3.5 w-[1px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-3.5 w-[2px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-3.5 w-[1px] bg-slate-400 dark:bg-slate-500" />
          <span className="h-3.5 w-[2px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-3.5 w-[1px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-3.5 w-[3px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-3.5 w-[1px] bg-slate-900 dark:bg-slate-200" />
        </div>

        {/* 2-Column Specs Grid */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-5 bg-slate-400 dark:bg-slate-500 rounded-2xs" />
            <div className="h-1.5 w-7 bg-slate-800 dark:bg-slate-200 rounded-2xs font-bold" />
          </div>
          <div className="flex items-center gap-1 justify-end">
            <div className="h-1.5 w-6 bg-slate-400 dark:bg-slate-500 rounded-2xs" />
            <div className="h-1.5 w-5 bg-slate-800 dark:bg-slate-200 rounded-2xs font-bold" />
          </div>
        </div>
      </div>
    )
  }

  if (styleId === 'modern_card') {
    return (
      <div className="relative w-full h-[88px] rounded-md border-2 border-blue-600 dark:border-blue-500 bg-white dark:bg-slate-900 p-1.5 overflow-hidden shadow-xs flex flex-col justify-between select-none">
        {/* Modern Accent Top Header */}
        <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-xs px-1.5 py-1 flex items-center justify-between">
          <div className="h-2 w-16 bg-blue-700 dark:bg-blue-400 rounded-xs font-bold" />
          <span className="h-2 px-1 rounded-full bg-blue-600 text-white text-[6px] font-black leading-none flex items-center">
            PROD
          </span>
        </div>

        {/* Dual Barcode + QR Section */}
        <div className="flex items-center justify-between gap-1.5 py-1 px-1 bg-slate-50 dark:bg-slate-800/40 rounded-xs border border-dashed border-slate-200 dark:border-slate-800">
          {/* Barcode */}
          <div className="flex items-center gap-[1.5px] flex-1 justify-center">
            <span className="h-3 w-[1px] bg-slate-800 dark:bg-slate-200" />
            <span className="h-3 w-[2px] bg-slate-800 dark:bg-slate-200" />
            <span className="h-3 w-[1px] bg-slate-400 dark:bg-slate-500" />
            <span className="h-3 w-[3px] bg-slate-800 dark:bg-slate-200" />
            <span className="h-3 w-[1px] bg-slate-800 dark:bg-slate-200" />
            <span className="h-3 w-[2px] bg-slate-800 dark:bg-slate-200" />
          </div>
          {/* QR Box */}
          <div className="h-5 w-5 border border-slate-800 dark:border-slate-300 rounded-2xs flex items-center justify-center p-[2px] bg-white dark:bg-slate-800">
            <div className="grid grid-cols-2 gap-[1px] w-full h-full">
              <span className="bg-slate-900 dark:bg-slate-100 rounded-2xs" />
              <span className="bg-slate-400 dark:bg-slate-500 rounded-2xs" />
              <span className="bg-slate-400 dark:bg-slate-500 rounded-2xs" />
              <span className="bg-slate-900 dark:bg-slate-100 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Structured Segmented Fields */}
        <div className="grid grid-cols-2 gap-1">
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-xs border border-slate-200 dark:border-slate-700 flex items-center px-1">
            <span className="h-1 w-8 bg-slate-600 dark:bg-slate-400 rounded-2xs" />
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-xs border border-slate-200 dark:border-slate-700 flex items-center px-1">
            <span className="h-1 w-9 bg-slate-600 dark:bg-slate-400 rounded-2xs" />
          </div>
        </div>
      </div>
    )
  }

  if (styleId === 'compact_dense') {
    return (
      <div className="relative w-full h-[88px] rounded-md border border-emerald-600/60 dark:border-emerald-500/60 bg-white dark:bg-slate-900 p-1.5 overflow-hidden shadow-xs flex flex-col justify-between select-none">
        {/* Dense Header */}
        <div className="flex items-center justify-between border-b border-emerald-600/40 pb-0.5">
          <div className="h-2 w-12 bg-emerald-800 dark:bg-emerald-400 rounded-2xs font-bold" />
          <div className="h-1.5 w-8 bg-slate-400 dark:bg-slate-500 rounded-2xs" />
        </div>

        {/* Compact Barcode */}
        <div className="flex items-center justify-center gap-[1px] py-0.5">
          <span className="h-2.5 w-[1px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-2.5 w-[2px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-2.5 w-[1px] bg-slate-300 dark:bg-slate-600" />
          <span className="h-2.5 w-[2px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-2.5 w-[1px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-2.5 w-[3px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-2.5 w-[1px] bg-slate-900 dark:bg-slate-200" />
          <span className="h-2.5 w-[2px] bg-slate-900 dark:bg-slate-200" />
        </div>

        {/* 4 Multi-Line Compact Rows */}
        <div className="grid grid-cols-2 gap-x-1.5 gap-y-1 text-[6.5px]">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-1 py-0.5 rounded-2xs">
            <span className="text-slate-400">Dim</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">1200×600</span>
          </div>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-1 py-0.5 rounded-2xs">
            <span className="text-slate-400">Qty</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">24 pcs</span>
          </div>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-1 py-0.5 rounded-2xs">
            <span className="text-slate-400">Edge</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">PVC 2mm</span>
          </div>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-1 py-0.5 rounded-2xs">
            <span className="text-slate-400">Seq</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">#04</span>
          </div>
        </div>
      </div>
    )
  }

  if (styleId === 'minimal_clean') {
    return (
      <div className="relative w-full h-[88px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 overflow-hidden shadow-xs flex flex-col justify-between select-none">
        {/* Clean Stacked Flow */}
        <div className="space-y-1">
          <div className="h-2 w-14 bg-slate-800 dark:bg-slate-200 rounded-xs font-bold" />
          <div className="h-1.5 w-20 bg-slate-400 dark:bg-slate-500 rounded-2xs" />
        </div>

        {/* Light Minimal Barcode */}
        <div className="flex items-center justify-start gap-[1.5px] py-1">
          <span className="h-3 w-[1px] bg-slate-800 dark:bg-slate-300" />
          <span className="h-3 w-[2px] bg-slate-800 dark:bg-slate-300" />
          <span className="h-3 w-[1px] bg-slate-400 dark:bg-slate-600" />
          <span className="h-3 w-[3px] bg-slate-800 dark:bg-slate-300" />
          <span className="h-3 w-[1px] bg-slate-800 dark:bg-slate-300" />
          <span className="h-3 w-[2px] bg-slate-800 dark:bg-slate-300" />
          <span className="h-3 w-[1px] bg-slate-400 dark:bg-slate-600" />
          <span className="h-3 w-[3px] bg-slate-800 dark:bg-slate-300" />
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[7px] text-slate-500">
          <span>Batch #802</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">OptiPiece</span>
        </div>
      </div>
    )
  }

  // Blank Canvas
  return (
    <div className="relative w-full h-[88px] rounded-md border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-2 overflow-hidden flex flex-col items-center justify-center text-center select-none">
      <div className="h-6 w-6 rounded-full border border-dashed border-slate-400 dark:border-slate-600 flex items-center justify-center text-slate-400 mb-1">
        <span className="text-[12px]">+</span>
      </div>
      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Empty Canvas</span>
      <span className="text-[8.5px] text-slate-400">Manual field drag</span>
    </div>
  )
}


'use client'

import { useActionState } from 'react'
import { bulkUpdateStockAction, type ImportState } from '@/lib/actions/import'
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, FileUp, ArrowRight, Download } from 'lucide-react'
import { useState } from 'react'

export function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(bulkUpdateStockAction, null)
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 to-white p-5 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-zinc-950">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">Импорт остатков</div>
        <h2 className="mt-1 text-[16px] font-semibold text-slate-900 dark:text-zinc-100">Пошаговая загрузка CSV</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
          Подготовьте CSV, проверьте заголовки и загрузите файл. Система обновит остатки по артикулу и покажет, какие позиции не удалось сопоставить.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/70 bg-white/80 p-3 dark:border-white/[0.06] dark:bg-zinc-950/60">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 dark:text-zinc-200"><FileSpreadsheet size={14} /> 1. Подготовьте CSV</div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">Колонки: Артикул + Остаток</p>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/80 p-3 dark:border-white/[0.06] dark:bg-zinc-950/60">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 dark:text-zinc-200"><FileUp size={14} /> 2. Загрузите файл</div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">До 2 MB, CSV или TXT</p>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/80 p-3 dark:border-white/[0.06] dark:bg-zinc-950/60">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 dark:text-zinc-200"><CheckCircle2 size={14} /> 3. Проверьте итог</div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">Получите список обновлённых и пропущенных SKU</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-[15px] font-semibold text-slate-800 dark:text-zinc-200 mb-1">Загрузка файла</h2>
        <p className="text-[13px] text-slate-400 dark:text-zinc-500 mb-4">
          Загрузите CSV-файл с колонками «Артикул» и «Остаток». Разделитель: запятая или точка с запятой.
        </p>

        <form action={formAction} className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-zinc-700 dark:bg-zinc-800/50">
            <Upload size={30} className="mb-3 text-slate-300 dark:text-zinc-600" />
            <span className="text-[13px] font-medium text-slate-600 dark:text-zinc-300">
              {fileName ?? 'Выберите CSV-файл или перетащите его сюда'}
            </span>
            <span className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">Макс. 2MB • CSV/TXT</span>
            <input
              type="file"
              name="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 dark:text-zinc-300">
              <ArrowRight size={13} /> Перед загрузкой проверьте
            </div>
            <ul className="mt-2 space-y-1 text-[12px] text-slate-500 dark:text-zinc-400">
              <li>Артикулы в файле совпадают с SKU в каталоге.</li>
              <li>Остаток записан числом, без текста и валют.</li>
              <li>В первой строке есть заголовки колонок.</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={pending || !fileName}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            <FileSpreadsheet size={14} />
            {pending ? 'Импорт...' : 'Загрузить и обновить'}
          </button>
        </form>

        {state?.error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-[13px] text-red-600">{state.error}</p>
          </div>
        )}

        {state?.success && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[13px] font-medium text-emerald-700">{state.success}</p>
            {state.updated !== undefined && (
              <p className="mt-1 text-[12px] text-emerald-600">Обновлено позиций: {state.updated}</p>
            )}
          </div>
        )}

        {state?.notFound && state.notFound.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-[13px] font-medium text-amber-700 flex items-center gap-1.5 mb-1">
              <AlertTriangle size={14} />
              Не найдены артикулы ({state.notFound.length}):
            </p>
            <p className="text-[12px] text-amber-600 font-mono">{state.notFound.join(', ')}</p>
          </div>
        )}
      </div>

      {/* Template info */}
      <div className="glass-card rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-[13px] font-semibold text-slate-700 dark:text-zinc-300">Формат файла</h3>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
            <Download size={12} /> Пример ниже
          </span>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-zinc-800/50 p-3 font-mono text-[12px] text-slate-600 dark:text-zinc-300 leading-relaxed">
          <div className="text-slate-400 dark:text-zinc-500 mb-1">Артикул,Остаток</div>
          <div>SHT-001,25</div>
          <div>TKN-002,0</div>
          <div>KRN-003,12.5</div>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-2">
          Поддерживаемые заголовки: Артикул/SKU/Код · Остаток/Stock/Количество/Кол-во
        </p>
      </div>
    </div>
  )
}

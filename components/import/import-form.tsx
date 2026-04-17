'use client'

import { useActionState } from 'react'
import { bulkUpdateStockAction, type ImportState } from '@/lib/actions/import'
import { Upload, FileSpreadsheet, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(bulkUpdateStockAction, null)
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <div className="space-y-5">
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-[15px] font-semibold text-slate-800 mb-1">Массовое обновление остатков</h2>
        <p className="text-[13px] text-slate-400 mb-4">
          Загрузите CSV-файл с колонками «Артикул» и «Остаток». Разделитель: запятая или точка с запятой.
        </p>

        <form action={formAction} className="space-y-4">
          <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
            <Upload size={28} className="text-slate-300 mb-2" />
            <span className="text-[13px] font-medium text-slate-500">
              {fileName ?? 'Выберите CSV-файл'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">Макс. 2MB</span>
            <input
              type="file"
              name="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </label>

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
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-[13px] font-semibold text-slate-700 mb-2">Формат файла</h3>
        <div className="rounded-lg bg-slate-50 p-3 font-mono text-[12px] text-slate-600 leading-relaxed">
          <div className="text-slate-400 mb-1">Артикул,Остаток</div>
          <div>SHT-001,25</div>
          <div>TKN-002,0</div>
          <div>KRN-003,12.5</div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Поддерживаемые заголовки: Артикул/SKU/Код · Остаток/Stock/Количество/Кол-во
        </p>
      </div>
    </div>
  )
}

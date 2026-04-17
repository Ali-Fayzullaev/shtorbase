'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Upload, Trash2, Check, Loader2, Image as ImageIcon, Building2 } from 'lucide-react'
import { uploadCompanyLogo, removeCompanyLogo, updateCompanyName, type CompanyBranding } from '@/lib/actions/branding'
import { toast } from '@/lib/utils/toast'

interface Props {
  initial: CompanyBranding
}

export function BrandingManager({ initial }: Props) {
  const [logoUrl, setLogoUrl] = useState(initial.logo_url)
  const [name, setName] = useState(initial.company_name ?? '')
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [namePending, startNameTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 2MB)')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    const fd = new FormData()
    fd.append('logo', file)
    startTransition(async () => {
      const res = await uploadCompanyLogo(fd)
      if (res.error) {
        toast.error(res.error)
        setPreview(null)
      } else {
        toast.success('Логотип обновлён')
        setPreview(null)
        // Refresh URL with cache buster
        setLogoUrl((_prev) => `${Date.now()}`)
        setTimeout(() => window.location.reload(), 300)
      }
      e.target.value = ''
    })
  }

  function handleRemove() {
    startTransition(async () => {
      const res = await removeCompanyLogo()
      if (res.error) {
        toast.error(res.error)
      } else {
        setLogoUrl(null)
        toast.success('Логотип удалён')
        setTimeout(() => window.location.reload(), 300)
      }
    })
  }

  function handleNameSave() {
    startNameTransition(async () => {
      const res = await updateCompanyName(name)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Название сохранено')
      }
    })
  }

  const showLogo = preview ?? (logoUrl && initial.logo_url)

  return (
    <div className="space-y-6">
      {/* Logo card */}
      <section className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-md shadow-indigo-500/20">
            <ImageIcon size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Логотип компании</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Отображается в боковом меню. PNG, JPG, WEBP или SVG до 2MB.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Preview */}
          <div className="relative h-28 w-28 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-800 dark:to-zinc-900 border border-slate-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center">
            {showLogo ? (
              <Image
                src={preview ?? initial.logo_url!}
                alt="Логотип"
                fill
                className="object-contain p-2"
                unoptimized
              />
            ) : (
              <Building2 size={32} className="text-slate-300 dark:text-zinc-600" />
            )}
            {pending && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={20} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex-1 space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={onFilePick}
              className="hidden"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 transition-colors"
              >
                <Upload size={14} />
                {initial.logo_url ? 'Заменить' : 'Загрузить'}
              </button>
              {initial.logo_url && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 px-3.5 py-2 text-[13px] font-medium text-slate-600 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:opacity-60 transition-colors"
                >
                  <Trash2 size={14} />
                  Удалить
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              Рекомендуется квадратное изображение на прозрачном фоне.
            </p>
          </div>
        </div>
      </section>

      {/* Company name */}
      <section className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20">
            <Building2 size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Название компании</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Показывается в боковом меню рядом с логотипом.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="ШторБаза"
            className="flex-1 h-10 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/60 px-3 text-sm text-slate-800 dark:text-zinc-200 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <button
            type="button"
            onClick={handleNameSave}
            disabled={namePending || name === (initial.company_name ?? '')}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-[13px] font-semibold text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {namePending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Сохранить
          </button>
        </div>
      </section>
    </div>
  )
}

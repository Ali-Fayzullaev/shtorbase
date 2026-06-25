'use cache'

import { cacheTag, cacheLife } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export interface CompanyBranding {
  logo_url: string | null
  logo_path: string | null
  company_name: string | null
}

export async function getCompanyBranding(): Promise<CompanyBranding> {
  cacheTag('branding')
  cacheLife('max')

  const admin = createAdminClient()
  const { data } = await admin
    .from('app_settings')
    .select('key, value')
    .in('key', ['company_logo', 'company_logo_path', 'company_name'])

  const map: Record<string, unknown> = {}
  for (const row of data ?? []) map[row.key] = row.value

  return {
    logo_url: typeof map.company_logo === 'string' ? map.company_logo : null,
    logo_path: typeof map.company_logo_path === 'string' ? map.company_logo_path : null,
    company_name: typeof map.company_name === 'string' ? map.company_name : null,
  }
}

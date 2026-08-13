'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

/**
 * true только после того как компонент смонтировался на клиенте (после
 * гидратации). Замена паттерна useState(false) + useEffect(() =>
 * setMounted(true), []) — тот же результат, но без setState внутри эффекта:
 * во время SSR и на первом клиентском рендере (гидратация) отдаёт false,
 * так что разметка совпадает с сервером, а сразу после — React сам
 * пересчитывает до true.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

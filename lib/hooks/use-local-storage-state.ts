'use client'

import { useCallback, useSyncExternalStore } from 'react'

type Listener = () => void
const listeners = new Map<string, Set<Listener>>()

function subscribe(key: string) {
  return (callback: Listener) => {
    let set = listeners.get(key)
    if (!set) {
      set = new Set()
      listeners.set(key, set)
    }
    set.add(callback)
    return () => set.delete(callback)
  }
}

function notify(key: string) {
  listeners.get(key)?.forEach((cb) => cb())
}

/**
 * Значение, синхронизированное с localStorage[key], без setState в эффекте.
 * На сервере и на первом клиентском рендере (до гидратации) отдаёт fallback,
 * чтобы разметка совпадала с сервером — сразу после React досчитывает до
 * реального значения. setValue() пишет в localStorage и сразу же уведомляет
 * все компоненты, подписанные на этот же ключ (мгновенный отклик в той же
 * вкладке, без ожидания следующего события).
 */
export function useLocalStorageState<T>(
  key: string,
  parse: (raw: string | null) => T,
  serialize: (value: T) => string,
  fallback: T
): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    subscribe(key),
    () => parse(localStorage.getItem(key)),
    () => fallback
  )

  const setValue = useCallback(
    (next: T) => {
      localStorage.setItem(key, serialize(next))
      notify(key)
    },
    [key, serialize]
  )

  return [value, setValue]
}

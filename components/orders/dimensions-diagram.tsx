'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils/format'

interface DimensionsDiagramProps {
  width?: string | null
  height?: string | null
  size?: 'sm' | 'md'
  className?: string
}

function parseNum(v?: string | null): number | null {
  if (!v) return null
  const m = v.replace(',', '.').match(/[\d.]+/)
  return m ? parseFloat(m[0]) : null
}

/**
 * Компактная схема «ширина × высота» для позиции заказа — вместо того чтобы
 * читать текст «Ширина: 250 см, Высота: 180 см», сотрудник на складе видит
 * узнаваемый силуэт шторы: карниз с кольцами, чередующиеся затенённые
 * складки полотна (как у собранной ткани) и утяжелитель по низу. Чистый
 * SVG — без 3D/картинок, рендерится мгновенно и не тормозит на планшете.
 */
export function DimensionsDiagram({ width, height, size = 'md', className }: DimensionsDiagramProps) {
  const uid = useId()
  if (!width && !height) return null

  const w = parseNum(width)
  const h = parseNum(height)

  const scale = size === 'sm' ? 0.72 : 1
  const boxW = 108 * scale
  const ratio = w && h ? Math.min(1.8, Math.max(0.4, h / w)) : 0.62
  const boxH = Math.min(150 * scale, Math.max(46 * scale, boxW * ratio))

  const rodGap = 15 * scale
  const padTop = rodGap + 7 * scale
  const padLeft = 10
  const padRight = height ? 44 * scale : 10
  const padBottom = width ? 26 * scale : 10
  const svgW = boxW + padLeft + padRight
  const svgH = boxH + padTop + padBottom
  const tickColor = 'text-zinc-300 dark:text-zinc-600'

  // Кольца карниза и складки полотна — равномерно по ширине
  const foldCount = Math.max(4, Math.min(7, Math.round(boxW / 16)))
  const boundaries = Array.from({ length: foldCount + 1 }, (_, i) => (boxW / foldCount) * i)
  const bulge = 4.4 * scale
  const dirAt = (i: number) => (i === 0 || i === foldCount ? 0 : i % 2 === 0 ? 1 : -1)

  function edgeDown(x: number, dir: number) {
    const c1x = x + dir * bulge
    const c1y = boxH * 0.32
    const c2x = x - dir * bulge
    const c2y = boxH * 0.68
    return `C ${c1x},${c1y} ${c2x},${c2y} ${x},${boxH}`
  }
  function edgeUp(x: number, dir: number) {
    const c1x = x + dir * bulge
    const c1y = boxH * 0.32
    const c2x = x - dir * bulge
    const c2y = boxH * 0.68
    return `C ${c2x},${c2y} ${c1x},${c1y} ${x},0`
  }

  const clipId = `dim-clip-${uid}`
  const gradId = `dim-grad-${uid}`

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      className={cn('shrink-0 overflow-visible', className)}
      role="img"
      aria-label={`Размеры шторы: ${width ?? '—'} × ${height ?? '—'}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.22" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect width={boxW} height={boxH} rx={5} />
        </clipPath>
      </defs>

      <g transform={`translate(${padLeft}, ${padTop})`}>
        {/* Карниз с кольцами */}
        <g className="text-zinc-400 dark:text-zinc-500">
          <line
            x1={-6}
            y1={-rodGap}
            x2={boxW + 6}
            y2={-rodGap}
            stroke="currentColor"
            strokeWidth={2 * scale}
            strokeLinecap="round"
          />
          <circle cx={-6} cy={-rodGap} r={2.6 * scale} fill="currentColor" />
          <circle cx={boxW + 6} cy={-rodGap} r={2.6 * scale} fill="currentColor" />
        </g>
        {boundaries.map((x, i) => (
          <g key={`ring-${i}`}>
            <circle cx={x} cy={-rodGap + 3.5 * scale} r={2 * scale} fill="none" stroke="#818cf8" strokeWidth="1.1" />
            <line x1={x} y1={-rodGap + 5.5 * scale} x2={x} y2={0} stroke="#818cf8" strokeOpacity="0.55" strokeWidth="1" />
          </g>
        ))}

        {/* Полотно: база + чередующиеся затенённые складки + блик + утяжелитель, всё внутри скруглённого клипа */}
        <g clipPath={`url(#${clipId})`}>
          <rect width={boxW} height={boxH} fill={`url(#${gradId})`} />
          {boundaries.slice(0, -1).map((xL, j) => {
            if (j % 2 !== 1) return null
            const xR = boundaries[j + 1]
            const d = `M${xL},0 ${edgeDown(xL, dirAt(j))} L${xR},${boxH} ${edgeUp(xR, dirAt(j + 1))} Z`
            return <path key={`shade-${j}`} d={d} fill="#312e81" fillOpacity="0.16" />
          })}
          <rect width={boxW} height={boxH * 0.22} fill="#ffffff" fillOpacity="0.1" />
          <rect y={boxH - 3.5 * scale} width={boxW} height={3.5 * scale} fill="#4338ca" fillOpacity="0.22" />
        </g>

        {/* Внешний контур + тонкие линии складок поверх, для чёткости на любом фоне */}
        <rect width={boxW} height={boxH} rx={5} fill="none" stroke="#818cf8" strokeWidth="1.4" />
        {boundaries.slice(1, -1).map((x, i) => (
          <path
            key={`fold-${i}`}
            d={`M${x},2 ${edgeDown(x, dirAt(i + 1)).replace(`,${boxH}`, `,${boxH - 2}`)}`}
            fill="none"
            stroke="#818cf8"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
        ))}

        {/* Ширина — размерная линия снизу */}
        {width && (
          <g className={tickColor}>
            <line x1={0} y1={boxH + 10} x2={boxW} y2={boxH + 10} stroke="currentColor" strokeWidth="1" />
            <line x1={0} y1={boxH + 6} x2={0} y2={boxH + 14} stroke="currentColor" strokeWidth="1" />
            <line x1={boxW} y1={boxH + 6} x2={boxW} y2={boxH + 14} stroke="currentColor" strokeWidth="1" />
            <text
              x={boxW / 2}
              y={boxH + 23 * scale}
              textAnchor="middle"
              fontSize={9.5 * scale + 1}
              fontWeight={600}
              className="fill-zinc-600 dark:fill-zinc-300"
            >
              {width}
            </text>
          </g>
        )}

        {/* Высота — размерная линия справа */}
        {height && (
          <g className={tickColor}>
            <line x1={boxW + 10} y1={0} x2={boxW + 10} y2={boxH} stroke="currentColor" strokeWidth="1" />
            <line x1={boxW + 6} y1={0} x2={boxW + 14} y2={0} stroke="currentColor" strokeWidth="1" />
            <line x1={boxW + 6} y1={boxH} x2={boxW + 14} y2={boxH} stroke="currentColor" strokeWidth="1" />
            <text
              x={boxW + 20 * scale}
              y={boxH / 2}
              textAnchor="middle"
              fontSize={9.5 * scale + 1}
              fontWeight={600}
              className="fill-zinc-600 dark:fill-zinc-300"
              transform={`rotate(90, ${boxW + 20 * scale}, ${boxH / 2})`}
            >
              {height}
            </text>
          </g>
        )}
      </g>
    </svg>
  )
}

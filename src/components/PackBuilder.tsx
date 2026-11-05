import { useEffect, useRef } from 'react'
import type { Wallpaper } from '../types/wallpaper'

interface Props {
  items: Wallpaper[]
  name: string
  busy: boolean
  onName: (name: string) => void
  onRemove: (id: string) => void
  onMove: (index: number, direction: number) => void
  onClose: () => void
  onDownload: () => void
}

export default function PackBuilder(props: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
    return () => ref.current?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="pack-heading"
      onCancel={event => {
        event.preventDefault()
        props.onClose()
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="pack-heading">Tu mesa de trabajo</h2>
        <button onClick={props.onClose} aria-label="Cerrar">✕</button>
      </div>
      <label className="block mt-6 mb-2" htmlFor="pack-name">
        Nombre del archivo
      </label>
      <input
        id="pack-name"
        value={props.name}
        onChange={event => props.onName(event.target.value)}
      />
      <div className="my-6">
        {!props.items.length && <p className="muted">Tu colección empieza con un fondo.</p>}
        {props.items.map((item, index) => (
          <div className="pack-row" key={item.id}>
            <img src={item.url} alt="" />
            <span className="truncate flex-1">{item.title}</span>
            <button
              disabled={index === 0 || props.busy}
              onClick={() => props.onMove(index, -1)}
              aria-label={`Subir ${item.title}`}
            >↑</button>
            <button
              disabled={index === props.items.length - 1 || props.busy}
              onClick={() => props.onMove(index, 1)}
              aria-label={`Bajar ${item.title}`}
            >↓</button>
            <button
              disabled={props.busy}
              onClick={() => props.onRemove(item.id)}
              aria-label={`Quitar ${item.title}`}
            >✕</button>
          </div>
        ))}
      </div>
      <button
        className="primary w-full"
        disabled={!props.items.length || props.busy}
        onClick={props.onDownload}
      >
        {props.busy ? 'Preparando…' : 'Descargar colección .ZIP'}
      </button>
    </dialog>
  )
}

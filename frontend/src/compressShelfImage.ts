/** Уменьшает фото перед отправкой. Сжатие в Web Worker, чтобы не блокировать UI. */

const TARGET_MAX_BYTES = 1_200_000
const MAX_SIDE_MAIN = 1680

let worker: Worker | undefined
let nextId = 0
const pending = new Map<
  number,
  { resolve: (f: File) => void; reject: (e: Error) => void }
>()

function getWorker(): Worker | undefined {
  if (typeof Worker === 'undefined') return undefined
  if (worker) return worker
  try {
    const w = new Worker(
      new URL('./shelfCompress.worker.ts', import.meta.url),
      { type: 'module' }
    )
    w.onmessage = (ev: MessageEvent) => {
      const data = ev.data as {
        id: number
        ok: boolean
        buffer?: ArrayBuffer
        error?: string
      }
      const p = pending.get(data.id)
      if (!p) return
      pending.delete(data.id)
      if (data.ok && data.buffer) {
        p.resolve(
          new File([data.buffer], 'shelf.jpg', { type: 'image/jpeg' })
        )
      } else {
        p.reject(new Error(data.error || 'worker'))
      }
    }
    w.onerror = () => {
      pending.forEach(({ reject }) =>
        reject(new Error('worker'))
      )
      pending.clear()
      worker = undefined
    }
    worker = w
    return w
  } catch {
    return undefined
  }
}

async function compressOnMainThread(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file
  }

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  try {
    const { width: iw, height: ih } = bitmap
    const maxDim = Math.max(iw, ih)
    const scale = maxDim > MAX_SIDE_MAIN ? MAX_SIDE_MAIN / maxDim : 1
    const w = Math.max(1, Math.round(iw * scale))
    const h = Math.max(1, Math.round(ih * scale))

    if (
      scale === 1 &&
      file.size < TARGET_MAX_BYTES &&
      file.type === 'image/jpeg'
    ) {
      bitmap.close()
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    bitmap = null

    let quality = 0.88
    let blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    })

    while (blob && blob.size > TARGET_MAX_BYTES && quality > 0.52) {
      quality -= 0.07
      blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
      })
    }

    if (!blob || blob.size === 0) {
      return file
    }

    return new File([blob], 'shelf.jpg', { type: 'image/jpeg' })
  } catch {
    bitmap?.close()
    return file
  }
}

export async function compressShelfImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file
  }

  const w = getWorker()
  if (w) {
    try {
      const id = ++nextId
      const buffer = await file.arrayBuffer()
      const out = await new Promise<File>((resolve, reject) => {
        const t = window.setTimeout(() => {
          pending.delete(id)
          reject(new Error('timeout'))
        }, 45_000)
        pending.set(id, {
          resolve: (f) => {
            window.clearTimeout(t)
            resolve(f)
          },
          reject: (e) => {
            window.clearTimeout(t)
            reject(e)
          },
        })
        w.postMessage({ id, buffer, mime: file.type }, [buffer])
      })
      return out
    } catch {
      return compressOnMainThread(file)
    }
  }

  return compressOnMainThread(file)
}

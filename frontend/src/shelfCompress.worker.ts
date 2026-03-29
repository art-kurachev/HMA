/// <reference lib="webworker" />

/** Чуть выше качество — лучше читается мелкий текст на этикетках */
const MAX_SIDE_PX = 1680
const TARGET_MAX_BYTES = 1_200_000

self.onmessage = async (ev: MessageEvent<{ id: number; buffer: ArrayBuffer; mime: string }>) => {
  const { id, buffer, mime } = ev.data
  try {
    const out = await compressBuffer(buffer, mime)
    self.postMessage({ id, ok: true, buffer: out }, [out])
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'compress failed'
    self.postMessage({ id, ok: false, error: msg })
  }
}

async function compressBuffer(buffer: ArrayBuffer, mime: string): Promise<ArrayBuffer> {
  if (!mime.startsWith('image/')) {
    return buffer
  }

  const blob = new Blob([buffer], { type: mime })
  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(blob)
  } catch {
    return buffer
  }

  try {
    const iw = bitmap.width
    const ih = bitmap.height
    const maxDim = Math.max(iw, ih)
    const scale = maxDim > MAX_SIDE_PX ? MAX_SIDE_PX / maxDim : 1
    const w = Math.max(1, Math.round(iw * scale))
    const h = Math.max(1, Math.round(ih * scale))

    if (scale === 1 && buffer.byteLength < TARGET_MAX_BYTES && mime === 'image/jpeg') {
      bitmap.close()
      return buffer
    }

    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return buffer
    }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    bitmap = null

    let quality = 0.88
    let outBlob: Blob | null = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality,
    })

    while (outBlob && outBlob.size > TARGET_MAX_BYTES && quality > 0.52) {
      quality -= 0.07
      outBlob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality,
      })
    }

    if (!outBlob || outBlob.size === 0) {
      return buffer
    }

    return await outBlob.arrayBuffer()
  } catch {
    bitmap?.close()
    return buffer
  }
}

#!/usr/bin/env node
/**
 * Экспорт изображений из Figma в frontend/public/
 * Использование: npm run figma:export
 */

import 'dotenv/config'
import { mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PUBLIC = join(ROOT, 'public')

const FIGMA_FILE_KEY = 'ObxjfzMRKkNsshVJROr2RZ'
const TOKEN = process.env.VITE_FIGMA_TOKEN

if (!TOKEN) {
  console.error('❌ VITE_FIGMA_TOKEN не задан в frontend/.env')
  process.exit(1)
}

const headers = { 'X-Figma-Token': TOKEN }

async function fetchFigma(path) {
  const res = await fetch(`https://api.figma.com/v1${path}`, { headers })
  if (!res.ok) throw new Error(`Figma API ${res.status}: ${await res.text()}`)
  return res.json()
}

async function main() {
  console.log('📂 Загрузка файла Figma...')
  await fetchFigma(`/files/${FIGMA_FILE_KEY}`)

  const targetNodeIds = [
    '7467:29989',
    '7467:30023',
    '7467:30076',
  ]

  const idsParam = targetNodeIds.join(',')
  console.log('🖼️  Запрос экспорта изображений...')
  const imagesRes = await fetchFigma(
    `/images/${FIGMA_FILE_KEY}?ids=${encodeURIComponent(idsParam)}&format=png&scale=2`
  )

  if (imagesRes.err) throw new Error(imagesRes.err)

  const images = imagesRes.images || {}
  if (Object.keys(images).length === 0) {
    console.log('⚠️  Нет изображений для экспорта')
    return
  }

  if (!existsSync(PUBLIC)) await mkdir(PUBLIC, { recursive: true })

  const nameMap = {
    '7467:29989': 'welcome-screen',
    '7467:30023': 'direction-screen',
    '7467:30076': 'setup-screen',
  }

  for (const [nodeId, url] of Object.entries(images)) {
    if (!url) continue
    const baseName = nameMap[nodeId] || `figma-${nodeId.replace(':', '-')}`
    const filename = `${baseName}.png`
    const filepath = join(PUBLIC, filename)

    console.log(`  ⬇️  ${filename}`)
    const imgRes = await fetch(url)
    const buf = Buffer.from(await imgRes.arrayBuffer())
    await writeFile(filepath, buf)
  }

  console.log(`\n✅ Экспортировано ${Object.keys(images).length} изображений в frontend/public/`)
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})

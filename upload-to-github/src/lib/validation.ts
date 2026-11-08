import type { ValidationIssue, WallConfig, WallZone } from '@/types/wall'

const wordCount = (value: string) => value.trim() ? value.trim().split(/\s+/).length : 0

export function zoneText(zone: WallZone, language: 'en' | 'zh') {
  return zone.text[language]?.trim() ?? ''
}

function estimateTextOverflow(zone: WallZone, value: string) {
  if (!value || zone.style === 'verticalTitle') return false
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return false
  const sizes = { title: 0.26, verticalTitle: 0.3, subtitle: 0.04, body: 0.032, section: 0.09, object: 0.07, caption: 0.026, meta: 0.018 }
  const fontSize = sizes[zone.style] * 900
  const serif = ['title', 'object', 'section'].includes(zone.style)
  context.font = `400 ${fontSize}px ${serif ? 'Georgia, serif' : 'Helvetica, sans-serif'}`
  const maxWidth = (zone.w - 0.024) * 900
  let lineCount = 0
  for (const paragraph of value.split('\n')) {
    let line = ''
    lineCount += 1
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word
      if (line && context.measureText(candidate).width > maxWidth) {
        lineCount += 1
        line = word
      } else line = candidate
    }
  }
  const lineHeight = fontSize * (zone.style === 'body' || zone.style === 'caption' ? 1.5 : 1.18)
  return lineCount > zone.lines || lineCount * lineHeight > (zone.h - 0.024) * 900
}

export function validateWall(config: WallConfig, language: 'en' | 'zh' = 'en'): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (config.wall.bays !== 8) issues.push({ level: 'error', message: 'The continuous wall must contain exactly 8 bays.' })
  if (config.wall.length !== 18) issues.push({ level: 'error', message: 'Wall length must remain 18.0 m.' })

  const ids = new Set<string>()
  for (const zone of config.zones) {
    if (ids.has(zone.id)) issues.push({ level: 'error', zoneId: zone.id, message: 'Duplicate field ID.' })
    ids.add(zone.id)
    if (zone.x < 0 || zone.y < 0 || zone.x + zone.w > config.wall.length || zone.y + zone.h > config.wall.height) {
      issues.push({ level: 'error', zoneId: zone.id, message: 'Text box extends beyond the wall.' })
    }
    if (zone.bay >= 1 && zone.bay <= 6 && zone.y < 1.4 && zone.y + zone.h > 0.9) {
      issues.push({ level: 'error', zoneId: zone.id, message: 'Text box overlaps the display case.' })
    }
    const value = zoneText(zone, language)
    if (zone.words && wordCount(value) > zone.words) {
      issues.push({ level: 'warning', zoneId: zone.id, message: `Exceeds ${zone.words}-word limit.` })
    }
    if (zone.chars && [...value.replace(/\s/g, '')].length > zone.chars) {
      issues.push({ level: 'warning', zoneId: zone.id, message: `Exceeds ${zone.chars}-character limit.` })
    }
    if (estimateTextOverflow(zone, value)) {
      issues.push({ level: 'warning', zoneId: zone.id, message: `Text likely exceeds ${zone.lines} lines or the field height.` })
    }
  }

  for (let i = 0; i < config.zones.length; i += 1) {
    for (let j = i + 1; j < config.zones.length; j += 1) {
      const a = config.zones[i]
      const b = config.zones[j]
      if (a.bay !== b.bay) continue
      const overlaps = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
      if (overlaps) issues.push({ level: 'error', zoneId: b.id, message: `Overlaps ${a.id}.` })
    }
  }
  return issues
}

export function downloadJson(config: WallConfig) {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'wall.json'
  link.click()
  URL.revokeObjectURL(url)
}

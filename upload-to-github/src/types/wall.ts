export type Language = 'en' | 'zh'
export type Quality = 'high' | 'low'
export type ViewMode = 'tour' | 'walk'

export interface LocalizedText {
  en: string
  zh: string
}

export interface WallZone {
  id: string
  bay: number
  label: string
  x: number
  y: number
  w: number
  h: number
  words?: number
  chars?: number
  lines: number
  align: 'left' | 'center' | 'right'
  style: 'title' | 'verticalTitle' | 'subtitle' | 'body' | 'section' | 'object' | 'caption' | 'meta'
  text: LocalizedText
}

export interface WallObject {
  id: string
  bay: number
  proxy: { w: number; h: number; d: number }
}

export interface TourFrame {
  t: number
  position: [number, number, number]
  lookAt: [number, number, number]
}

export interface WallConfig {
  version: string
  wall: {
    length: number
    height: number
    bays: number
    caseStart: number
    caseEnd: number
  }
  zones: WallZone[]
  objects: WallObject[]
  tour: TourFrame[]
}

export interface ValidationIssue {
  level: 'error' | 'warning'
  zoneId?: string
  message: string
}

export interface SceneSnapshot {
  time: number
  playing: boolean
  mode: ViewMode
  bay: number
  fps: number
}

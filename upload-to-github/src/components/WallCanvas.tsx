import { useEffect, useRef } from 'react'
import { WallScene } from '@/scene/WallScene'
import type { Language, Quality, SceneSnapshot, ViewMode, WallConfig } from '@/types/wall'

interface Props {
  config: WallConfig
  language: Language
  showLabels: boolean
  quality: Quality
  reducedMotion: boolean
  onReady: (scene: WallScene | null) => void
  onSnapshot: (snapshot: SceneSnapshot) => void
  onSelect: (zoneId: string) => void
  onModeChange: (mode: ViewMode) => void
  onError: (message: string) => void
}

export function WallCanvas(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const latest = useRef(props)

  useEffect(() => { latest.current = props }, [props])

  useEffect(() => {
    if (!host.current) return
    const scene = new WallScene(host.current, latest.current.config, {
      onSnapshot: snapshot => latest.current.onSnapshot(snapshot),
      onSelect: id => latest.current.onSelect(id),
      onModeChange: mode => latest.current.onModeChange(mode),
      onError: message => latest.current.onError(message),
    })
    latest.current.onReady(scene)
    return () => {
      latest.current.onReady(null)
      scene.dispose()
    }
  }, [])

  return <div ref={host} className="scene-host" />
}

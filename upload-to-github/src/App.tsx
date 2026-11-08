import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Download, Eye, EyeOff, FileText, Gauge, HelpCircle, Keyboard, Languages, PanelRight, Tags, X } from 'lucide-react'
import { WallCanvas } from '@/components/WallCanvas'
import { EditorPanel } from '@/components/EditorPanel'
import { TourControls } from '@/components/TourControls'
import { WallNavigation } from '@/components/WallNavigation'
import { DocsPanel } from '@/components/DocsPanel'
import { WallScene } from '@/scene/WallScene'
import { downloadJson, validateWall } from '@/lib/validation'
import defaultWallJson from '@/data/wall.json'
import type { Language, Quality, SceneSnapshot, ViewMode, WallConfig } from '@/types/wall'

const defaultWall = defaultWallJson as WallConfig
const initialSnapshot: SceneSnapshot = { time: 0, playing: false, mode: 'tour', bay: 0, fps: 60 }

export default function App() {
  const [config, setConfig] = useState<WallConfig>(() => structuredClone(defaultWall))
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [scene, setScene] = useState<WallScene | null>(null)
  const [language, setLanguage] = useState<Language>('en')
  const [showLabels, setShowLabels] = useState(true)
  const [quality, setQuality] = useState<Quality>('high')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [mode, setMode] = useState<ViewMode>('tour')
  const [editorOpen, setEditorOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [uiHidden, setUiHidden] = useState(() => new URLSearchParams(window.location.search).get('tour') === '1')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [modelNames, setModelNames] = useState<Record<number, string>>({})
  const sceneRef = useRef<WallScene | null>(null)
  const issues = validateWall(config, language)

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const applyConfig = useCallback((next: WallConfig) => {
    setConfig(next)
    sceneRef.current?.updateConfig(next)
  }, [])

  useEffect(() => {
    if (window.location.protocol === 'file:') return
    fetch('./wall.json')
      .then(response => response.ok ? response.json() : Promise.reject(new Error('wall.json not found')))
      .then(data => {
        const candidate = data as WallConfig
        if (Array.isArray(candidate.zones) && candidate.wall?.bays === 8) applyConfig(candidate)
      })
      .catch(() => undefined)
  }, [applyConfig])

  useEffect(() => { scene?.setLanguage(language) }, [scene, language])
  useEffect(() => { scene?.setShowLabels(showLabels) }, [scene, showLabels])
  useEffect(() => { scene?.setQuality(quality) }, [scene, quality])
  useEffect(() => { scene?.setReducedMotion(reducedMotion) }, [scene, reducedMotion])
  useEffect(() => { scene?.setSpeed(speed) }, [scene, speed])

  const reset = useCallback(() => {
    sceneRef.current?.setTime(0)
    sceneRef.current?.setPlaying(false)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.matches('input, textarea, select, [contenteditable="true"]')) return
      if (event.code === 'Space') {
        event.preventDefault()
        sceneRef.current?.setPlaying(!snapshot.playing)
      } else if (event.code === 'KeyR') reset()
      else if (event.code === 'KeyP') setShowLabels(value => !value)
      else if (event.code === 'KeyL') setLanguage(value => value === 'en' ? 'zh' : 'en')
      else if (event.code === 'KeyF') {
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen?.()
      } else if (event.code === 'Escape') {
        setDocsOpen(false)
        setHelpOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reset, snapshot.playing])

  const importConfig = async (file: File) => {
    try {
      const candidate = JSON.parse(await file.text()) as WallConfig
      if (!candidate.wall || !Array.isArray(candidate.zones) || !Array.isArray(candidate.objects)) throw new Error('This is not a valid wall configuration.')
      const errors = validateWall(candidate).filter(issue => issue.level === 'error')
      if (errors.length) throw new Error(errors[0].message)
      applyConfig(candidate)
      notify('wall.json imported successfully.')
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not import JSON.', 'error') }
  }

  const importModel = async (bay: number, file: File) => {
    try {
      if (!sceneRef.current) throw new Error('The 3D scene is still initializing. Please try again.')
      await sceneRef.current.importGlb(bay, file)
      setModelNames(names => ({ ...names, [bay]: file.name }))
      notify(`${file.name} placed in B${bay}.`)
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not read GLB.', 'error') }
  }

  const selectZone = (id: string) => {
    setSelectedZoneId(id)
    sceneRef.current?.selectZone(id)
    if (!uiHidden) setEditorOpen(true)
  }

  return (
    <main className={`app-shell ${uiHidden ? 'presentation-mode' : ''}`}>
      <WallCanvas
        config={config}
        language={language}
        showLabels={showLabels}
        quality={quality}
        reducedMotion={reducedMotion}
        onReady={instance => { sceneRef.current = instance; setScene(instance) }}
        onSnapshot={setSnapshot}
        onSelect={selectZone}
        onModeChange={setMode}
        onError={message => notify(message, 'error')}
      />
      <div className="vignette" />
      <div className="grain" />

      {!uiHidden && <>
        <header className="top-bar">
          <div className="brand-block">
            <span className="brand-mark"><i /><i /><i /></span>
            <div><span className="eyebrow">HIST2012 · MINI CURATION</span><h1>Continuous Entrance Wall</h1></div>
          </div>
          <div className="project-facts"><span>18.0 M</span><i /><span>8 BAYS</span><i /><span>90 SEC</span></div>
          <div className="top-actions">
            <button className="text-button" onClick={() => setDocsOpen(true)}><FileText size={15} /><span>Drawings</span></button>
            <button className={`text-button ${showLabels ? 'active' : ''}`} onClick={() => setShowLabels(value => !value)} title="Toggle field labels · P"><Tags size={15} /><span>Labels</span></button>
            <button className="text-button" onClick={() => setLanguage(value => value === 'en' ? 'zh' : 'en')} title="Switch language · L"><Languages size={15} /><span>{language === 'en' ? 'EN' : '中文'}</span></button>
            <button className={`text-button ${quality === 'low' ? 'active' : ''}`} onClick={() => setQuality(value => value === 'high' ? 'low' : 'high')} title="Toggle render quality"><Gauge size={15} /><span>{quality === 'high' ? 'High' : 'Eco'}</span></button>
            <button className="icon-button" onClick={() => setHelpOpen(true)} title="Controls and accessibility"><HelpCircle size={17} /></button>
            <button className="icon-button" onClick={() => setUiHidden(true)} title="Presentation mode"><EyeOff size={17} /></button>
            <button className="edit-button" onClick={() => setEditorOpen(true)}><PanelRight size={15} />Edit wall</button>
          </div>
        </header>

        <div className="scene-caption">
          <span className="caption-index">B{snapshot.bay}</span>
          <div><b>{snapshot.bay === 0 ? 'TITLE BAY' : snapshot.bay === 7 ? 'CLOSING BAY' : `OBJECT BAY ${String(snapshot.bay).padStart(2, '0')}`}</b><span>{mode === 'tour' ? 'GUIDED TOUR' : 'FREE EXPLORATION'} · {language.toUpperCase()}</span></div>
        </div>

        <div className="bottom-interface">
          <WallNavigation activeBay={snapshot.bay} onJump={bay => sceneRef.current?.jumpToBay(bay)} />
          <TourControls
            snapshot={snapshot}
            mode={mode}
            speed={speed}
            onPlay={() => sceneRef.current?.setPlaying(!snapshot.playing)}
            onSeek={time => sceneRef.current?.setTime(time)}
            onSpeed={setSpeed}
            onReset={reset}
            onMode={next => sceneRef.current?.setMode(next)}
            onCapture={() => { sceneRef.current?.capture(); notify('Current view saved as PNG.') }}
          />
          <div className="status-line"><span><i className={snapshot.fps >= 45 ? 'good' : ''} />{snapshot.fps} FPS</span><span>WASD · MOUSE · SPACE · R · P · L · F</span></div>
        </div>
      </>}

      {uiHidden && <button className="restore-ui" onClick={() => setUiHidden(false)} title="Show interface"><Eye size={17} /></button>}
      {mode === 'walk' && !uiHidden && <div className="walk-hint"><Keyboard size={15} /><span>Click scene for mouse look · WASD to move · Esc releases cursor</span></div>}

      {editorOpen && !uiHidden && <EditorPanel
        config={config}
        selectedZoneId={selectedZoneId}
        language={language}
        issues={issues}
        modelNames={modelNames}
        onChange={applyConfig}
        onSelect={id => { setSelectedZoneId(id); sceneRef.current?.selectZone(id) }}
        onClose={() => setEditorOpen(false)}
        onImport={importConfig}
        onExport={() => { downloadJson(config); notify('wall.json exported.') }}
        onModel={importModel}
        onResetModel={bay => {
          sceneRef.current?.resetModel(bay)
          setModelNames(names => { const next = { ...names }; delete next[bay]; return next })
          notify(`B${bay} proxy restored.`)
        }}
      />}
      {docsOpen && <DocsPanel onClose={() => setDocsOpen(false)} />}
      {helpOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setHelpOpen(false) }}>
        <section className="help-modal">
          <div className="editor-header"><div><span className="eyebrow">VISITOR CONTROLS</span><h2>Explore the wall</h2></div><button className="icon-button" onClick={() => setHelpOpen(false)}><X size={18} /></button></div>
          <div className="shortcut-grid">
            {[['Space', 'Pause / continue tour'], ['W A S D', 'Enter free walk and move'], ['Mouse', 'Look around in free walk'], ['R', 'Return to B0'], ['P', 'Show / hide field labels'], ['L', 'Switch English / Chinese'], ['F', 'Toggle fullscreen'], ['Esc', 'Release cursor / close panel']].map(([key, label]) => <div key={key}><kbd>{key}</kbd><span>{label}</span></div>)}
          </div>
          <label className="setting-row"><div><b>Reduce camera motion</b><span>Stop at B7 instead of looping the tour.</span></div><input type="checkbox" checked={reducedMotion} onChange={event => setReducedMotion(event.target.checked)} /></label>
          <div className="help-note"><b>Offline & private</b><p>The production HTML contains all code and default data. JSON and GLB imports stay on this device. No external images, fonts, analytics, or CDN are used.</p></div>
          <button className="download-note" onClick={() => { downloadJson(config); notify('Current configuration exported.') }}><Download size={15} />Download current wall.json</button>
        </section>
      </div>}
      {toast && <div className={`toast ${toast.type}`} role="status">{toast.type === 'success' ? <Check size={16} /> : <X size={16} />}<span>{toast.message}</span></div>}
    </main>
  )
}

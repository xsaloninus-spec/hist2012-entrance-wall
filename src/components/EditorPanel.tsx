import { useRef, useState } from 'react'
import { Box, Check, ChevronDown, Download, FileJson, RotateCcw, Upload, X } from 'lucide-react'
import type { Language, ValidationIssue, WallConfig } from '@/types/wall'

interface Props {
  config: WallConfig
  selectedZoneId: string
  language: Language
  issues: ValidationIssue[]
  modelNames: Record<number, string>
  onChange: (config: WallConfig) => void
  onSelect: (id: string) => void
  onClose: () => void
  onImport: (file: File) => void
  onExport: () => void
  onModel: (bay: number, file: File) => void
  onResetModel: (bay: number) => void
}

export function EditorPanel({ config, selectedZoneId, language, issues, modelNames, onChange, onSelect, onClose, onImport, onExport, onModel, onResetModel }: Props) {
  const [tab, setTab] = useState<'content' | 'objects'>('content')
  const [bay, setBay] = useState(0)
  const [editLanguage, setEditLanguage] = useState<Language>(language)
  const jsonInput = useRef<HTMLInputElement>(null)
  const zones = config.zones.filter(zone => zone.bay === bay)
  const errors = issues.filter(issue => issue.level === 'error').length

  const updateText = (id: string, value: string) => {
    onChange({ ...config, zones: config.zones.map(zone => zone.id === id ? { ...zone, text: { ...zone.text, [editLanguage]: value } } : zone) })
  }

  return (
    <aside className="editor-panel">
      <div className="editor-header">
        <div><span className="eyebrow">CURATION WORKSPACE</span><h2>Wall content</h2></div>
        <button className="icon-button" onClick={onClose} title="Close editor"><X size={18} /></button>
      </div>
      <div className="editor-tabs">
        <button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>Text fields</button>
        <button className={tab === 'objects' ? 'active' : ''} onClick={() => setTab('objects')}>Objects · GLB</button>
      </div>
      {tab === 'content' ? (
        <>
          <div className="editor-toolbar">
            <label className="select-wrap"><span>Bay</span><select value={bay} onChange={event => setBay(Number(event.target.value))}>{Array.from({ length: 8 }, (_, index) => <option key={index} value={index}>B{index} · {index === 0 ? 'Title' : index === 7 ? 'Closing' : `Object ${index}`}</option>)}</select><ChevronDown size={14} /></label>
            <div className="language-toggle"><button className={editLanguage === 'en' ? 'active' : ''} onClick={() => setEditLanguage('en')}>EN</button><button className={editLanguage === 'zh' ? 'active' : ''} onClick={() => setEditLanguage('zh')}>中文</button></div>
          </div>
          <div className="editor-scroll">
            {selectedZoneId && <p className="selection-note">Selected on wall: <button onClick={() => { const zone = config.zones.find(item => item.id === selectedZoneId); if (zone) setBay(zone.bay) }}>{selectedZoneId}</button></p>}
            {zones.map(zone => {
              const value = zone.text[editLanguage]
              const zoneIssues = issues.filter(issue => issue.zoneId === zone.id)
              return (
                <label className={`field-editor ${selectedZoneId === zone.id ? 'selected' : ''}`} key={zone.id} onFocus={() => onSelect(zone.id)}>
                  <span className="field-label"><b>{zone.id}</b><small>{zone.words ? `≤ ${zone.words} words` : zone.chars ? `≤ ${zone.chars} chars` : `${zone.lines} lines`}</small></span>
                  <textarea
                    value={value}
                    rows={zone.style === 'body' ? 5 : zone.style === 'caption' ? 4 : 2}
                    maxLength={zone.style === 'body' ? 1100 : 500}
                    onChange={event => updateText(zone.id, event.target.value)}
                    placeholder="Empty — placeholder shown on wall"
                  />
                  {zoneIssues.length > 0 && <span className="field-warning">{zoneIssues[0].message}</span>}
                </label>
              )
            })}
          </div>
        </>
      ) : (
        <div className="editor-scroll object-list">
          <p className="panel-intro">Replace a plaster proxy with a local binary GLB. Models are centered and fitted to a 0.25 m maximum dimension.</p>
          {config.objects.map(object => (
            <div className="object-row" key={object.id}>
              <div className="object-icon"><Box size={19} /></div>
              <div><b>Object {String(object.bay).padStart(2, '0')}</b><span>{modelNames[object.bay] ? `Loaded · ${modelNames[object.bay]}` : `Bay B${object.bay} · max 0.25 m`}</span></div>
              <label className="small-button" title="Import GLB"><Upload size={14} />GLB<input type="file" accept=".glb,model/gltf-binary" onChange={event => { const file = event.target.files?.[0]; if (file) onModel(object.bay, file); event.target.value = '' }} /></label>
              <button className="icon-button" onClick={() => onResetModel(object.bay)} title="Restore proxy"><RotateCcw size={14} /></button>
            </div>
          ))}
          <p className="privacy-note">Models remain in this browser session and are not uploaded. Exporting JSON stores layout and text, not model binaries.</p>
        </div>
      )}
      <div className="editor-footer">
        <div className={`validation-status ${errors ? 'invalid' : ''}`}>{errors ? <span>{errors} layout errors</span> : <><Check size={13} /><span>Layout valid</span></>}</div>
        <div className="file-actions">
          <input ref={jsonInput} type="file" accept=".json,application/json" hidden onChange={event => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = '' }} />
          <button onClick={() => jsonInput.current?.click()}><FileJson size={14} />Import</button>
          <button onClick={onExport}><Download size={14} />Export JSON</button>
        </div>
      </div>
    </aside>
  )
}

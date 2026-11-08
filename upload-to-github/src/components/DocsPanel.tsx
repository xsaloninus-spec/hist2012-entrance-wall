import { useState } from 'react'
import { X } from 'lucide-react'

const storyboard = [
  ['0–8 s', 'B0 · x 0.8 m', 'Title wash +10%', 'Title / thesis / rule', 'Room tone'],
  ['8–13.7 s', 'B0 → B1', 'Continuous wall slot', 'Line remains continuous', 'Quiet movement'],
  ['13.7–19.7 s', 'B1 · dwell 6 s', '2700 K object spot', 'Section 01 / caption 01', 'Room tone'],
  ['19.7–31.4 s', 'B2 · dwell 6 s', 'Case light only', 'Section 02 / caption 02', 'Room tone'],
  ['31.4–43.1 s', 'B3 · dwell 6 s', 'Case light only', 'Section 03 / caption 03', 'Room tone'],
  ['43.1–54.9 s', 'B4 · dwell 6 s', 'Case light only', 'Section 04 / caption 04', 'Room tone'],
  ['54.9–66.6 s', 'B5 · dwell 6 s', 'Case light only', 'Section 05 / caption 05', 'Room tone'],
  ['66.6–78.3 s', 'B6 · dwell 6 s', 'Case light only', 'Section 06 / caption 06', 'Room tone'],
  ['78.3–90 s', 'B7 · settle 6 s', 'Gradual fade to black', 'Closing / vertical slot', 'Fade to silence'],
]

function PlanDrawing() {
  return <svg viewBox="0 0 1200 370" className="drawing" role="img" aria-label="Plan drawing of 18 meter continuous wall">
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="currentColor" /></marker></defs>
    <rect x="70" y="58" width="1060" height="18" className="draw-wall" />
    {[70, 322, 462, 602, 742, 882, 1022, 1130].map((x, i) => <text key={x} x={x + 8} y="50" className="draw-text">B{i}</text>)}
    <rect x="322" y="92" width="700" height="30" className="draw-case" /><text x="635" y="113" className="draw-text">CONTINUOUS CASE · 12.0 M × 0.55 M</text>
    <path d="M90 222 H1100" className="draw-path" markerEnd="url(#arrow)" /><text x="560" y="210" className="draw-accent">VISITOR MOVEMENT · PARALLEL TO WALL</text>
    <path d="M70 76 V305 M1130 76 V305" className="draw-dimension" /><path d="M322 122 V305 M1022 122 V305" className="draw-dimension faint" />
    <path d="M70 300 H1130" className="draw-dimension" markerStart="url(#arrow)" markerEnd="url(#arrow)" /><text x="600" y="290" className="draw-text">18.0 M</text>
    <path d="M70 145 H1130 M70 280 H1130" className="draw-dimension faint" /><text x="600" y="268" className="draw-text">3.2 M CLEAR VISITOR ZONE</text>
    <text x="70" y="345" className="draw-note">WALL FACE z=0  /  CASE z=0–0.55  /  WALK z=0.83–3.05  /  NO DOOR OR TRANSVERSE ROUTE</text>
  </svg>
}

function ElevationDrawing() {
  return <svg viewBox="0 0 1200 500" className="drawing" role="img" aria-label="Elevation drawing of eight continuous wall bays">
    <rect x="55" y="45" width="1090" height="360" className="draw-wall" />
    <path d="M55 62 H1145" className="draw-light" /><text x="58" y="35" className="draw-text">3.40 M · CONTINUOUS WALL</text>
    {[300, 440, 580, 720, 860, 1000].map(x => <path key={x} d={`M${x} 45 V405`} className="draw-pilaster" />)}
    <rect x="300" y="282" width="700" height="123" className="draw-case" /><path d="M300 282 H1000" className="draw-light" />
    <path d="M55 273 H1145" className="draw-accent-line" /><circle cx="58" cy="273" r="5" className="draw-seal" /><path d="M1140 245 V405" className="draw-slot" />
    <path d="M55 253 H1145" className="draw-brass" />
    {Array.from({ length: 6 }, (_, i) => <g key={i}><rect x={320 + i * 140} y="115" width="100" height="18" className="draw-box" /><rect x={320 + i * 140} y="145" width="100" height="65" className="draw-box" /><text x={325 + i * 140} y="100" className="draw-text">B{i + 1}</text></g>)}
    <rect x="80" y="100" width="180" height="90" className="draw-box" /><rect x="80" y="290" width="180" height="65" className="draw-box" /><text x="80" y="85" className="draw-text">B0 · TITLE</text>
    <rect x="1020" y="110" width="90" height="95" className="draw-box" /><text x="1020" y="95" className="draw-text">B7</text>
    <text x="55" y="450" className="draw-note">SLOT 3.25  /  GRAPHIC BAND ≤2.60  /  RAIL 1.52  /  CASE 1.40  /  LINE 1.35  /  PLINTH 0.90  /  SHADOW GAP 0.08</text>
    <text x="55" y="475" className="draw-note">ALL RECTANGLES ARE EMPTY CONTENT FIELDS · NOT FINAL GRAPHIC DESIGN</text>
  </svg>
}

export function DocsPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'plan' | 'elevation' | 'storyboard'>('plan')
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="docs-modal">
      <div className="editor-header"><div><span className="eyebrow">SPATIAL DOCUMENTATION</span><h2>Continuous wall · 18 m</h2></div><button className="icon-button" onClick={onClose}><X size={19} /></button></div>
      <div className="editor-tabs docs-tabs"><button className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>01 · Plan</button><button className={tab === 'elevation' ? 'active' : ''} onClick={() => setTab('elevation')}>02 · Elevation</button><button className={tab === 'storyboard' ? 'active' : ''} onClick={() => setTab('storyboard')}>03 · 90-second storyboard</button></div>
      <div className="docs-content">
        {tab === 'plan' && <><PlanDrawing /><div className="drawing-legend"><span><i className="legend-wall" />Continuous wall</span><span><i className="legend-case" />Glazed case</span><span><i className="legend-path" />Visitor route</span></div></>}
        {tab === 'elevation' && <ElevationDrawing />}
        {tab === 'storyboard' && <div className="storyboard-wrap"><table><thead><tr><th>Time</th><th>Camera</th><th>Light</th><th>Text zones</th><th>Sound</th></tr></thead><tbody>{storyboard.map(row => <tr key={row[0]}>{row.map(cell => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table><p className="privacy-note">Total runtime: 90 s. B0 dwell: 8 s. B1–B7 dwell: 6 s each. Travel segments are distributed across the remaining 40 s; no camera enters the case or crosses the wall.</p></div>}
      </div>
    </section>
  </div>
}

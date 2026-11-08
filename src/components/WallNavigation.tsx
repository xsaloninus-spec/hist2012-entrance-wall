interface Props {
  activeBay: number
  onJump: (bay: number) => void
}

const names = ['TITLE', '01', '02', '03', '04', '05', '06', 'END']

export function WallNavigation({ activeBay, onJump }: Props) {
  return (
    <nav className="wall-navigation glass-panel" aria-label="Wall bays">
      <span className="nav-caption">CONTINUOUS WALL · 18 M</span>
      <div className="bay-track">
        <div className="bay-line" />
        {names.map((name, index) => (
          <button key={name} className={`bay-stop ${index === 0 ? 'wide' : ''} ${activeBay === index ? 'active' : ''}`} onClick={() => onJump(index)} title={`Jump to B${index}`}>
            <span className="bay-dot" />
            <span className="bay-name">B{index}</span>
            <span className="bay-sub">{name}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

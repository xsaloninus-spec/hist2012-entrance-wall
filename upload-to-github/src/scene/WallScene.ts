import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import type { Language, Quality, SceneSnapshot, ViewMode, WallConfig, WallObject, WallZone } from '@/types/wall'

interface SceneCallbacks {
  onSnapshot: (snapshot: SceneSnapshot) => void
  onSelect: (zoneId: string) => void
  onModeChange: (mode: ViewMode) => void
  onError: (message: string) => void
}

interface TourSegment {
  start: number
  end: number
  from: number
  to: number
  dwell: boolean
}

const STATION_X = [0.8, 5.2, 7.2, 9.2, 11.2, 13.2, 15.2, 17.2]
const STATION_LOOK: [number, number, number][] = [
  [2, 1.9, 0], [5.2, 1.4, 0], [7.2, 1.4, 0], [9.2, 1.4, 0],
  [11.2, 1.4, 0], [13.2, 1.4, 0], [15.2, 1.4, 0], [17.6, 1.3, 0],
]

function makeTourSegments(): TourSegment[] {
  const segments: TourSegment[] = []
  const transition = 40 / 7
  let cursor = 0
  for (let i = 0; i < 8; i += 1) {
    const dwell = i === 0 ? 8 : 6
    segments.push({ start: cursor, end: cursor + dwell, from: i, to: i, dwell: true })
    cursor += dwell
    if (i < 7) {
      segments.push({ start: cursor, end: cursor + transition, from: i, to: i + 1, dwell: false })
      cursor += transition
    }
  }
  return segments
}

const TOUR_SEGMENTS = makeTourSegments()
const clamp = THREE.MathUtils.clamp
const ease = (value: number) => value * value * (3 - 2 * value)

function canvasTexture(kind: 'wall' | 'floor') {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 768
  const context = canvas.getContext('2d')!
  let seed = kind === 'wall' ? 173 : 911
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  context.fillStyle = kind === 'wall' ? '#3f443a' : '#6e6c62'
  context.fillRect(0, 0, 768, 768)
  for (let i = 0; i < 26000; i += 1) {
    const shade = Math.floor(random() * 42)
    const alpha = kind === 'wall' ? 0.035 : 0.025
    context.fillStyle = random() > 0.5 ? `rgba(240,235,216,${alpha})` : `rgba(${shade},${shade},${shade},${alpha})`
    const size = random() * (kind === 'wall' ? 2.2 : 1.4)
    context.fillRect(random() * 768, random() * 768, size, size)
  }
  if (kind === 'wall') {
    for (let i = 0; i < 45; i += 1) {
      const gradient = context.createRadialGradient(random() * 768, random() * 768, 0, random() * 768, random() * 768, 150 + random() * 170)
      gradient.addColorStop(0, `rgba(16,20,15,${0.015 + random() * 0.025})`)
      gradient.addColorStop(1, 'rgba(16,20,15,0)')
      context.fillStyle = gradient
      context.fillRect(0, 0, 768, 768)
    }
  } else {
    context.lineWidth = 0.7
    for (let i = 0; i < 24; i += 1) {
      context.beginPath()
      context.strokeStyle = `rgba(30,34,29,${0.035 + random() * 0.04})`
      let y = random() * 768
      context.moveTo(-20, y)
      for (let x = 0; x < 820; x += 45) {
        y += (random() - 0.5) * 24
        context.lineTo(x, y)
      }
      context.stroke()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(kind === 'wall' ? 6 : 5, kind === 'wall' ? 1.2 : 2)
  texture.anisotropy = 8
  return texture
}

function textLines(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const output: string[] = []
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/)
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (context.measureText(candidate).width > maxWidth && line) {
        output.push(line)
        line = word
      } else line = candidate
    }
    output.push(line)
  }
  return output
}

function makeZoneTexture(zone: WallZone, language: Language, showLabels: boolean, selected: boolean) {
  const width = Math.min(2048, Math.max(384, Math.round(zone.w * 900)))
  const height = Math.max(64, Math.round(width * zone.h / zone.w))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  const px = (meters: number) => meters / zone.w * width
  const text = zone.text[language]?.trim() ?? ''
  context.clearRect(0, 0, width, height)

  if (!text) {
    context.strokeStyle = selected ? 'rgba(183,145,85,0.9)' : 'rgba(242,235,221,0.22)'
    context.lineWidth = Math.max(1, px(0.002))
    context.strokeRect(1, 1, width - 2, height - 2)
    const tick = Math.min(20, height * 0.16, width * 0.04)
    context.strokeStyle = selected ? '#b79155' : 'rgba(242,235,221,0.55)'
    context.lineWidth = Math.max(1.5, px(0.003))
    for (const [x, y, sx, sy] of [[0, 0, 1, 1], [width, 0, -1, 1], [0, height, 1, -1], [width, height, -1, -1]] as const) {
      context.beginPath()
      context.moveTo(x, y + sy * tick)
      context.lineTo(x, y)
      context.lineTo(x + sx * tick, y)
      context.stroke()
    }
    if (showLabels) {
      const fontSize = clamp(px(0.032), 12, 25)
      context.font = `500 ${fontSize}px "SFMono-Regular", Consolas, monospace`
      context.fillStyle = selected ? 'rgba(211,176,117,0.95)' : 'rgba(242,235,221,0.52)'
      context.textAlign = 'left'
      context.textBaseline = 'top'
      const label = `[${zone.label}]`
      context.fillText(label, px(0.035), px(0.03), width - px(0.07))
    }
  } else {
    const worldSizes = { title: 0.26, verticalTitle: 0.3, subtitle: 0.04, body: 0.032, section: 0.09, object: 0.07, caption: 0.026, meta: 0.018 }
    const size = px(worldSizes[zone.style])
    const serif = zone.style === 'title' || zone.style === 'verticalTitle' || zone.style === 'object' || zone.style === 'section'
    context.font = `${serif ? 500 : 400} ${size}px ${serif ? 'Georgia, "Songti SC", serif' : 'Inter, Helvetica, "PingFang SC", sans-serif'}`
    context.fillStyle = '#f2ebdd'
    context.textBaseline = 'top'
    if (zone.style === 'verticalTitle') {
      const characters = [...text.replace(/\s/g, '')].slice(0, zone.chars ?? 8)
      const lineHeight = Math.min(size * 1.12, height / Math.max(characters.length, 1))
      context.textAlign = 'center'
      characters.forEach((character, index) => context.fillText(character, width / 2, Math.max(0, (height - lineHeight * characters.length) / 2 + index * lineHeight)))
    } else {
      const padding = px(0.012)
      const lines = textLines(context, text, width - padding * 2).slice(0, zone.lines)
      const lineHeight = size * (zone.style === 'body' || zone.style === 'caption' ? 1.5 : 1.18)
      context.textAlign = zone.align
      const x = zone.align === 'center' ? width / 2 : zone.align === 'right' ? width - padding : padding
      lines.forEach((line, index) => context.fillText(line, x, padding + index * lineHeight))
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

export class WallScene {
  private container: HTMLElement
  private config: WallConfig
  private callbacks: SceneCallbacks
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private zoneGroup = new THREE.Group()
  private objectGroup = new THREE.Group()
  private models = new Map<number, THREE.Group>()
  private resizeObserver: ResizeObserver
  private animationId = 0
  private lastFrame = performance.now()
  private lastSnapshot = 0
  private frames = 0
  private fpsTimer = performance.now()
  private fps = 60
  private time = 0
  private playing = true
  private speed = 1
  private mode: ViewMode = 'tour'
  private language: Language = 'en'
  private showLabels = true
  private selectedId = ''
  private quality: Quality = 'high'
  private reducedMotion = false
  private keys = new Set<string>()
  private yaw = 0
  private pitch = 0
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private disposed = false

  constructor(container: HTMLElement, config: WallConfig, callbacks: SceneCallbacks) {
    this.container = container
    this.config = config
    this.callbacks = callbacks
    this.scene.background = new THREE.Color('#11130f')
    this.scene.fog = new THREE.FogExp2('#11130f', 0.022)
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.05, 60)
    this.camera.rotation.order = 'YXZ'
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.86
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.domElement.className = 'wall-canvas'
    this.renderer.domElement.setAttribute('aria-label', 'Interactive continuous museum entrance wall')
    container.appendChild(this.renderer.domElement)
    RectAreaLightUniformsLib.init()
    this.buildArchitecture()
    this.scene.add(this.zoneGroup, this.objectGroup)
    this.rebuildZones()
    this.rebuildObjects()
    this.applyTour(0)
    this.bindEvents()
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()
    const params = new URLSearchParams(window.location.search)
    if (params.has('t')) this.setTime(Number(params.get('t')) || 0)
    if (params.get('tour') !== '1') this.playing = false
    this.animate()
  }

  private mesh(geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], parent: THREE.Object3D = this.scene) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(...position)
    parent.add(mesh)
    return mesh
  }

  private buildArchitecture() {
    const wallMaterial = new THREE.MeshStandardMaterial({ map: canvasTexture('wall'), color: '#ffffff', roughness: 0.9 })
    const floorMaterial = new THREE.MeshStandardMaterial({ map: canvasTexture('floor'), color: '#b7b5aa', roughness: 0.28, metalness: 0.08 })
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: '#141512', roughness: 0.95 })
    const stoneMaterial = new THREE.MeshStandardMaterial({ color: '#d8d2c4', roughness: 0.6 })
    const brassMaterial = new THREE.MeshStandardMaterial({ color: '#8a6a3b', metalness: 0.8, roughness: 0.35 })
    const darkMaterial = new THREE.MeshStandardMaterial({ color: '#11120f', roughness: 0.88 })
    const glassMaterial = new THREE.MeshPhysicalMaterial({ color: '#e8f0ea', transparent: true, opacity: 0.06, roughness: 0.05, metalness: 0, depthWrite: false, side: THREE.DoubleSide })

    const wall = this.mesh(new THREE.BoxGeometry(18, 3.4, 0.4), wallMaterial, [9, 1.7, -0.2])
    wall.receiveShadow = true
    const floor = this.mesh(new THREE.PlaneGeometry(22, 6), floorMaterial, [9, 0, 1.7])
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.mesh(new THREE.PlaneGeometry(22, 4), ceilingMaterial, [9, 3.4, 1.5]).rotation.x = Math.PI / 2

    const pilasterMaterial = new THREE.MeshStandardMaterial({ color: '#363b32', roughness: 0.93 })
    for (const x of [4.2, 6.2, 8.2, 10.2, 12.2, 14.2, 16.2]) {
      this.mesh(new THREE.BoxGeometry(0.12, 3.4, 0.06), pilasterMaterial, [x, 1.7, 0.03])
    }

    this.mesh(new THREE.BoxGeometry(18, 0.005, 0.008), new THREE.MeshBasicMaterial({ color: '#141414' }), [9, 1.35, 0.009])
    this.mesh(new THREE.BoxGeometry(0.04, 0.04, 0.009), new THREE.MeshBasicMaterial({ color: '#9e2b25' }), [0.04, 1.35, 0.013])
    this.mesh(new THREE.BoxGeometry(0.02, 1.9, 0.025), new THREE.MeshBasicMaterial({ color: '#050605' }), [17.99, 1.35, 0.014])
    this.mesh(new THREE.BoxGeometry(18, 0.008, 0.016), darkMaterial, [9, 0.04, 0.01])
    this.mesh(new THREE.BoxGeometry(18, 0.02, 0.025), brassMaterial, [9, 1.52, 0.028])

    const base = this.mesh(new THREE.BoxGeometry(12, 0.9, 0.55), stoneMaterial, [10.2, 0.45, 0.275])
    base.castShadow = true
    base.receiveShadow = true
    this.mesh(new THREE.BoxGeometry(12.02, 0.025, 0.57), stoneMaterial, [10.2, 0.9, 0.285])
    this.mesh(new THREE.BoxGeometry(12, 0.025, 0.55), brassMaterial, [10.2, 1.4, 0.275])
    this.mesh(new THREE.PlaneGeometry(12, 0.5), glassMaterial, [10.2, 1.15, 0.55])
    this.mesh(new THREE.PlaneGeometry(12, 0.55), glassMaterial, [10.2, 1.4, 0.275]).rotation.x = Math.PI / 2
    for (const x of [4.2, 6.2, 8.2, 10.2, 12.2, 14.2, 16.2]) {
      this.mesh(new THREE.BoxGeometry(0.04, 0.5, 0.025), brassMaterial, [x, 1.15, 0.56])
    }

    this.mesh(new THREE.BoxGeometry(18, 0.12, 0.1), new THREE.MeshStandardMaterial({ color: '#ffd6a0', emissive: '#ffc27a', emissiveIntensity: 2.1 }), [9, 3.25, 0.075])
    this.mesh(new THREE.BoxGeometry(18, 0.06, 0.06), darkMaterial, [9, 3.31, 1.3])
    for (let i = 1; i <= 6; i += 1) {
      const x = 4.2 + (i - 0.5) * 2
      const fixture = this.mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.12, 16), darkMaterial, [x, 3.22, 1.3])
      fixture.rotation.x = -0.35
      const spot = new THREE.SpotLight('#ffe0b0', 10, 4.2, 0.34, 0.65, 1.6)
      spot.position.set(x, 3.16, 1.3)
      spot.target.position.set(x, 1.1, 0.25)
      this.scene.add(spot, spot.target)
      const caseLight = new THREE.SpotLight('#ffd09a', 2.8, 1.0, 0.5, 0.7, 1.4)
      caseLight.position.set(x, 1.36, 0.28)
      caseLight.target.position.set(x, 0.9, 0.28)
      this.scene.add(caseLight, caseLight.target)
    }
    const washer = new THREE.RectAreaLight('#ffddb0', 3.2, 18, 0.12)
    washer.position.set(9, 3.23, 0.16)
    washer.lookAt(9, 1.2, 0)
    this.scene.add(washer)
    const titleLight = new THREE.RectAreaLight('#ffe1b8', 1.8, 4.2, 0.15)
    titleLight.position.set(2.1, 3.18, 0.5)
    titleLight.lookAt(2.1, 1.8, 0)
    this.scene.add(titleLight)
    const fill = new THREE.HemisphereLight('#d8cdb4', '#191b17', 0.28)
    this.scene.add(fill)
    const shadowLight = new THREE.DirectionalLight('#ffddad', 1.0)
    shadowLight.position.set(2.5, 3.2, 2.7)
    shadowLight.target.position.set(2.5, 0.8, 0)
    shadowLight.castShadow = true
    shadowLight.shadow.mapSize.set(1024, 1024)
    shadowLight.shadow.camera.left = -4
    shadowLight.shadow.camera.right = 4
    shadowLight.shadow.camera.top = 4
    shadowLight.shadow.camera.bottom = -4
    this.scene.add(shadowLight, shadowLight.target)
  }

  private rebuildZones() {
    for (const child of [...this.zoneGroup.children]) {
      const mesh = child as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
      mesh.geometry.dispose()
      mesh.material.map?.dispose()
      mesh.material.dispose()
      this.zoneGroup.remove(child)
    }
    for (const zone of this.config.zones) {
      const material = new THREE.MeshBasicMaterial({ map: makeZoneTexture(zone, this.language, this.showLabels, this.selectedId === zone.id), transparent: true, alphaTest: 0.015, depthWrite: false, side: THREE.DoubleSide })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(zone.w, zone.h), material)
      mesh.position.set(zone.x + zone.w / 2, zone.y + zone.h / 2, 0.014 + zone.bay * 0.00005)
      mesh.userData.zoneId = zone.id
      this.zoneGroup.add(mesh)
    }
  }

  private rebuildObjects() {
    for (const child of [...this.objectGroup.children]) {
      if (![...this.models.values()].includes(child as THREE.Group)) {
        const mesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>
        mesh.geometry?.dispose()
        if (Array.isArray(mesh.material)) mesh.material.forEach(material => material.dispose())
        else mesh.material?.dispose()
      }
      this.objectGroup.remove(child)
    }
    for (const object of this.config.objects) {
      const model = this.models.get(object.bay)
      if (model) this.objectGroup.add(model)
      else this.objectGroup.add(this.makeProxy(object))
    }
  }

  private makeProxy(object: WallObject) {
    const x = 4.2 + (object.bay - 0.5) * 2
    const material = new THREE.MeshStandardMaterial({ color: object.bay % 2 ? '#cfc6b6' : '#4a3b2a', roughness: 0.8, metalness: object.bay % 2 ? 0 : 0.2 })
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(object.proxy.w, object.proxy.h, object.proxy.d), material)
    mesh.position.set(x, 0.925 + object.proxy.h / 2, 0.29)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.objectId = object.id
    return mesh
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('pointerlockchange', this.onPointerLock)
    document.addEventListener('mousemove', this.onMouseMove)
    this.renderer.domElement.addEventListener('click', this.onClick)
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if ((event.target as HTMLElement)?.matches('input, textarea, select, [contenteditable="true"]')) return
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
      event.preventDefault()
      if (this.mode !== 'walk') this.setMode('walk')
      this.keys.add(event.code)
    }
  }

  private onKeyUp = (event: KeyboardEvent) => this.keys.delete(event.code)
  private onPointerLock = () => undefined

  private onMouseMove = (event: MouseEvent) => {
    if (document.pointerLockElement !== this.renderer.domElement || this.mode !== 'walk') return
    this.yaw -= event.movementX * 0.0018
    this.pitch = clamp(this.pitch - event.movementY * 0.0018, -1.15, 1.15)
  }

  private onClick = (event: MouseEvent) => {
    if (this.mode === 'walk') {
      if (document.pointerLockElement !== this.renderer.domElement) this.renderer.domElement.requestPointerLock?.()
      return
    }
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hit = this.raycaster.intersectObjects(this.zoneGroup.children, false)[0]
    if (hit?.object.userData.zoneId) {
      this.selectedId = hit.object.userData.zoneId
      this.rebuildZones()
      this.callbacks.onSelect(this.selectedId)
    }
  }

  private resize() {
    const width = Math.max(this.container.clientWidth, 1)
    const height = Math.max(this.container.clientHeight, 1)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  private applyTour(time: number) {
    const segment = TOUR_SEGMENTS.find(item => time >= item.start && time <= item.end) ?? TOUR_SEGMENTS[TOUR_SEGMENTS.length - 1]
    const progress = segment.dwell ? 0 : ease(clamp((time - segment.start) / (segment.end - segment.start), 0, 1))
    const x = THREE.MathUtils.lerp(STATION_X[segment.from], STATION_X[segment.to], progress)
    const fromLook = STATION_LOOK[segment.from]
    const toLook = STATION_LOOK[segment.to]
    this.camera.position.set(x, 1.6, 2.8)
    this.camera.lookAt(
      THREE.MathUtils.lerp(fromLook[0], toLook[0], progress),
      THREE.MathUtils.lerp(fromLook[1], toLook[1], progress),
      0,
    )
    const fade = time > 84 ? 1 - (time - 84) / 6 * 0.58 : 1
    this.renderer.toneMappingExposure = 0.86 * fade
  }

  private updateWalk(delta: number) {
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ')
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))
    const movement = new THREE.Vector3()
    if (this.keys.has('KeyW')) movement.add(forward)
    if (this.keys.has('KeyS')) movement.sub(forward)
    if (this.keys.has('KeyD')) movement.add(right)
    if (this.keys.has('KeyA')) movement.sub(right)
    if (movement.lengthSq() > 0) {
      movement.normalize().multiplyScalar(delta * 1.65)
      this.camera.position.add(movement)
      this.camera.position.x = clamp(this.camera.position.x, 0.15, 17.85)
      this.camera.position.z = clamp(this.camera.position.z, 0.83, 3.05)
      this.camera.position.y = 1.6
    }
  }

  private currentBay() {
    const x = this.camera.position.x
    if (x < 4.2) return 0
    if (x >= 16.2) return 7
    return clamp(Math.floor((x - 4.2) / 2) + 1, 1, 6)
  }

  private animate = () => {
    if (this.disposed) return
    this.animationId = requestAnimationFrame(this.animate)
    const now = performance.now()
    const delta = Math.min((now - this.lastFrame) / 1000, 0.05)
    this.lastFrame = now
    if (this.mode === 'tour') {
      if (this.playing) {
        const next = this.time + delta * this.speed
        this.time = next >= 90 ? (this.reducedMotion ? 90 : 0) : next
      }
      this.applyTour(this.time)
    } else {
      this.renderer.toneMappingExposure = 0.86
      this.updateWalk(delta)
    }
    this.renderer.render(this.scene, this.camera)
    this.frames += 1
    if (now - this.fpsTimer > 1000) {
      this.fps = Math.round(this.frames * 1000 / (now - this.fpsTimer))
      this.frames = 0
      this.fpsTimer = now
    }
    if (now - this.lastSnapshot > 180) {
      this.callbacks.onSnapshot({ time: this.time, playing: this.playing, mode: this.mode, bay: this.currentBay(), fps: this.fps })
      this.lastSnapshot = now
    }
  }

  setTime(value: number) {
    this.time = clamp(value, 0, 90)
    this.mode = 'tour'
    this.playing = false
    if (document.pointerLockElement) document.exitPointerLock()
    this.applyTour(this.time)
    this.callbacks.onModeChange('tour')
  }

  setPlaying(playing: boolean) {
    if (this.mode !== 'tour') this.setMode('tour')
    if (this.time >= 90 && playing) this.time = 0
    this.playing = playing
  }

  setSpeed(speed: number) { this.speed = speed }

  setMode(mode: ViewMode) {
    if (mode === this.mode) return
    this.mode = mode
    this.playing = false
    this.keys.clear()
    if (mode === 'walk') {
      const direction = this.camera.getWorldDirection(new THREE.Vector3())
      this.yaw = Math.atan2(-direction.x, -direction.z)
      this.pitch = Math.asin(clamp(direction.y, -1, 1))
      this.camera.position.y = 1.6
      this.renderer.domElement.requestPointerLock?.()
    } else {
      if (document.pointerLockElement) document.exitPointerLock()
      this.applyTour(this.time)
    }
    this.callbacks.onModeChange(mode)
  }

  jumpToBay(bay: number) {
    const index = clamp(bay, 0, 7)
    let cursor = 0
    for (let i = 0; i < index; i += 1) cursor += (i === 0 ? 8 : 6) + 40 / 7
    this.setTime(cursor)
  }

  setLanguage(language: Language) { this.language = language; this.rebuildZones() }
  setShowLabels(show: boolean) { this.showLabels = show; this.rebuildZones() }
  setReducedMotion(reduced: boolean) { this.reducedMotion = reduced }
  setQuality(quality: Quality) {
    this.quality = quality
    this.renderer.setPixelRatio(this.quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1)
    this.renderer.shadowMap.enabled = this.quality === 'high'
    this.resize()
  }

  selectZone(id: string) { this.selectedId = id; this.rebuildZones() }
  updateConfig(config: WallConfig) { this.config = config; this.rebuildZones(); this.rebuildObjects() }

  async importGlb(bay: number, file: File) {
    if (!file.name.toLowerCase().endsWith('.glb')) throw new Error('Please choose a binary .glb model.')
    if (file.size > 50 * 1024 * 1024) throw new Error('Please use a GLB smaller than 50 MB.')
    const buffer = await file.arrayBuffer()
    const gltf = await new GLTFLoader().parseAsync(buffer, '')
    const source = gltf.scene
    source.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(source)
    if (box.isEmpty()) throw new Error('The GLB does not contain visible geometry.')
    const size = box.getSize(new THREE.Vector3())
    const scale = 0.25 / Math.max(size.x, size.y, size.z)
    const center = box.getCenter(new THREE.Vector3())
    const wrapper = new THREE.Group()
    source.scale.setScalar(scale)
    source.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
    wrapper.add(source)
    wrapper.position.set(4.2 + (bay - 0.5) * 2, 0.925, 0.29)
    wrapper.traverse(child => {
      if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true }
    })
    this.models.get(bay)?.traverse(child => {
      if (child instanceof THREE.Mesh) child.geometry.dispose()
    })
    this.models.set(bay, wrapper)
    this.rebuildObjects()
  }

  resetModel(bay: number) { this.models.delete(bay); this.rebuildObjects() }

  capture() {
    this.renderer.render(this.scene, this.camera)
    const link = document.createElement('a')
    link.download = `entrance-wall-${Math.round(this.time)}s.png`
    link.href = this.renderer.domElement.toDataURL('image/png')
    link.click()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.animationId)
    this.resizeObserver.disconnect()
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('pointerlockchange', this.onPointerLock)
    document.removeEventListener('mousemove', this.onMouseMove)
    this.renderer.domElement.removeEventListener('click', this.onClick)
    if (document.pointerLockElement) document.exitPointerLock()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

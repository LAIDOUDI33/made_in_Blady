// Augmented Reality Product Viewer Service
// Using WebXR API with Three.js fallback for AlgeriaTrade.dz B2B Platform

// ============================================
// Type Definitions
// ============================================

export type ARMode = 'WEBXR' | 'MARKER_BASED' | 'IMAGE_TRACKING' | '3D_VIEWER_FALLBACK'
export type ARProductFormat = 'GLTF' | 'GLB' | 'USDZ' | 'FBX'

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface ARHotspot {
  id: string
  position: Vector3
  label: string
  labelAr: string
  labelFr: string
  type: 'INFO' | 'LINK' | 'VIDEO' | 'GALLERY' | 'CONFIGURATION'
  content: string | object
  icon: string
}

export interface ARAnimation {
  id: string
  name: string
  nameAr: string
  nameFr: string
  type: 'ROTATE' | 'SCALE' | 'MOVE' | 'SEQUENCE' | 'EXPLODED_VIEW'
  duration: number // seconds
  autoplay: boolean
  trigger?: 'ON_LOAD' | 'ON_CLICK' | 'ON_HOVER'
}

export interface ARMaterialVariation {
  id: string
  name: string
  color: string // Hex or material URL
  textureUrl?: string
  normalMapUrl?: string
  priceModifier?: number
}

export interface ARProductModel {
  id: string
  productId: string
  name: string
  modelUrl: string // CDN URL to 3D model
  thumbnailUrl: string
  format: ARProductFormat
  scale: Vector3
  rotation: Vector3
  position: Vector3
  
  // AR markers (for marker-based AR)
  markerPatternUrl?: string
  markerImageUrl?: string
  
  // Hotspots for interactive elements
  hotspots: ARHotspot[]
  
  // Animations
  animations: ARAnimation[]
  
  // Materials/variations
  materialVariations: ARMaterialVariation[]
  
  // Metadata
  fileSize: number // MB
  polygonCount: number
  optimizedForMobile: boolean
}

export interface AROptions {
  containerId: string
  mode?: ARMode
  enableAnnotations?: boolean
  enableMeasurements?: boolean
  backgroundColor?: string
  showGrid?: boolean
  autoRotate?: boolean
  autoRotateSpeed?: number
  environmentMap?: string
}

export interface ARViewer {
  mode: ARMode
  isSupported: boolean
  isLoading: boolean
  currentModel: ARProductModel | null
  
  // Methods
  loadModel: (model: ARProductModel) => Promise<void>
  setScale: (scale: Vector3) => void
  setRotation: (rotation: Vector3) => void
  setPosition: (position: Vector3) => void
  playAnimation: (animationId: string) => Promise<void>
  stopAnimation: () => void
  setMaterial: (variationId: string) => void
  takeScreenshot: () => Promise<Blob>
  resetView: () => void
  dispose: () => void
  
  // Events
  onModelLoaded?: (model: ARProductModel) => void
  onModelError?: (error: Error) => void
  onHotspotClick?: (hotspot: ARHotspot) => void
  onAnimationComplete?: (animationId: string) => void
}

export interface ARAnalytics {
  modelId: string
  totalViews: number
  uniqueViews: number
  avgDurationSeconds: number
  interactionsCount: number
  hotspotClicks: Record<string, number>
  screenshotsTaken: number
  sharesCount: number
  deviceBreakdown: {
    mobile: number
    desktop: number
    tablet: number
  }
  browserSupportBreakdown: {
    webxr: number
    threejsFallback: number
  }
  dailyViews: Array<{
    date: string
    views: number
  }>
}

export interface ARSupportResult {
  supported: boolean
  mode: ARMode
  webXRSupported: boolean
  reasons?: string[]
}

// ============================================
// Feature Detection
// ============================================

/**
 * Check if AR/WebXR is supported in current browser
 */
export async function checkARSupport(): Promise<ARSupportResult> {
  const reasons: string[] = []
  
  // Check for WebXR support
  let webXRSupported = false
  
  if (typeof navigator !== 'undefined' && 'xr' in navigator) {
    try {
      webXRSupported = await (navigator as any).xr?.isSessionSupported('immersive-ar')
      if (!webXRSupported) {
        reasons.push('WebXR immersive-ar session not supported')
      }
    } catch (e) {
      reasons.push('WebXR API error')
    }
  } else {
    reasons.push('WebXR API not available')
  }

  // Check for WebGL support (required for Three.js fallback)
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  const webGLSupported = !!gl

  if (!webGLSupported) {
    reasons.push('WebGL not supported')
  }

  // Determine best mode
  let mode: ARMode = '3D_VIEWER_FALLBACK'
  
  if (webXRSupported) {
    mode = 'WEBXR'
  } else if (webGLSupported) {
    mode = '3D_VIEWER_FALLBACK'
  }

  return {
    supported: webXRSupported || webGLSupported,
    mode,
    webXRSupported,
    reasons: reasons.length > 0 ? reasons : undefined,
  }
}

// ============================================
// AR Viewer Factory
// ============================================

let viewerInstance: ARViewerImpl | null = null

class ARViewerImpl implements ARViewer {
  public mode: ARMode
  public isSupported: boolean
  public isLoading = false
  public currentModel: ARProductModel | null = null
  
  private container: HTMLElement | null = null
  private renderer: any = null // THREE.WebGLRenderer
  private scene: any = null // THREE.Scene
  private camera: any = null // THREE.PerspectiveCamera
  private controls: any = null // OrbitControls
  private currentMesh: any = null
  private mixer: any = null // AnimationMixer
  private clock: any = null
  private animationFrameId: number | null = null
  
  // Event callbacks
  public onModelLoaded?: (model: ARProductModel) => void
  public onModelError?: (error: Error) => void
  public onHotspotClick?: (hotspot: ARHotspot) => void
  public onAnimationComplete?: (animationId: string) => void

  constructor(options: AROptions, supportResult: ARSupportResult) {
    this.mode = options.mode || supportResult.mode
    this.isSupported = supportResult.supported
    
    const container = document.getElementById(options.containerId)
    if (!container) {
      throw new Error(`Container element #${options.containerId} not found`)
    }
    
    this.container = container
    
    // Initialize will be called separately
  }

  async initialize(options: AROptions): Promise<void> {
    if (!this.container) return

    this.isLoading = true

    try {
      // Dynamic import of Three.js to avoid SSR issues
      const THREE = await import('three')
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js')

      // Setup scene
      this.scene = new THREE.Scene()
      
      if (options.backgroundColor) {
        this.scene.background = new THREE.Color(options.backgroundColor)
      }

      // Add grid if requested
      if (options.showGrid) {
        const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444)
        this.scene.add(gridHelper)
      }

      // Setup camera
      const aspect = this.container.clientWidth / this.container.clientHeight
      this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
      this.camera.position.set(0, 1, 3)

      // Setup renderer
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true, // For screenshots
      })
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      this.renderer.outputColorSpace = THREE.SRGBColorSpace
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping
      this.renderer.toneMappingExposure = 1
      
      this.container.appendChild(this.renderer.domElement)

      // Setup controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.enableDamping = true
      this.controls.dampingFactor = 0.05
      this.controls.autoRotate = options.autoRotate || false
      this.controls.autoRotateSpeed = options.autoRotateSpeed || 2

      // Setup lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      this.scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(5, 10, 7)
      this.scene.add(directionalLight)

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
      fillLight.position.set(-5, 5, -7)
      this.scene.add(fillLight)

      // Setup clock for animations
      this.clock = new THREE.Clock()

      // Handle resize
      window.addEventListener('resize', this.handleResize.bind(this))

      // Start render loop
      this.startRenderLoop()

      this.isLoading = false
    } catch (error) {
      this.isLoading = false
      this.onModelError?.(error instanceof Error ? error : new Error('Failed to initialize AR viewer'))
      throw error
    }
  }

  async loadModel(model: ARProductModel): Promise<void> {
    if (!this.renderer || !this.scene) {
      throw new Error('AR viewer not initialized')
    }

    this.isLoading = true
    this.currentModel = model

    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js')

      // Remove existing model
      if (this.currentMesh) {
        this.scene.remove(this.currentMesh)
        this.currentMesh = null
      }

      // Setup loaders
      const loader = new GLTFLoader()
      
      // Setup Draco decoder for compressed models
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/draco/')
      loader.setDRACOLoader(dracoLoader)

      // Load the model
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          model.modelUrl,
          resolve,
          (progress: any) => {
            console.log(`[AR] Loading: ${(progress.loaded / progress.total * 100).toFixed(1)}%`)
          },
          (error: any) => reject(error)
        )
      })

      this.currentMesh = gltf.scene

      // Apply transformations
      this.currentMesh.scale.set(model.scale.x, model.scale.y, model.scale.z)
      this.currentMesh.rotation.set(model.rotation.x, model.rotation.y, model.rotation.z)
      this.currentMesh.position.set(model.position.x, model.position.y, model.position.z)

      // Center the model
      const box = new (await import('three')).Box3().setFromObject(this.currentMesh)
      const center = box.getCenter(new (await import('three')).Vector3())
      this.currentMesh.position.sub(center)

      // Add to scene
      this.scene.add(this.currentMesh)

      // Setup animations if available
      if (gltf.animations && gltf.animations.length > 0) {
        const { AnimationMixer } = await import('three')
        this.mixer = new AnimationMixer(this.currentMesh)
        
        // Auto-play first animation if configured
        const autoPlayAnim = model.animations.find(a => a.autoplay && a.trigger === 'ON_LOAD')
        if (autoPlayAnim) {
          const clip = gltf.animations.find((a: any) => 
            a.name === autoPlayAnim.name || a.name === autoPlayAnim.nameAr || a.name === autoPlayAnim.nameFr
          )
          if (clip) {
            this.mixer.clipAction(clip).play()
          }
        }
      }

      // Fit camera to model
      this.fitCameraToModel()

      this.isLoading = false
      this.onModelLoaded?.(model)
    } catch (error) {
      this.isLoading = false
      this.onModelError?.(error instanceof Error ? error : new Error('Failed to load model'))
      throw error
    }
  }

  setScale(scale: Vector3): void {
    if (this.currentMesh) {
      this.currentMesh.scale.set(scale.x, scale.y, scale.z)
    }
  }

  setRotation(rotation: Vector3): void {
    if (this.currentMesh) {
      this.currentMesh.rotation.set(rotation.x, rotation.y, rotation.z)
    }
  }

  setPosition(position: Vector3): void {
    if (this.currentMesh) {
      this.currentMesh.position.set(position.x, position.y, position.z)
    }
  }

  async playAnimation(animationId: string): Promise<void> {
    if (!this.mixer || !this.currentModel) return

    const animation = this.currentModel.animations.find(a => a.id === animationId)
    if (!animation) {
      console.warn(`[AR] Animation ${animationId} not found`)
      return
    }

    // This would need access to original GLTF clips
    // For now, we'll just log the action
    console.log(`[AR] Playing animation: ${animation.name}`)
  }

  stopAnimation(): void {
    if (this.mixer) {
      this.mixer.stopAllAction()
    }
  }

  setMaterial(variationId: string): void {
    if (!this.currentMesh || !this.currentModel) return

    const variation = this.currentModel.materialVariations.find(v => v.id === variationId)
    if (!variation) return

    // Apply material variation to all meshes
    this.currentMesh.traverse((child: any) => {
      if (child.isMesh && child.material) {
        // Create new material with color
        child.material = child.material.clone()
        child.material.color.setStyle(variation.color)
        
        if (variation.textureUrl) {
          // Would need to load texture here
          console.log(`[AR] Would apply texture: ${variation.textureUrl}`)
        }
      }
    })
  }

  takeScreenshot(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.renderer) {
        reject(new Error('Renderer not initialized'))
        return
      }

      try {
        this.renderer.render(this.scene, this.camera)
        
        this.renderer.domElement.toBlob((blob: Blob | null) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to capture screenshot'))
          }
        }, 'image/png', 1.0)
      } catch (error) {
        reject(error)
      }
    })
  }

  resetView(): void {
    if (this.camera && this.controls) {
      this.camera.position.set(0, 1, 3)
      this.camera.lookAt(0, 0, 0)
      this.controls.reset()
    }
    
    if (this.currentModel) {
      this.setScale(this.currentModel.scale)
      this.setRotation(this.currentModel.rotation)
      this.setPosition(this.currentModel.position)
    }
  }

  dispose(): void {
    // Stop render loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    // Stop animations
    if (this.mixer) {
      this.mixer.stopAllAction()
    }

    // Remove event listener
    window.removeEventListener('resize', this.handleResize.bind(this))

    // Dispose Three.js resources
    if (this.currentMesh) {
      this.currentMesh.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    }

    if (this.renderer) {
      this.renderer.dispose()
      if (this.container && this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement)
      }
    }

    this.currentMesh = null
    this.renderer = null
    this.scene = null
    this.camera = null
    this.controls = null
    this.mixer = null
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate)

      if (this.controls) {
        this.controls.update()
      }

      if (this.mixer && this.clock) {
        this.mixer.update(this.clock.getDelta())
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
    }

    animate()
  }

  private fitCameraToModel(): void {
    if (!this.currentMesh || !this.camera) return

    // Simple implementation - would use Box3 for proper fitting
    this.camera.position.set(0, 1, 3)
    this.camera.lookAt(0, 0, 0)
  }

  private handleResize(): void {
    if (!this.container || !this.camera || !this.renderer) return

    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }
}

// ============================================
// Public API Functions
// ============================================

/**
 * Initialize AR Viewer instance
 */
export async function initializeARViewer(
  containerId: string, 
  options: Partial<AROptions> = {}
): Promise<ARViewer> {
  // Dispose existing instance
  if (viewerInstance) {
    viewerInstance.dispose()
  }

  // Check support
  const supportResult = await checkARSupport()

  // Create merged options
  const mergedOptions: AROptions = {
    containerId,
    mode: options.mode,
    enableAnnotations: options.enableAnnotations ?? true,
    enableMeasurements: options.enableMeasurements ?? false,
    backgroundColor: options.backgroundColor ?? '#f0f0f0',
    showGrid: options.showGrid ?? false,
    autoRotate: options.autoRotate ?? false,
    autoRotateSpeed: options.autoRotateSpeed ?? 2,
    ...options,
  }

  // Create and initialize viewer
  viewerInstance = new ARViewerImpl(mergedOptions, supportResult)
  await viewerInstance.initialize(mergedOptions)

  return viewerInstance
}

/**
 * Load product model into existing viewer or create new one
 */
export async function loadProductModel(productId: string): Promise<ARProductModel> {
  try {
    const response = await fetch(`/api/ar/models/${productId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch AR model for product ${productId}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('[AR] Error loading product model:', error)
    throw error
  }
}

/**
 * Place model in AR space (for WebXR)
 */
export async function placeModelInAR(
  model: ARProductModel, 
  position?: Vector3
): Promise<void> {
  if (!viewerInstance) {
    throw new Error('AR viewer not initialized')
  }

  await viewerInstance.loadModel(model)
  
  if (position) {
    viewerInstance.setPosition(position)
  }
}

/**
 * Take screenshot of current AR view
 */
export async function takeScreenshot(): Promise<Blob> {
  if (!viewerInstance) {
    throw new Error('AR viewer not initialized')
  }

  return viewerInstance.takeScreenshot()
}

/**
 * Share AR view
 */
export async function shareARView(platform: 'whatsapp' | 'email' | 'link'): Promise<string> {
  const screenshot = await takeScreenshot()
  
  switch (platform) {
    case 'whatsapp':
      // Generate shareable link for WhatsApp
      return `https://wa.me/?text=${encodeURIComponent('Check out this product in AR!')}`
    
    case 'email':
      // Would generate email with screenshot attachment
      return `mailto:?subject=Product in AR&body=Check out this product!`
    
    case 'link':
      // Generate shareable link
      const blob = await takeScreenshot()
      return URL.createObjectURL(blob)
    
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

/**
 * Get analytics for a product's AR views
 */
export async function getModelAnalytics(productId: string): Promise<ARAnalytics> {
  try {
    const response = await fetch(`/api/ar/analytics?productId=${productId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch AR analytics')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('[AR] Error fetching analytics:', error)
    throw error
  }
}

/**
 * Convert model format (server-side operation)
 */
export async function convertModelFormat(
  sourceFile: File, 
  targetFormat: ARProductFormat
): Promise<{ url: string; downloadUrl: string }> {
  const formData = new FormData()
  formData.append('file', sourceFile)
  formData.append('targetFormat', targetFormat)

  const response = await fetch('/api/ar/convert', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to convert model')
  }

  return response.json()
}

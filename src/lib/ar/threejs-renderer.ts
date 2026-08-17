// Three.js Fallback Renderer
// For browsers without WebXR support - Interactive 3D viewer
// AlgeriaTrade.dz B2B Platform

import type { 
  ARProductModel, 
  Vector3, 
  ARHotspot, 
  ARMaterialVariation,
  ARAnimation,
} from './viewer-service'

// ============================================
// Type Definitions
// ============================================

export interface ThreeJSRendererOptions {
  container: HTMLElement
  backgroundColor?: string
  showGrid?: boolean
  showAxes?: boolean
  enableShadows?: boolean
  enableFog?: boolean
  fogColor?: string
  fogDensity?: number
  environmentMapUrl?: string
  autoRotate?: boolean
  autoRotateSpeed?: number
  cameraInitialPosition?: Vector3
  cameraTarget?: Vector3
  onModelLoaded?: () => void
  onLoadProgress?: (progress: number) => void
  onError?: (error: Error) => void
  onHotspotClick?: (hotspot: ARHotspot) => void
}

export interface RendererState {
  isLoaded: boolean
  isLoading: boolean
  loadProgress: number
  currentModel: ARProductModel | null
  selectedMaterialVariation: string | null
  currentAnimation: string | null
  isAnimating: boolean
}

export interface ScreenshotOptions {
  format?: 'png' | 'jpeg'
  quality?: number
  includeWatermark?: boolean
  watermarkText?: string
}

// ============================================
// Three.js Fallback Renderer Class
// ============================================

export class ThreeJSRenderer {
  private options: ThreeJSRendererOptions
  private state: RendererState = {
    isLoaded: false,
    isLoading: false,
    loadProgress: 0,
    currentModel: null,
    selectedMaterialVariation: null,
    currentAnimation: null,
    isAnimating: false,
  }

  // Three.js objects (dynamically imported)
  private THREE: any = null
  private renderer: any = null
  private scene: any = null
  private camera: any = null
  private controls: any = null
  private modelGroup: any = null
  private mixer: any = null
  private clock: any = null
  private animationFrameId: number | null = null

  // Loaders
  private gltfLoader: any = null
  private textureLoader: any = null
  private dracoLoader: any = null

  // Raycaster for interactions
  private raycaster: any = null
  private mouse: any = null

  constructor(options: ThreeJSRendererOptions) {
    this.options = {
      backgroundColor: '#f5f5f5',
      showGrid: false,
      showAxes: false,
      enableShadows: true,
      enableFog: false,
      fogColor: '#f5f5f5',
      fogDensity: 0.02,
      autoRotate: false,
      autoRotateSpeed: 2,
      cameraInitialPosition: { x: 0, y: 1, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
      ...options,
    }
  }

  /**
   * Initialize the renderer
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic import of Three.js and addons
      this.THREE = await import('three')
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js')
      const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js')

      const THREE = this.THREE
      const container = this.options.container

      // Create scene
      this.scene = new THREE.Scene()
      
      if (this.options.backgroundColor) {
        this.scene.background = new THREE.Color(this.options.backgroundColor)
      }

      // Add fog if enabled
      if (this.options.enableFog) {
        this.scene.fog = new THREE.FogExp2(
          new THREE.Color(this.options.fogColor || '#f5f5f5'),
          this.options.fogDensity || 0.02
        )
      }

      // Add grid helper
      if (this.options.showGrid) {
        const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0xcccccc)
        gridHelper.material.opacity = 0.3
        gridHelper.material.transparent = true
        this.scene.add(gridHelper)
      }

      // Add axes helper
      if (this.options.showAxes) {
        const axesHelper = new THREE.AxesHelper(1)
        this.scene.add(axesHelper)
      }

      // Create model group for easy manipulation
      this.modelGroup = new THREE.Group()
      this.scene.add(this.modelGroup)

      // Setup camera
      const aspect = container.clientWidth / container.clientHeight
      this.camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 1000)
      this.camera.position.set(
        this.options.cameraInitialPosition?.x || 0,
        this.options.cameraInitialPosition?.y || 1,
        this.options.cameraInitialPosition?.z || 3
      )

      // Setup renderer with post-processing support
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true, // Required for screenshots
        powerPreference: 'high-performance',
      })
      
      this.renderer.setSize(container.clientWidth, container.clientHeight)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      this.renderer.outputColorSpace = THREE.SRGBColorSpace
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping
      this.renderer.toneMappingExposure = 1
      
      if (this.options.enableShadows) {
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
      }

      container.appendChild(this.renderer.domElement)

      // Setup controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.enableDamping = true
      this.controls.dampingFactor = 0.08
      this.controls.rotateSpeed = 0.8
      this.controls.zoomSpeed = 1.2
      this.controls.panSpeed = 0.8
      this.controls.autoRotate = this.options.autoRotate || false
      this.controls.autoRotateSpeed = this.options.autoRotateSpeed || 2
      this.controls.minDistance = 0.5
      this.controls.maxDistance = 50

      // Setup lighting
      this.setupLighting()

      // Load environment map if provided
      if (this.options.environmentMapUrl) {
        try {
          const rgbeLoader = new RGBELoader()
          const envMap = await new Promise<any>((resolve, reject) => {
            rgbeLoader.load(
              this.options.environmentMapUrl!,
              resolve,
              undefined,
              reject
            )
          })
          
          envMap.mapping = THREE.EquirectangularReflectionMapping
          this.scene.environment = envMap
        } catch (e) {
          console.warn('[ThreeJS] Failed to load environment map:', e)
        }
      }

      // Setup loaders
      this.gltfLoader = new GLTFLoader()
      this.dracoLoader = new DRACOLoader()
      this.dracoLoader.setDecoderPath('/draco/')
      this.gltfLoader.setDRACOLoader(this.dracoLoader)
      this.textureLoader = new THREE.TextureLoader()

      // Setup interaction raycaster
      this.raycaster = new THREE.Raycaster()
      this.mouse = new THREE.Vector2()

      // Setup clock for animations
      this.clock = new THREE.Clock()

      // Event listeners
      window.addEventListener('resize', this.handleResize.bind(this))
      this.renderer.domElement.addEventListener('click', this.handleClick.bind(this))

      // Start render loop
      this.startRenderLoop()

      console.log('[ThreeJS] Renderer initialized successfully')
    } catch (error) {
      console.error('[ThreeJS] Failed to initialize:', error)
      this.options.onError?.(error instanceof Error ? error : new Error('Failed to initialize renderer'))
      throw error
    }
  }

  /**
   * Load a 3D model into the scene
   */
  async loadModel(model: ARProductModel): Promise<void> {
    if (!this.gltfLoader || !this.modelGroup) {
      throw new Error('Renderer not initialized')
    }

    this.state.isLoading = true
    this.state.loadProgress = 0
    this.state.currentModel = model

    try {
      // Clear existing model
      this.clearModel()

      // Load GLTF/GLB model
      const gltf = await new Promise<any>((resolve, reject) => {
        this.gltfLoader.load(
          model.modelUrl,
          (gltf: any) => resolve(gltf),
          (progress: any) => {
            if (progress.lengthComputable) {
              this.state.loadProgress = (progress.loaded / progress.total) * 100
              this.options.onLoadProgress?.(this.state.loadProgress)
            }
          },
          (error: any) => reject(error)
        )
      })

      // Get the main scene from GLTF
      const modelScene = gltf.scene

      // Apply transformations
      modelScene.scale.set(model.scale.x, model.scale.y, model.scale.z)
      modelScene.rotation.set(model.rotation.x, model.rotation.y, model.rotation.z)
      modelScene.position.set(model.position.x, model.position.y, model.position.z)

      // Enable shadows on all meshes
      if (this.options.enableShadows) {
        modelScene.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
      }

      // Center the model
      const box = new this.THREE.Box3().setFromObject(modelScene)
      const center = box.getCenter(new this.THREE.Vector3())
      const size = box.getSize(new this.THREE.Vector3())
      
      modelScene.position.sub(center)

      // Scale to fit in view
      const maxDim = Math.max(size.x, size.y, size.z)
      if (maxDim > 4) {
        const scale = 4 / maxDim
        modelScene.scale.multiplyScalar(scale)
      }

      // Add to scene
      this.modelGroup.add(modelScene)

      // Store reference for later manipulation
      this.modelGroup.userData.currentModel = modelScene

      // Setup animations
      if (gltf.animations && gltf.animations.length > 0) {
        const { AnimationMixer } = await import('three')
        this.mixer = new AnimationMixer(modelScene)
        
        // Store animation clips
        this.modelGroup.userData.animations = gltf.animations
        
        // Auto-play first animation if configured
        const autoPlayAnim = model.animations.find(a => a.autoplay && a.trigger === 'ON_LOAD')
        if (autoPlayAnim) {
          const clip = gltf.animations.find((a: any) => 
            [autoPlayAnim.name, autoPlayAnim.nameAr, autoPlayAnim.nameFr].includes(a.name)
          )
          if (clip) {
            const action = this.mixer.clipAction(clip)
            action.play()
            this.state.currentAnimation = autoPlayAnim.id
            this.state.isAnimating = true
          }
        }
      }

      // Fit camera to model
      this.fitCameraToModel(size, center)

      this.state.isLoaded = true
      this.state.isLoading = false
      this.state.loadProgress = 100

      this.options.onModelLoaded?.()
      console.log(`[ThreeJS] Model loaded: ${model.name}`)
    } catch (error) {
      this.state.isLoading = false
      console.error('[ThreeJS] Failed to load model:', error)
      this.options.onError?.(error instanceof Error ? error : new Error('Failed to load model'))
      throw error
    }
  }

  /**
   * Set material variation (color/texture)
   */
  setMaterialVariation(variationId: string): void {
    if (!this.modelGroup || !this.state.currentModel) return

    const variation = this.state.currentModel.materialVariations.find(v => v.id === variationId)
    if (!variation) return

    const modelScene = this.modelGroup.userData.currentModel
    if (!modelScene) return

    modelScene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        // Clone material to avoid affecting other instances
        const newMaterial = child.material.clone()
        
        // Apply color
        if (variation.color.startsWith('#') || variation.color.startsWith('rgb')) {
          newMaterial.color.setStyle(variation.color)
        }

        // Apply texture if provided
        if (variation.textureUrl) {
          this.textureLoader.load(variation.textureUrl, (texture: any) => {
            texture.flipY = false
            newMaterial.map = texture
            newMaterial.needsUpdate = true
          })
        }

        // Apply normal map if provided
        if (variation.normalMapUrl) {
          this.textureLoader.load(variation.normalMapUrl, (texture: any) => {
            texture.flipY = false
            newMaterial.normalMap = texture
            newMaterial.needsUpdate = true
          })
        }

        child.material = newMaterial
      }
    })

    this.state.selectedMaterialVariation = variationId
  }

  /**
   * Play an animation by ID
   */
  async playAnimation(animationId: string): Promise<void> {
    if (!this.mixer || !this.modelGroup?.userData.animations) return

    // Stop current animation
    this.mixer.stopAllAction()

    const animation = this.state.currentModel?.animations.find(a => a.id === animationId)
    if (!animation) return

    // Find matching clip
    const clip = this.modelGroup.userData.animations.find((a: any) =>
      [animation.name, animation.nameAr, animation.nameFr].includes(a.name)
    )

    if (clip) {
      const action = this.mixer.clipAction(clip)
      action.reset().play()
      this.state.currentAnimation = animationId
      this.state.isAnimating = true

      // Handle animation complete
      if (action.getClip().duration > 0) {
        setTimeout(() => {
          this.state.isAnimating = false
          this.state.currentAnimation = null
        }, action.getClip().duration * 1000)
      }
    }
  }

  /**
   * Stop all animations
   */
  stopAnimation(): void {
    if (this.mixer) {
      this.mixer.stopAllAction()
    }
    this.state.isAnimating = false
    this.state.currentAnimation = null
  }

  /**
   * Take a screenshot of the current view
   */
  async takeScreenshot(options: ScreenshotOptions = {}): Promise<Blob> {
    if (!this.renderer) {
      throw new Error('Renderer not initialized')
    }

    const {
      format = 'png',
      quality = 1,
      includeWatermark = false,
      watermarkText = 'AlgeriaTrade.dz',
    } = options

    // Render current frame
    this.renderer.render(this.scene, this.camera)

    // Optionally add watermark
    if (includeWatermark) {
      this.addWatermark(watermarkText)
    }

    return new Promise((resolve, reject) => {
      this.renderer.domElement.toBlob(
        (blob: Blob | null) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to capture screenshot'))
          }
        },
        `image/${format}`,
        quality
      )
    })
  }

  /**
   * Reset view to initial state
   */
  resetView(): void {
    if (this.camera && this.controls) {
      this.camera.position.set(
        this.options.cameraInitialPosition?.x || 0,
        this.options.cameraInitialPosition?.y || 1,
        this.options.cameraInitialPosition?.z || 3
      )
      this.camera.lookAt(
        this.options.cameraTarget?.x || 0,
        this.options.cameraTarget?.y || 0,
        this.options.cameraTarget?.z || 0
      )
      this.controls.reset()
    }

    if (this.state.currentModel && this.modelGroup) {
      const model = this.state.currentModel
      this.setModelScale(model.scale)
      this.setModelRotation(model.rotation)
      this.setModelPosition(model.position)
    }
  }

  /**
   * Set model scale
   */
  setModelScale(scale: Vector3): void {
    if (this.modelGroup?.userData.currentModel) {
      this.modelGroup.userData.currentModel.scale.set(scale.x, scale.y, scale.z)
    }
  }

  /**
   * Set model rotation
   */
  setModelRotation(rotation: Vector3): void {
    if (this.modelGroup?.userData.currentModel) {
      this.modelGroup.userData.currentModel.rotation.set(rotation.x, rotation.y, rotation.z)
    }
  }

  /**
   * Set model position
   */
  setModelPosition(position: Vector3): void {
    if (this.modelGroup?.userData.currentModel) {
      this.modelGroup.userData.currentModel.position.set(position.x, position.y, position.z)
    }
  }

  /**
   * Enable/disable auto-rotate
   */
  setAutoRotate(enabled: boolean, speed?: number): void {
    if (this.controls) {
      this.controls.autoRotate = enabled
      if (speed !== undefined) {
        this.controls.autoRotateSpeed = speed
      }
    }
  }

  /**
   * Get current state
   */
  getState(): Readonly<RendererState> {
    return { ...this.state }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Stop render loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    // Stop animations
    if (this.mixer) {
      this.mixer.stopAllAction()
      this.mixer = null
    }

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this))
    
    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('click', this.handleClick.bind(this))
    }

    // Dispose of model resources
    this.clearModel()

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose()
      
      if (this.options.container && this.renderer.domElement.parentNode === this.options.container) {
        this.options.container.removeChild(this.renderer.domElement)
      }
      
      this.renderer = null
    }

    // Clear references
    this.scene = null
    this.camera = null
    this.controls = null
    this.modelGroup = null
    this.gltfLoader = null
    this.dracoLoader = null
    this.textureLoader = null
    this.raycaster = null
    this.mouse = null
    this.clock = null
    this.THREE = null

    console.log('[ThreeJS] Renderer disposed')
  }

  // ============================================
  // Private Methods
  // ============================================

  private setupLighting(): void {
    const THREE = this.THREE
    
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    // Main directional light (sun-like)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1)
    mainLight.position.set(5, 10, 7)
    mainLight.castShadow = this.options.enableShadows
    
    if (this.options.enableShadows) {
      mainLight.shadow.mapSize.width = 2048
      mainLight.shadow.mapSize.height = 2048
      mainLight.shadow.camera.near = 0.5
      mainLight.shadow.camera.far = 50
      mainLight.shadow.camera.left = -10
      mainLight.shadow.camera.right = 10
      mainLight.shadow.camera.top = 10
      mainLight.shadow.camera.bottom = -10
      mainLight.shadow.bias = -0.0001
    }
    
    this.scene.add(mainLight)

    // Fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-5, 5, -7)
    this.scene.add(fillLight)

    // Rim/back light for edge definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2)
    rimLight.position.set(0, 5, -10)
    this.scene.add(rimLight)

    // Optional hemisphere light for natural outdoor feel
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3)
    hemiLight.position.set(0, 20, 0)
    this.scene.add(hemiLight)
  }

  private clearModel(): void {
    if (!this.modelGroup) return

    const modelScene = this.modelGroup.userData.currentModel
    if (modelScene) {
      modelScene.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })

      this.modelGroup.remove(modelScene)
      this.modelGroup.userData.currentModel = null
      this.modelGroup.userData.animations = null
    }
  }

  private fitCameraToModel(size: any, center: any): void {
    if (!this.camera || !this.controls) return

    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = this.camera.fov * (Math.PI / 180)
    let cameraZ = Math.abs(maxDim / Math.sin(fov / 2))
    
    // Add some padding
    cameraZ *= 1.8

    this.camera.position.set(center.x + cameraZ * 0.5, center.y + cameraZ * 0.3, center.z + cameraZ)
    this.camera.lookAt(center)
    this.controls.target.copy(center)
    this.controls.update()
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate)

      if (this.controls) {
        this.controls.update()
      }

      if (this.mixer && this.clock) {
        const delta = this.clock.getDelta()
        this.mixer.update(delta)
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
    }

    animate()
  }

  private handleResize(): void {
    if (!this.container || !this.camera || !this.renderer) return

    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }

  private handleClick(event: MouseEvent): void {
    if (!this.raycaster || !this.camera || !this.modelGroup) return

    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const intersects = this.raycaster.intersectObjects(
      this.modelGroup.children,
      true
    )

    if (intersects.length > 0) {
      // Check if clicked on a hotspot area
      const point = intersects[0].point
      
      if (this.state.currentModel) {
        const hotspot = this.findNearestHotspot(point)
        if (hotspot) {
          this.options.onHotspotClick?.(hotspot)
        }
      }
    }
  }

  private findNearestHotspot(point: any): ARHotspot | null {
    if (!this.state.currentModel) return null

    let nearest: ARHotspot | null = null
    let minDistance = Infinity

    for (const hotspot of this.state.currentModel.hotspots) {
      const distance = Math.sqrt(
        Math.pow(point.x - hotspot.position.x, 2) +
        Math.pow(point.y - hotspot.position.y, 2) +
        Math.pow(point.z - hotspot.position.z, 2)
      )

      if (distance < minDistance && distance < 0.5) { // 0.5 unit threshold
        minDistance = distance
        nearest = hotspot
      }
    }

    return nearest
  }

  private addWatermark(text: string): void {
    if (!this.renderer || !this.THREE) return

    // Create canvas for watermark text
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '24px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(text, canvas.width - 20, canvas.height - 15)

    // Create texture from canvas
    const texture = new this.THREE.CanvasTexture(canvas)
    
    // Create sprite with watermark
    const material = new this.THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      depthTest: false,
    })
    const sprite = new this.THREE.Sprite(material)
    sprite.scale.set(4, 0.5, 1)
    sprite.position.set(0, -1.5, 0)
    
    // Add to scene temporarily
    this.scene.add(sprite)
    
    // Remove after render
    requestAnimationFrame(() => {
      this.scene.remove(sprite)
      material.map.dispose()
      material.dispose()
    })
  }
}

export default ThreeJSRenderer

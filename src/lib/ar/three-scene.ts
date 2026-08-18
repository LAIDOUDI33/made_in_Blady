// Three.js Scene Setup for AR Showroom
// Provides a clean API for 3D model rendering and interaction
// AlgeriaTrade.dz B2B Platform

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import type { Vector3 } from './viewer-service'
import { arConfig } from './config'

// ============================================
// Type Definitions
// ============================================

export interface ARSceneOptions {
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
  onModelLoaded?: (model: THREE.Group) => void
  onLoadProgress?: (progress: number) => void
  onError?: (error: Error) => void
}

export interface ARSceneState {
  isInitialized: boolean
  isModelLoaded: boolean
  isLoading: boolean
  loadProgress: number
  currentModelUrl: string | null
}

export interface ScreenshotOptions {
  format?: 'png' | 'jpeg' | 'webp'
  quality?: number
  includeWatermark?: boolean
  watermarkText?: string
}

// ============================================
// Main AR Scene Class
// ============================================

export class ARScene {
  private options: Required<ARSceneOptions>
  
  // Core Three.js objects
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private controls!: OrbitControls
  
  // Model management
  private model: THREE.Group | null = null
  private gltfLoader!: GLTFLoader
  private dracoLoader!: DRACOLoader
  
  // Animation
  private mixer!: THREE.AnimationMixer | null
  private clock!: THREE.Clock
  private animationFrameId: number | null = null
  
  // State
  private state: ARSceneState = {
    isInitialized: false,
    isModelLoaded: false,
    isLoading: false,
    loadProgress: 0,
    currentModelUrl: null,
  }

  constructor(container: HTMLElement, options: Partial<ARSceneOptions> = {}) {
    this.options = {
      container,
      backgroundColor: options.backgroundColor || arConfig.viewer.defaultBackgroundColor,
      showGrid: options.showGrid ?? false,
      showAxes: options.showAxes ?? false,
      enableShadows: options.enableShadows ?? arConfig.viewer.enableShadows,
      enableFog: options.enableFog ?? arConfig.viewer.enableFog,
      fogColor: options.fogColor || arConfig.viewer.fogColor,
      fogDensity: options.fogDensity || arConfig.viewer.fogDensity,
      environmentMapUrl: options.environmentMapUrl,
      autoRotate: options.autoRotate ?? true,
      autoRotateSpeed: options.autoRotateSpeed || arConfig.viewer.defaultAutoRotateSpeed,
      cameraInitialPosition: options.cameraInitialPosition || arConfig.viewer.defaultCameraPosition,
      cameraTarget: options.cameraTarget || arConfig.viewer.defaultCameraTarget,
      onModelLoaded: options.onModelLoaded,
      onLoadProgress: options.onLoadProgress,
      onError: options.onError,
    }
  }

  /**
   * Initialize the scene
   */
  async initialize(): Promise<void> {
    if (this.state.isInitialized) {
      console.warn('[ARScene] Already initialized')
      return
    }

    try {
      const container = this.options.container
      
      // Create scene
      this.scene = new THREE.Scene()
      
      // Set background color
      this.scene.background = new THREE.Color(this.options.backgroundColor)

      // Add fog if enabled
      if (this.options.enableFog) {
        this.scene.fog = new THREE.FogExp2(
          new THREE.Color(this.options.fogColor),
          this.options.fogDensity
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

      // Create camera
      const aspect = container.clientWidth / container.clientHeight
      this.camera = new THREE.PerspectiveCamera(
        arConfig.viewer.fov,
        aspect,
        arConfig.viewer.nearPlane,
        arConfig.viewer.farPlane
      )
      this.camera.position.set(
        this.options.cameraInitialPosition.x,
        this.options.cameraInitialPosition.y,
        this.options.cameraInitialPosition.z
      )

      // Create renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true, // For screenshots
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
      this.controls.autoRotate = this.options.autoRotate
      this.controls.autoRotateSpeed = this.options.autoRotateSpeed
      this.controls.minDistance = 0.5
      this.controls.maxDistance = 50

      // Setup lighting
      this.setupLighting()

      // Load environment map if provided
      if (this.options.environmentMapUrl) {
        await this.loadEnvironmentMap(this.options.environmentMapUrl)
      }

      // Setup loaders
      this.setupLoaders()

      // Setup clock for animations
      this.clock = new THREE.Clock()

      // Event listeners
      window.addEventListener('resize', this.handleResize.bind(this))

      // Start render loop
      this.startRenderLoop()

      this.state.isInitialized = true
      console.log('[ARScene] Initialized successfully')
    } catch (error) {
      console.error('[ARScene] Initialization error:', error)
      this.options.onError?.(error instanceof Error ? error : new Error('Failed to initialize scene'))
      throw error
    }
  }

  /**
   * Load a 3D model into the scene
   */
  async loadModel(url: string): Promise<void> {
    if (!this.state.isInitialized) {
      throw new Error('Scene not initialized. Call initialize() first.')
    }

    this.state.isLoading = true
    this.state.loadProgress = 0
    this.state.currentModelUrl = url

    try {
      // Remove existing model
      if (this.model) {
        this.removeModel()
      }

      // Load new model
      const gltf = await new Promise<THREE.GLTF>((resolve, reject) => {
        this.gltfLoader.load(
          url,
          (gltf) => resolve(gltf),
          (progress) => {
            if (progress.lengthComputable) {
              this.state.loadProgress = (progress.loaded / progress.total) * 100
              this.options.onLoadProgress?.(this.state.loadProgress)
            }
          },
          (error) => reject(error)
        )
      })

      // Get the main scene from GLTF
      this.model = gltf.scene

      // Enable shadows on all meshes
      if (this.options.enableShadows) {
        this.model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
      }

      // Center the model
      const box = new THREE.Box3().setFromObject(this.model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      
      this.model.position.sub(center)

      // Scale to fit in view
      const maxDim = Math.max(size.x, size.y, size.z)
      if (maxDim > 4) {
        const scale = 4 / maxDim
        this.model.scale.multiplyScalar(scale)
      }

      // Add to scene
      this.scene.add(this.model)

      // Setup animations if available
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.model)
        this.model.userData.animations = gltf.animations
        
        // Auto-play first animation
        const action = this.mixer.clipAction(gltf.animations[0])
        action.play()
      }

      // Fit camera to model
      this.fitCameraToModel(size, center)

      this.state.isModelLoaded = true
      this.state.isLoading = false
      this.state.loadProgress = 100

      this.options.onModelLoaded?.(this.model)
      console.log(`[ARScene] Model loaded: ${url}`)
    } catch (error) {
      this.state.isLoading = false
      console.error('[ARScene] Model loading error:', error)
      this.options.onError?.(error instanceof Error ? error : new Error('Failed to load model'))
      throw error
    }
  }

  /**
   * Set model scale
   */
  setScale(scale: number): void {
    if (this.model) {
      this.model.scale.setScalar(scale)
    }
  }

  /**
   * Set model scale with individual components
   */
  setScaleXYZ(x: number, y: number, z: number): void {
    if (this.model) {
      this.model.scale.set(x, y, z)
    }
  }

  /**
   * Set model rotation in radians
   */
  setRotation(x: number, y: number, z: number): void {
    if (this.model) {
      this.model.rotation.set(x, y, z)
    }
  }

  /**
   * Set model rotation in degrees
   */
  setRotationDegrees(x: number, y: number, z: number): void {
    const degToRad = Math.PI / 180
    this.setRotation(x * degToRad, y * degToRad, z * degToRad)
  }

  /**
   * Enable/disable auto-rotation
   */
  enableAutoRotate(enabled: boolean, speed?: number): void {
    if (this.controls) {
      this.controls.autoRotate = enabled
      if (speed !== undefined) {
        this.controls.autoRotateSpeed = speed
      }
    }
  }

  /**
   * Take a screenshot of the current view
   */
  takeScreenshot(options: ScreenshotOptions = {}): string {
    if (!this.renderer) {
      throw new Error('Renderer not initialized')
    }

    const {
      format = 'png',
      quality = 1,
    } = options

    // Render current frame
    this.renderer.render(this.scene, this.camera)

    return this.renderer.domElement.toDataURL(`image/${format}`, quality)
  }

  /**
   * Get screenshot as blob
   */
  takeScreenshotBlob(options: ScreenshotOptions = {}): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const dataUrl = this.takeScreenshot(options)
        
        // Convert data URL to Blob
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => resolve(blob))
          .catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Reset view to initial state
   */
  resetView(): void {
    if (this.camera && this.controls) {
      this.camera.position.set(
        this.options.cameraInitialPosition.x,
        this.options.cameraInitialPosition.y,
        this.options.cameraInitialPosition.z
      )
      this.camera.lookAt(
        this.options.cameraTarget.x,
        this.options.cameraTarget.y,
        this.options.cameraTarget.z
      )
      this.controls.reset()
    }

    if (this.model) {
      this.model.scale.setScalar(1)
      this.model.rotation.set(0, 0, 0)
    }
  }

  /**
   * Get current state
   */
  getState(): Readonly<ARSceneState> {
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

    // Dispose of model resources
    this.removeModel()

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose()
      
      if (this.options.container && 
          this.renderer.domElement.parentNode === this.options.container) {
        this.options.container.removeChild(this.renderer.domElement)
      }
      
      this.renderer = null
    }

    // Clear references
    this.scene = null!
    this.camera = null!
    this.controls = null!
    this.gltfLoader = null!
    this.dracoLoader = null!
    this.clock = null!

    // Reset state
    this.state.isInitialized = false
    this.state.isModelLoaded = false
    this.state.currentModelUrl = null

    console.log('[ARScene] Disposed')
  }

  // ============================================
  // Private Methods
  // ============================================

  private setupLighting(): void {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    // Main directional light (sun-like)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1)
    mainLight.position.set(5, 10, 7)
    mainLight.castShadow = this.options.enableShadows
    
    if (this.options.enableShadows) {
      mainLight.shadow.mapSize.width = arConfig.viewer.shadowMapSize
      mainLight.shadow.mapSize.height = arConfig.viewer.shadowMapSize
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

    // Hemisphere light for natural outdoor feel
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3)
    hemiLight.position.set(0, 20, 0)
    this.scene.add(hemiLight)
  }

  private setupLoaders(): void {
    // GLTF Loader
    this.gltfLoader = new GLTFLoader()
    
    // Draco Loader for compressed models
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath('/draco/')
    this.gltfLoader.setDRACOLoader(this.dracoLoader)
  }

  private async loadEnvironmentMap(url: string): Promise<void> {
    try {
      const rgbeLoader = new RGBELoader()
      const envMap = await new Promise<THREE.DataTexture>((resolve, reject) => {
        rgbeLoader.load(url, resolve, undefined, reject)
      })
      
      envMap.mapping = THREE.EquirectangularReflectionMapping
      this.scene.environment = envMap
    } catch (e) {
      console.warn('[ARScene] Failed to load environment map:', e)
    }
  }

  private removeModel(): void {
    if (this.model) {
      this.model.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose()
        }
        
        const meshChild = child as THREE.Mesh
        if (meshChild.material) {
          if (Array.isArray(meshChild.material)) {
            meshChild.material.forEach((m) => m.dispose())
          } else {
            meshChild.material.dispose()
          }
        }
      })

      this.scene.remove(this.model)
      this.model = null
    }
    
    if (this.mixer) {
      this.mixer.stopAllAction()
      this.mixer = null
    }
  }

  private fitCameraToModel(size: THREE.Vector3, center: THREE.Vector3): void {
    if (!this.camera || !this.controls) return

    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = this.camera.fov * (Math.PI / 180)
    let cameraZ = Math.abs(maxDim / Math.sin(fov / 2))
    
    // Add some padding
    cameraZ *= 1.8

    this.camera.position.set(
      center.x + cameraZ * 0.5,
      center.y + cameraZ * 0.3,
      center.z + cameraZ
    )
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
    if (!this.options.container || !this.camera || !this.renderer) return

    const width = this.options.container.clientWidth
    const height = this.options.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }
}

export default ARScene

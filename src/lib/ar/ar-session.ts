// AR Session Manager
// Handles WebXR session initialization, placement, and lifecycle
// AlgeriaTrade.dz B2B Platform

import { arConfig } from './config'
import type { ARModelFormat } from './config'
import type { Vector3 } from './viewer-service'

// ============================================
// Type Definitions
// ============================================

export interface ARSessionState {
  isActive: boolean
  isSupported: boolean
  mode: 'viewing' | 'placing' | 'placed'
  currentModelUrl: string | null
  placedObjects: PlacedObject[]
  error: string | null
}

export interface PlacedObject {
  id: string
  modelUrl: string
  position: Vector3
  rotation: Vector3
  scale: Vector3
  placedAt: Date
}

export interface ARSessionOptions {
  container?: HTMLElement
  onSessionStart?: () => void
  onSessionEnd?: (reason?: string) => void
  onModelPlaced?: (object: PlacedObject) => void
  onError?: (error: Error) => void
  onFrame?: (time: number, frame: XRFrame) => void
}

export interface HitTestResult {
  position: Vector3
  normal: Vector3
  planeId?: string
}

export type PlacementMode = 'floor' | 'wall' | 'ceiling' | 'horizontal' | 'vertical' | 'any'

// ============================================
// AR Session Class
// ============================================

export class ARSessionManager {
  private session: XRSession | null = null
  private _space: XRSpace | null = null
  private viewerSpace: XRReferenceSpace | null = null
  private localSpace: XRReferenceSpace | null = null
  
  private state: ARSessionState = {
    isActive: false,
    isSupported: false,
    mode: 'viewing',
    currentModelUrl: null,
    placedObjects: [],
    error: null,
  }

  private options: ARSessionOptions
  private rafId: number | null = null
  private hitTestSource: XRHitTestSource | null = null
  private placementMode: PlacementMode = arConfig.session.defaultPlacementMode

  // Model placement reticle
  private reticleElement: HTMLElement | null = null
  private modelElement: HTMLElement | null = null

  constructor(options: ARSessionOptions = {}) {
    this.options = options
  }

  /**
   * Get current state
   */
  getState(): Readonly<ARSessionState> {
    return { ...this.state }
  }

  /**
   * Check if AR is supported
   */
  async checkSupport(): Promise<boolean> {
    if (!navigator.xr) {
      this.state.isSupported = false
      this.state.error = 'WebXR not supported in this browser'
      return false
    }

    try {
      const supported = await navigator.xr.isSessionSupported('immersive-ar')
      this.state.isSupported = supported
      
      if (!supported) {
        this.state.error = 'Immersive AR not supported. Try using Chrome on Android or Safari on iOS.'
      }
      
      return supported
    } catch (error) {
      this.state.isSupported = false
      this.state.error = 'Error checking AR support'
      console.error('[ARSession] Support check error:', error)
      return false
    }
  }

  /**
   * Start an immersive AR session
   */
  async startSession(
    mode: PlacementMode = arConfig.session.defaultPlacementMode
  ): Promise<boolean> {
    // Check support first
    const supported = await this.checkSupport()
    
    if (!supported) {
      this.options.onError?.(new Error(this.state.error || 'AR not supported'))
      return false
    }

    try {
      this.placementMode = mode

      // Request the session with required features
      const sessionInit: XRSessionInit = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: [
          'dom-overlay',
          'light-estimation',
          ...(arConfig.features.enablePlaneDetection ? ['plane-detection'] : []),
        ],
        domOverlay: this.options.container 
          ? { root: this.options.container }
          : undefined,
      }

      this.session = await navigator.xr.requestSession('immersive-ar', sessionInit)

      // Set up session event handlers
      this.session.addEventListener('end', this.handleSessionEnd.bind(this))

      // Create reference spaces
      this.viewerSpace = await this.session.requestReferenceSpace('viewer')
      this.localSpace = await this.session.requestReferenceSpace('local')

      // Set up hit test source
      if (this.viewerSpace) {
        this.hitTestSource = await this.session.requestHitTestSource({
          space: this.viewerSpace,
          entityTypes: ['plane'],
        })
      }

      // Update state
      this.state.isActive = true
      this.state.mode = 'placing'
      this.state.error = null

      // Start render loop
      this.startRenderLoop()

      this.options.onSessionStart?.()
      console.log('[ARSession] Session started successfully')
      
      return true
    } catch (error) {
      console.error('[ARSession] Failed to start session:', error)
      this.state.error = error instanceof Error ? error.message : 'Failed to start AR session'
      this.options.onError?.(error instanceof Error ? error : new Error('Session start failed'))
      return false
    }
  }

  /**
   * Load a model for placement
   */
  async loadModel(modelUrl: string): Promise<void> {
    this.state.currentModelUrl = modelUrl
    
    // In a real implementation, this would create/position the model element
    // For now, we just store the URL for placement
    console.log('[ARSession] Model loaded:', modelUrl)
  }

  /**
   * Place the loaded model at the current hit test location
   */
  placeModel(): PlacedObject | null {
    if (!this.state.currentModelUrl) {
      console.warn('[ARSession] No model loaded to place')
      return null
    }

    // Get last known hit test position (would be tracked during render loop)
    const defaultPosition: Vector3 = { x: 0, y: 0, z: -1 }
    
    const placedObject: PlacedObject = {
      id: `placed-${Date.now()}`,
      modelUrl: this.state.currentModelUrl,
      position: defaultPosition,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      placedAt: new Date(),
    }

    this.state.placedObjects.push(placedObject)
    this.state.mode = 'placed'

    this.options.onModelPlaced?.(placedObject)
    
    console.log('[ARSession] Model placed:', placedObject)
    return placedObject
  }

  /**
   * Update placed object transform
   */
  updatePlacedObject(
    objectId: string,
    updates: Partial<Pick<PlacedObject, 'position' | 'rotation' | 'scale'>>
  ): boolean {
    const object = this.state.placedObjects.find(o => o.id === objectId)
    
    if (!object) {
      return false
    }

    Object.assign(object, updates)
    return true
  }

  /**
   * Remove a placed object
   */
  removePlacedObject(objectId: string): boolean {
    const index = this.state.placedObjects.findIndex(o => o.id === objectId)
    
    if (index === -1) {
      return false
    }

    this.state.placedObjects.splice(index, 1)
    return true
  }

  /**
   * Clear all placed objects
   */
  clearPlacedObjects(): void {
    this.state.placedObjects = []
    this.state.mode = 'placing'
  }

  /**
   * End the AR session
   */
  async endSession(): Promise<void> {
    if (this.session) {
      try {
        await this.session.end()
      } catch (error) {
        console.error('[ARSession] Error ending session:', error)
      }
    }
  }

  /**
   * Take a snapshot of the current AR view
   */
  async takeSnapshot(): Promise<Blob | null> {
    // This would capture the current frame
    // Implementation depends on the rendering approach
    if (!this.session) {
      return null
    }

    // Placeholder - actual implementation would use WebGL readPixels
    // or canvas capture depending on rendering approach
    console.warn('[ARSession] Snapshot not yet implemented')
    return null
  }

  // ============================================
  // Private Methods
  // ============================================

  private startRenderLoop(): void {
    if (!this.session) return

    const render = (time: number, frame: XRFrame) => {
      if (!this.session || !this.state.isActive) return

      this.rafId = requestAnimationFrame(render)

      // Process frame
      this.processFrame(time, frame)
      this.options.onFrame?.(time, frame)
    }

    this.rafId = requestAnimationFrame(render)
  }

  private processFrame(time: number, frame: XRFrame): void {
    // Hit testing
    if (this.hitTestSource && this.localSpace) {
      const results = frame.getHitTestResults(this.hitTestSource)
      
      if (results.length > 0) {
        const result = results[0]
        const pose = result.getPose(this.localSpace)
        
        if (pose) {
          // Update reticle position
          const position: Vector3 = {
            x: pose.transform.position.x,
            y: pose.transform.position.y,
            z: pose.transform.position.z,
          }
          
          // Emit position update for UI to use
          this.updateReticlePosition(position)
        }
      }
    }
  }

  private updateReticlePosition(position: Vector3): void {
    // This would update the visual reticle element
    // Implementation depends on DOM overlay approach
  }

  private handleSessionEnd(event: Event): void {
    console.log('[ARSession] Session ended:', event)
    
    // Stop render loop
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    // Clean up
    this.session = null
    this.space = null
    this.viewerSpace = null
    this.localSpace = null
    this.hitTestSource = null

    // Update state
    this.state.isActive = false
    this.state.mode = 'viewing'

    this.options.onSessionEnd?.()
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Create and manage an AR session instance
 */
export function createARSession(options?: ARSessionOptions): ARSessionManager {
  return new ARSessionManager(options)
}

/**
 * Quick check if device supports AR
 */
export async function quickARCheck(): Promise<{
  supported: boolean
  mode: 'webxr' | 'model-viewer' | 'fallback'
}> {
  // Check WebXR first
  if (navigator.xr) {
    try {
      const webXRSupported = await navigator.xr.isSessionSupported('immersive-ar')
      if (webXRSupported) {
        return { supported: true, mode: 'webxr' }
      }
    } catch {
      // Continue to fallback checks
    }
  }

  // Check for iOS (model-viewer / Quick Look)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  if (isIOS) {
    return { supported: true, mode: 'model-viewer' }
  }

  // Fallback to 3D viewer
  return { supported: true, mode: 'fallback' }
}

/**
 * Get best AR experience URL for sharing
 */
export function getARShareUrl(
  baseUrl: string,
  modelUrl: string,
  usdzUrl?: string
): string {
  const url = new URL(baseUrl)
  
  url.searchParams.set('model', modelUrl)
  
  if (usdzUrl) {
    url.searchParams.set('ios-src', usdzUrl)
  }
  
  url.searchParams.set('ar', 'true')
  
  return url.toString()
}

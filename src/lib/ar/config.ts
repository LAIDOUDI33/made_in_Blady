// AR Configuration for AlgeriaTrade.dz B2B Platform
// Central configuration for all AR-related settings

export const arConfig = {
  // Supported AR technologies
  viewers: {
    webxr: {
      enabled: true,
      requiredFeatures: ['hit-test', 'dom-overlay'],
      optionalFeatures: ['light-estimation', 'dom-overlay'],
    },
    modelViewer: {
      enabled: true,
      attributes: {
        ar: true,
        'ar-modes': 'webxr scene-viewer quick-look',
        'ar-scale': 'auto',
        'ios-src': '',
        'ar-placement': 'floor',
        exposure: 'auto',
        'shadow-intensity': '1',
        'max-camera-orbit': 'auto auto 180deg',
        'min-camera-orbit': 'auto auto 0deg',
        interactionPrompt: 'when-focused',
        interactionPolicy: 'allow-when-focused',
      },
    },
    threejs: {
      enabled: true,
      features: ['orbit-controls', 'transform-controls', 'gltf-loader', 'draco-loader'],
    },
  },

  // Model formats supported
  modelFormats: ['glb', 'gltf', 'usdz'],

  // Quality settings
  quality: {
    maxModelSizeMB: 50,
    textureResolution: 1024,
    polygonTarget: 50000,
    maxTextureSize: 2048,
    recommendedTextureSize: 1024,
    compressionQuality: 0.85,
  },

  // Storage configuration
  storage: {
    bucket: 'ar-models',
    cdnUrl: process.env.CDN_URL || '/ar/models',
    uploadDir: process.env.AR_UPLOAD_DIR || './public/ar/models',
    thumbnailDir: process.env.AR_THUMBNAIL_DIR || './public/ar/thumbnails',
  },

  // Viewer defaults
  viewer: {
    defaultBackgroundColor: '#f8f9fa',
    defaultAutoRotateSpeed: 1.5,
    defaultCameraPosition: { x: 0, y: 1, z: 3 },
    defaultCameraTarget: { x: 0, y: 0, z: 0 },
    fov: 45,
    nearPlane: 0.01,
    farPlane: 1000,
    shadowMapSize: 2048,
    enableShadows: true,
    enableFog: false,
    fogColor: '#f5f5f5',
    fogDensity: 0.02,
  },

  // AR Session settings
  session: {
    defaultPlacementMode: 'floor',
    hitTestRadius: 0.05,
    placementReticleSize: 0.1,
    enableLightEstimation: true,
    enablePlaneDetection: true,
    enableVerticalPlanes: false,
  },

  // Snapshot/Share settings
  snapshot: {
    format: 'png',
    quality: 1,
    includeWatermark: true,
    watermarkText: 'AlgeriaTrade.dz - AR Showroom',
    watermarkPosition: 'bottom-right',
    maxSnapshotsPerUser: 50,
  },

  // Optimization pipeline settings
  optimization: {
    enableDracoCompression: true,
    generateLODs: false,
    compressTextures: true,
    removeUnusedMaterials: true,
    mergeMeshes: true,
    centerModel: true,
    normalizeScale: true,
    targetFormat: 'glb',
  },

  // Feature flags
  features: {
    enableAnalytics: true,
    enableHotspots: true,
    enableAnimations: true,
    enableMaterialVariations: true,
    enableMeasurements: false,
    enableSharing: true,
    enableFullscreen: true,
  },
}

// Type exports
export type ARModelFormat = 'glb' | 'gltf' | 'usdz'
export type ARPlacementMode = 'floor' | 'wall' | 'ceiling' | 'horizontal' | 'vertical' | 'any'

// Browser capability detection result
export interface ARCapabilityResult {
  webXRSupported: boolean
  modelViewerSupported: boolean
  threeJSSupported: boolean
  recommendedViewer: 'webxr' | 'model-viewer' | 'threejs'
  reasons: string[]
}

/**
 * Detect browser AR capabilities
 */
export async function detectARCapabilities(): Promise<ARCapabilityResult> {
  const reasons: string[] = []
  
  let webXRSupported = false
  let modelViewerSupported = false
  let threeJSSupported = false

  // Check WebXR support
  if (typeof navigator !== 'undefined' && 'xr' in navigator) {
    try {
      webXRSupported = await (navigator as any).xr?.isSessionSupported('immersive-ar')
      if (!webXRSupported) {
        reasons.push('WebXR immersive-ar not supported')
      }
    } catch {
      reasons.push('WebXR API error')
    }
  } else {
    reasons.push('WebXR API not available')
  }

  // Check model-viewer support (custom element)
  if (typeof customElements !== 'undefined') {
    modelViewerSupported = customElements.get('model-viewer') !== undefined ||
      document.createElement('model-viewer').constructor.name === 'ModelViewerElement'
    if (!modelViewerSupported) {
      // Will be loaded via import
      modelViewerSupported = true
    }
  }

  // Check WebGL support (for Three.js)
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    threeJSSupported = !!gl
    if (!threeJSSupported) {
      reasons.push('WebGL not supported')
    }
  }

  // Determine best viewer
  let recommendedViewer: 'webxr' | 'model-viewer' | 'threejs' = 'threejs'
  
  if (webXRSupported) {
    recommendedViewer = 'webxr'
  } else if (modelViewerSupported) {
    recommendedViewer = 'model-viewer'
  }

  return {
    webXRSupported,
    modelViewerSupported,
    threeJSSupported,
    recommendedViewer,
    reasons,
  }
}

export default arConfig

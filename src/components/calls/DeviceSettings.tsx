'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Camera, 
  Mic, 
  Speaker, 
  Video, 
  Volume2,
  Check,
  RefreshCw,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ============================================
// Type Definitions
// ============================================

interface MediaDeviceInfoWithLabel extends MediaDeviceInfo {
  label: string // Always present after getUserMedia permission
}

interface DeviceSettingsProps {
  onSettingsChange?: (settings: DeviceSettingsState) => void
  className?: string
}

export interface DeviceSettingsState {
  cameraId: string | null
  microphoneId: string | null
  speakerId: string | null
  videoEnabled: boolean
  audioEnabled: boolean
  noiseSuppression: boolean
  echoCancellation: boolean
  autoGainControl: boolean
  hdVideo: boolean
}

const defaultSettings: DeviceSettingsState = {
  cameraId: null,
  microphoneId: null,
  speakerId: null,
  videoEnabled: true,
  audioEnabled: true,
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  hdVideo: true,
}

// ============================================
// Main Component
// ============================================

export default function DeviceSettings({ 
  onSettingsChange, 
  className = '' 
}: DeviceSettingsProps) {
  const [settings, setSettings] = useState<DeviceSettingsState>(defaultSettings)
  const [devices, setDevices] = useState<{
    cameras: MediaDeviceInfoWithLabel[]
    microphones: MediaDeviceInfoWithLabel[]
    speakers: MediaDeviceInfoWithLabel[]
  }>({
    cameras: [],
    microphones: [],
    speakers: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Request permissions and enumerate devices
  const requestPermissions = async () => {
    setIsLoading(true)

    try {
      // Request both audio and video permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })

      // Store stream for preview and cleanup
      streamRef.current = stream

      // Show video preview if element available
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Set up audio level monitoring
      setupAudioMonitoring(stream)

      setHasPermission(true)

      // Enumerate devices (now that we have permission, labels will be populated)
      await enumerateDevices()

    } catch (error) {
      console.error('[DeviceSettings] Permission error:', error)
      
      // Try with just audio
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        })
        
        streamRef.current = audioOnlyStream
        setupAudioMonitoring(audioOnlyStream)
        setHasPermission(true)
        await enumerateDevice()
      } catch (audioError) {
        console.error('[DeviceSettings] Audio permission also denied:', audioError)
        setHasPermission(false)
      }
    }

    setIsLoading(false)
  }

  // Enumerate all devices
  const enumerateDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      
      const cameras = allDevices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({ ...d, label: d.label || `Camera ${devices.cameras.length + 1}` }))
      
      const microphones = allDevices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({ ...d, label: d.label || `Microphone ${devices.microphones.length + 1}` }))
      
      const speakers = allDevices
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({ ...d, label: d.label || `Speaker ${devices.speakers.length + 1}` }))

      setDevices({ cameras, microphones, speakers })

      // Auto-select first devices if not already selected
      setSettings(prev => ({
        ...prev,
        cameraId: prev.cameraId || (cameras[0]?.deviceId || null),
        microphoneId: prev.microphoneId || (microphones[0]?.deviceId || null),
        speakerId: prev.speakerId || (speakers[0]?.deviceId || null),
      }))
    } catch (error) {
      console.error('[DeviceSettings] Error enumerating devices:', error)
    }
  }

  // Fallback for when only audio permission is granted
  const enumerateDevice = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      
      const microphones = allDevices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({ ...d, label: d.label || `Microphone ${devices.microphones.length + 1}` }))
      
      const speakers = allDevices
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({ ...d, label: d.label || `Speaker ${devices.speakers.length + 1}` }))

      setDevices(prev => ({
        ...prev,
        microphones,
        speakers,
      }))

      setSettings(prev => ({
        ...prev,
        microphoneId: prev.microphoneId || (microphones[0]?.deviceId || null),
        speakerId: prev.speakerId || (speakers[0]?.deviceId || null),
      }))
    } catch (error) {
      console.error('[DeviceSettings] Error enumerating devices:', error)
    }
  }

  // Set up audio level monitoring
  const setupAudioMonitoring = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      
      source.connect(analyser)
      // Don't connect to destination to avoid feedback
      analyserRef.current = analyser

      // Start monitoring loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
          setAudioLevel(average / 255 * 100)
          animationFrameRef.current = requestAnimationFrame(updateLevel)
        }
      }
      
      updateLevel()
    } catch (error) {
      console.error('[DeviceSettings] Error setting up audio monitoring:', error)
    }
  }

  // Update settings handler
  const updateSetting = <K extends keyof DeviceSettingsState>(
    key: K,
    value: DeviceSettingsState[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value }
      onSettingsChange?.(newSettings)
      return newSettings
    })
  }

  // Apply settings and get new stream
  const applySettings = async () => {
    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: settings.audioEnabled ? {
          deviceId: settings.microphoneId ? { exact: settings.microphoneId } : undefined,
          noiseSuppression: settings.noiseSuppression,
          echoCancellation: settings.echoCancellation,
          autoGainControl: settings.autoGainControl,
        } : false,
        video: settings.videoEnabled ? {
          deviceId: settings.cameraId ? { exact: settings.cameraId } : undefined,
          width: settings.hdVideo ? { ideal: 1280 } : { ideal: 640 },
          height: settings.hdVideo ? { ideal: 720 } : { ideal: 360 },
        } : false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setupAudioMonitoring(stream)
      
      console.log('[DeviceSettings] Settings applied successfully')
    } catch (error) {
      console.error('[DeviceSettings] Error applying settings:', error)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Call Settings & Devices
              </CardTitle>
              <CardDescription>
                Configure your audio/video devices for calls
              </CardDescription>
            </div>
            {!hasPermission ? (
              <Button onClick={requestPermissions} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                Enable Camera & Microphone
              </Button>
            ) : (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="w-3 h-3 mr-1" />
                Permissions Granted
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Preview Section */}
      {hasPermission && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Video preview */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Camera Preview</Label>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${!settings.videoEnabled ? 'hidden' : ''}`}
                  />
                  {!settings.videoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <Video className="w-12 h-12 text-gray-600" />
                      <span className="ml-2 text-gray-500">Camera Off</span>
                    </div>
                  )}
                  
                  {/* HD badge */}
                  {settings.hdVideo && settings.videoEnabled && (
                    <Badge variant="secondary" className="absolute top-2 left-2">
                      HD
                    </Badge>
                  )}
                </div>
              </div>

              {/* Audio level indicator */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Microphone Level</Label>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 h-[168px] flex flex-col items-center justify-center">
                  {/* Audio level bars */}
                  <div className="flex items-end gap-1 h-24 w-full max-w-xs">
                    {[...Array(20)].map((_, i) => {
                      const barHeight = Math.max(
                        4,
                        (audioLevel / 100) * 96 * 
                          (0.5 + Math.sin(i * 0.5 + Date.now() * 0.005) * 0.5)
                      )
                      
                      // Color based on level
                      let colorClass = 'bg-green-400'
                      if (audioLevel > 80) colorClass = 'bg-red-400'
                      else if (audioLevel > 60) colorClass = 'bg-yellow-400'
                      
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm transition-all duration-75 ${colorClass}`}
                          style={{ height: `${barHeight}%` }}
                        />
                      )
                    })}
                  </div>
                  
                  <span className="text-sm text-muted-foreground mt-3">
                    {settings.audioEnabled ? `${Math.round(audioLevel)}%` : 'Muted'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Camera selection */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-muted-foreground" />
              <Label>Camera</Label>
            </div>
            
            <Select
              value={settings.cameraId || ''}
              onValueChange={(value) => updateSetting('cameraId', value)}
              disabled={!hasPermission || devices.cameras.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select camera..." />
              </SelectTrigger>
              <SelectContent>
                {devices.cameras.map((camera) => (
                  <SelectItem key={camera.deviceId} value={camera.deviceId}>
                    {camera.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-between">
              <Label htmlFor="video-toggle" className="text-sm">Enable Video</Label>
              <Switch
                id="video-toggle"
                checked={settings.videoEnabled}
                onCheckedChange={(checked) => updateSetting('videoEnabled', checked)}
                disabled={!hasPermission}
              />
            </div>
          </CardContent>
        </Card>

        {/* Microphone selection */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-muted-foreground" />
              <Label>Microphone</Label>
            </div>
            
            <Select
              value={settings.microphoneId || ''}
              onValueChange={(value) => updateSetting('microphoneId', value)}
              disabled={!hasPermission || devices.microphones.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select microphone..." />
              </SelectTrigger>
              <SelectContent>
                {devices.microphones.map((mic) => (
                  <SelectItem key={mic.deviceId} value={mic.deviceId}>
                    {mic.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-between">
              <Label htmlFor="audio-toggle" className="text-sm">Enable Audio</Label>
              <Switch
                id="audio-toggle"
                checked={settings.audioEnabled}
                onCheckedChange={(checked) => updateSetting('audioEnabled', checked)}
                disabled={!hasPermission}
              />
            </div>
          </CardContent>
        </Card>

        {/* Speaker selection */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Speaker className="w-4 h-4 text-muted-foreground" />
              <Label>Speaker</Label>
            </div>
            
            <Select
              value={settings.speakerId || ''}
              onValueChange={(value) => updateSetting('speakerId', value)}
              disabled={!hasPermission || devices.speakers.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select speaker..." />
              </SelectTrigger>
              <SelectContent>
                {devices.speakers.map((speaker) => (
                  <SelectItem key={speaker.deviceId} value={speaker.deviceId}>
                    {speaker.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {devices.speakers.length} output{devices.speakers.length !== 1 ? 's' : ''} available
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advanced Audio Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Noise Suppression */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Noise Suppression</Label>
                <p className="text-xs text-muted-foreground">
                  Reduce background noise
                </p>
              </div>
              <Switch
                checked={settings.noiseSuppression}
                onCheckedChange={(checked) => updateSetting('noiseSuppression', checked)}
              />
            </div>

            {/* Echo Cancellation */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Echo Cancellation</Label>
                <p className="text-xs text-muted-foreground">
                  Prevent echo in calls
                </p>
              </div>
              <Switch
                checked={settings.echoCancellation}
                onCheckedChange={(checked) => updateSetting('echoCancellation', checked)}
              />
            </div>

            {/* Auto Gain Control */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Gain Control</Label>
                <p className="text-xs text-muted-foreground">
                  Normalize volume levels
                </p>
              </div>
              <Switch
                checked={settings.autoGainControl}
                onCheckedChange={(checked) => updateSetting('autoGainControl', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Video Quality */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>HD Video Quality</Label>
                <p className="text-xs text-muted-foreground">
                  Higher quality uses more bandwidth
                </p>
              </div>
              <Switch
                checked={settings.hdVideo}
                onCheckedChange={(checked) => updateSetting('hdVideo', checked)}
              />
            </div>
            
            {settings.hdVideo && (
              <div className="pl-4 border-l-2 border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  Resolution: 1280×720 (HD)
                </p>
                <p className="text-xs text-muted-foreground">
                  Recommended bandwidth: 2+ Mbps
                </p>
              </div>
            )}
            
            {!settings.hdVideo && (
              <div className="pl-4 border-l-2 border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  Resolution: 640×360 (SD)
                </p>
                <p className="text-xs text-muted-foreground">
                  Recommended bandwidth: 512+ Kbps
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Apply button */}
      {hasPermission && (
        <div className="flex justify-end">
          <Button onClick={applySettings}>
            <Check className="w-4 h-4 mr-2" />
            Apply Settings
          </Button>
        </div>
      )}
    </div>
  )
}

// Export the settings type for use elsewhere
export type { DeviceSettingsState }

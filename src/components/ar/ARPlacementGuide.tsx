'use client'

import React, { useState } from 'react'
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Smartphone,
  Move,
  RotateCcw,
  ZoomIn,
  Scan,
  Lightbulb,
  CheckCircle2,
  Hand,
  Box
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ============================================
// Types
// ============================================

interface ARPlacementGuideProps {
  onClose: () => void
  onComplete?: () => void
  className?: string
}

interface GuideStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  tips?: string[]
  illustration?: 'scan' | 'place' | 'interact' | 'capture'
}

// ============================================
// Guide Steps Data
// ============================================

const guideSteps: GuideStep[] = [
  {
    id: 1,
    title: 'Find a Flat Surface',
    description: 'Move your device slowly to scan your surroundings. The AR system will detect flat surfaces like floors, tables, or countertops.',
    icon: <Scan className="w-8 h-8" />,
    tips: [
      'Ensure good lighting for better surface detection',
      'Move slowly and steadily',
      'Avoid reflective surfaces like mirrors',
      'Point your camera at the floor or table level'
    ],
    illustration: 'scan'
  },
  {
    id: 2,
    title: 'Place the Product',
    description: 'Tap on a detected surface to place the product. You can drag to reposition it or use pinch gestures to resize.',
    icon: <Hand className="w-8 h-8" />,
    tips: [
      'Tap once to place the product',
      'Drag to move the product around',
      'Pinch with two fingers to scale up/down',
      'Use two fingers to rotate the product'
    ],
    illustration: 'place'
  },
  {
    id: 3,
    title: 'Explore in 3D',
    description: 'Walk around the placed product to see it from different angles. Use gestures to rotate, zoom, and examine details.',
    icon: <Box className="w-8 h-8" />,
    tips: [
      'Walk around to see all sides',
      'Get closer to see fine details',
      'Try viewing from eye-level perspective',
      'Check how it fits with surrounding objects'
    ],
    illustration: 'interact'
  },
  {
    id: 4,
    title: 'Capture & Share',
    description: 'Take a snapshot of the product in your space. Save it to your gallery or share with friends and colleagues.',
    icon: <Smartphone className="w-8 h-8" />,
    tips: [
      'Use the capture button to take photos',
      'Share directly to social media',
      'Save images for later reference',
      'Compare multiple products side by side'
    ],
    illustration: 'capture'
  }
]

const gestureTips = [
  { gesture: 'One finger tap', action: 'Place or select object' },
  { gesture: 'One finger drag', action: 'Move object on surface' },
  { gesture: 'Two finger pinch', action: 'Scale object (zoom)' },
  { gesture: 'Two finger rotate', action: 'Rotate object' },
  { gesture: 'Two finger drag', action: 'Pan view' },
]

// ============================================
// Main Component
// ============================================

export function ARPlacementGuide({ onClose, onComplete, className = '' }: ARPlacementGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showGestures, setShowGestures] = useState(false)
  
  const step = guideSteps[currentStep]
  const isLastStep = currentStep === guideSteps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.()
      onClose()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0">
              AR Tutorial
            </Badge>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {guideSteps.length}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / guideSteps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Illustration area */}
          <div className="relative aspect-video rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
            {/* Step-specific illustration */}
            <div className="absolute inset-0 flex items-center justify-center">
              {step.illustration === 'scan' && (
                <div className="relative">
                  <Scan className="w-24 h-24 text-emerald-500 animate-pulse" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-400 rounded-full animate-pulse delay-150" />
                </div>
              )}
              
              {step.illustration === 'place' && (
                <div className="relative">
                  <Box className="w-20 h-20 text-purple-500" />
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-purple-300 rounded-full opacity-50" />
                  <Hand className="absolute -top-4 -right-4 w-10 h-10 text-orange-400 animate-bounce" />
                </div>
              )}
              
              {step.illustration === 'interact' && (
                <div className="relative">
                  <Box className="w-20 h-20 text-teal-500" />
                  <RotateCcw className="absolute -top-3 -left-3 w-8 h-8 text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
                  <ZoomIn className="absolute -bottom-3 -right-3 w-7 h-7 text-green-400" />
                </div>
              )}
              
              {step.illustration === 'capture' && (
                <div className="relative">
                  <Smartphone className="w-20 h-20 text-indigo-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-12 h-12 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm" />
            <div className="absolute bottom-4 right-4 w-16 h-10 rounded-lg bg-white/30 backdrop-blur-sm shadow-sm" />
          </div>

          {/* Step info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-emerald-600">
                {step.icon}
              </div>
              
              <div className="flex-1 space-y-1">
                <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </div>

            {/* Tips */}
            {step.tips && step.tips.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
                  <Lightbulb className="w-4 h-4" />
                  Tips for best experience
                </div>
                
                <ul className="space-y-1.5">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gesture guide toggle (shown on last step) */}
            {isLastStep && (
              <button
                onClick={() => setShowGestures(!showGestures)}
                className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Gesture Reference</span>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showGestures ? 'rotate-90' : ''}`} />
                </div>
              </button>
            )}

            {/* Gesture list */}
            {showGestures && (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {gestureTips.map((item, index) => (
                  <div key={index} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">{item.gesture}</span>
                    <span className="text-sm text-gray-500">{item.action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="text-gray-600"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-gray-500"
          >
            Skip tutorial
          </Button>

          <Button
            onClick={handleNext}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLastStep ? (
              <>
                Get Started
                <CheckCircle2 className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pb-4">
          {guideSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-6 bg-emerald-500'
                  : index < currentStep
                    ? 'bg-emerald-300'
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}

export default ARPlacementGuide

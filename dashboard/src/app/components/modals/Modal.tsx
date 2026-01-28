'use client'

import { useEffect, ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'lg' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
  }[maxWidth]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-xl"
        onClick={onClose}
      />

      <div className={`relative w-full ${maxWidthClass} max-h-[90vh] animate-in fade-in zoom-in-95 duration-300`}>
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/10 overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-200/60 flex items-center justify-between shrink-0 bg-gray-50/50">
            <h2 className="text-[17px] font-semibold text-gray-900 tracking-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded-full transition-all duration-200 active:scale-95"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-5 sm:px-6 py-5 overflow-y-auto flex-1 bg-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
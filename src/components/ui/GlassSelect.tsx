'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
    value: string
    label: string
    icon?: React.ReactNode | string
}

interface GlassSelectProps {
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function GlassSelect({
    value,
    onChange,
    options,
    placeholder = 'Selecciona...',
    className = '',
    disabled = false,
}: GlassSelectProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedOption = options.find((o) => o.value === value)

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className={`w-full text-left px-4 py-3 bg-white/[0.04] backdrop-blur-sm border rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between
          ${open ? 'border-yellow-500/40 bg-white/[0.06] shadow-[0_0_0_3px_rgba(255,199,0,0.08)]' : 'border-white/10 hover:border-white/20'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption ? (
                        <>
                            {selectedOption.icon && <span className="flex-shrink-0 text-base">{selectedOption.icon}</span>}
                            <span className="text-white truncate">{selectedOption.label}</span>
                        </>
                    ) : (
                        <span className="text-white/40">{placeholder}</span>
                    )}
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-white/40 transition-transform duration-200 ${open ? 'rotate-180 text-yellow-500' : ''
                        }`}
                />
            </button>

            {open && (
                <div className="absolute z-[100] top-full left-0 right-0 mt-2 p-1.5 bg-[#0B162F]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 animate-scale-in origin-top">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                        {options.map((option) => {
                            const isSelected = option.value === value
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value)
                                        setOpen(false)
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-all duration-200
                    ${isSelected ? 'bg-yellow-600/10 text-yellow-500' : 'text-white/80 hover:text-white hover:bg-white/10'}
                  `}
                                >
                                    <div className="flex items-center gap-2.5">
                                        {option.icon && <span className="text-base">{option.icon}</span>}
                                        {option.label}
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-yellow-500" />}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

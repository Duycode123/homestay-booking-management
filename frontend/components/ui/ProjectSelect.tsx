'use client'

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'

type SelectOption = {
  value: string
  label: ReactNode
  disabled: boolean
}

type ProjectSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'multiple' | 'size'> & {
  menuClassName?: string
}

export default function ProjectSelect({
  children,
  value,
  defaultValue,
  onChange,
  className = '',
  menuClassName = '',
  disabled,
  id,
  name,
  required,
  'aria-label': ariaLabel,
  ...selectProps
}: ProjectSelectProps) {
  const options = useMemo(() => collectOptions(children), [children])
  const [internalValue, setInternalValue] = useState(() => normalizeValue(defaultValue) || options[0]?.value || '')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0, width: 240, openUpward: false })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)
  const selectedValue = value === undefined ? internalValue : normalizeValue(value)
  const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0]

  const updateMenuPosition = () => {
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const estimatedMenuHeight = Math.min(320, Math.max(56, options.length * 46 + 12))
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < estimatedMenuHeight + 16 && rect.top > estimatedMenuHeight
    setMenuPosition({
      left: Math.max(12, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 220) - 12)),
      top: openUpward ? Math.max(12, rect.top - estimatedMenuHeight - 8) : rect.bottom + 8,
      width: Math.max(rect.width, 220),
      openUpward,
    })
  }

  const openMenu = () => {
    if (disabled) return
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selectedValue))
    setHighlightedIndex(selectedIndex)
    updateMenuPosition()
    setIsOpen(true)
  }

  const selectOption = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue)

    const nativeSelect = selectRef.current
    if (nativeSelect) {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
      nativeSetter?.call(nativeSelect, nextValue)
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }))
    }
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) setIsOpen(false)
    }
    const closeOnViewportChange = () => setIsOpen(false)

    document.addEventListener('mousedown', closeOnOutsideClick)
    window.addEventListener('resize', closeOnViewportChange)
    window.addEventListener('scroll', closeOnViewportChange, true)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      window.removeEventListener('resize', closeOnViewportChange)
      window.removeEventListener('scroll', closeOnViewportChange, true)
    }
  }, [isOpen])

  const moveHighlight = (direction: 1 | -1) => {
    if (options.length === 0) return
    let nextIndex = highlightedIndex
    do {
      nextIndex = (nextIndex + direction + options.length) % options.length
    } while (options[nextIndex]?.disabled && nextIndex !== highlightedIndex)
    setHighlightedIndex(nextIndex)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) openMenu()
      else moveHighlight(event.key === 'ArrowDown' ? 1 : -1)
      return
    }
    if ((event.key === 'Enter' || event.key === ' ') && isOpen) {
      event.preventDefault()
      const option = options[highlightedIndex]
      if (option && !option.disabled) selectOption(option.value)
    }
  }

  return (
    <>
      <select
        {...selectProps}
        ref={selectRef}
        name={name}
        required={required}
        disabled={disabled}
        value={selectedValue}
        onChange={onChange}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        {children}
      </select>

      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        className={[
          'inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container-low px-4 text-left text-sm font-semibold text-on-surface outline-none transition-all duration-200',
          'hover:border-[#cfb99f] hover:bg-white focus:border-[#b88857] focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,136,87,0.10)]',
          'disabled:cursor-not-allowed disabled:opacity-55',
          className,
        ].join(' ')}
      >
        <span className="min-w-0 flex-1 truncate">{selectedOption?.label ?? 'Chọn'}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={['h-4 w-4 shrink-0 text-on-surface-variant transition-transform duration-200', isOpen ? 'rotate-180' : ''].join(' ')}>
          <path d="m7 9.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          aria-label={ariaLabel}
          className={[
            'fixed z-[220] max-h-80 overflow-y-auto rounded-2xl border border-[#ded3c5] bg-white p-1.5 shadow-[0_22px_65px_rgba(29,49,41,0.20)]',
            menuClassName,
          ].join(' ')}
          style={{ left: menuPosition.left, top: menuPosition.top, width: menuPosition.width }}
          data-placement={menuPosition.openUpward ? 'top' : 'bottom'}
        >
          {options.map((option, index) => {
            const selected = option.value === selectedValue
            const highlighted = index === highlightedIndex
            return (
              <button
                key={`${option.value}-${index}`}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectOption(option.value)}
                className={[
                  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                  selected ? 'bg-[#edf4f0] font-bold text-secondary' : highlighted ? 'bg-[#faf5ee] text-on-surface' : 'font-medium text-on-surface',
                  option.disabled ? 'cursor-not-allowed opacity-40' : '',
                ].join(' ')}
              >
                <span>{option.label}</span>
                {selected && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-white">
                    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-3 w-3"><path d="m4 8 2.4 2.4L12 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                )}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </>
  )
}

function collectOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const element = child as ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>
    if (element.type === 'option') {
      options.push({
        value: String(element.props.value ?? ''),
        label: element.props.children,
        disabled: Boolean(element.props.disabled),
      })
      return
    }
    if (element.type === 'optgroup') {
      options.push(...collectOptions(element.props.children))
    }
  })
  return options
}

function normalizeValue(value: SelectHTMLAttributes<HTMLSelectElement>['value'] | SelectHTMLAttributes<HTMLSelectElement>['defaultValue']) {
  if (Array.isArray(value)) return String(value[0] ?? '')
  return value == null ? '' : String(value)
}

import type { SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  onValueChange?: (value: string) => void
}

function Select({ className = '', onValueChange, onChange, children, ...props }: SelectProps) {
  return (
    <select
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      onChange={event => {
        onChange?.(event)
        onValueChange?.(event.target.value)
      }}
      {...props}
    >
      {children}
    </select>
  )
}

export { Select }

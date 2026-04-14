import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Input } from './ui/input'
import { Select } from './ui/select'

export type SalaryCurrency = 'INR' | 'USD' | 'EUR'
export type SalaryPeriod = 'yearly' | 'monthly' | 'hourly'

export type SalaryValue = {
  amount: number | null
  currency: SalaryCurrency
  period: SalaryPeriod
}

type SalaryInputProps = {
  value: SalaryValue
  onChange: (value: SalaryValue) => void
  className?: string
  amountPlaceholder?: string
  showReset?: boolean
}

const CURRENCY_OPTIONS: ReadonlyArray<{ code: SalaryCurrency; label: string }> = [
  { code: 'INR', label: 'INR (₹)' },
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
]

const PERIOD_OPTIONS: ReadonlyArray<SalaryPeriod> = ['yearly', 'monthly', 'hourly']

export function detectLocaleCurrency(): SalaryCurrency {
  const locale = (typeof navigator !== 'undefined' && navigator.language) || 'en-US'
  const region = locale.split('-')[1]?.toUpperCase()

  if (region === 'IN') return 'INR'
  if (region && ['DE', 'FR', 'ES', 'IT', 'NL', 'PT', 'BE', 'IE', 'FI', 'AT', 'LU', 'GR', 'CY', 'MT', 'SI', 'SK', 'LV', 'LT', 'EE'].includes(region)) {
    return 'EUR'
  }

  return 'USD'
}

export function parseInput(value: string): number | null {
  if (!value) return null

  const digitsOnly = value.replace(/[^\d]/g, '')
  if (!digitsOnly) return null

  const parsed = Number.parseInt(digitsOnly, 10)
  if (!Number.isFinite(parsed)) return null
  if (parsed < 0) return 0

  return Math.min(parsed, Number.MAX_SAFE_INTEGER)
}

export function formatCurrency(amount: number | null, currency: SalaryCurrency): string {
  if (amount === null || !Number.isFinite(amount)) return ''

  const locale = currency === 'INR' ? 'en-IN' : 'en-US'
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount)
}

const defaultSalaryValue = (): SalaryValue => ({
  amount: null,
  currency: detectLocaleCurrency(),
  period: 'yearly',
})

export default function SalaryInput({
  value,
  onChange,
  className = '',
  amountPlaceholder = 'Enter amount',
  showReset = true,
}: SalaryInputProps) {
  const safeValue = value || defaultSalaryValue()
  const [amountInput, setAmountInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [amountError, setAmountError] = useState('')

  const formattedAmount = useMemo(() => formatCurrency(safeValue.amount, safeValue.currency), [safeValue.amount, safeValue.currency])

  useEffect(() => {
    if (!isFocused) {
      setAmountInput(formattedAmount)
    }
  }, [formattedAmount, isFocused])

  const updateValue = (nextValue: Partial<SalaryValue>) => {
    onChange({
      ...safeValue,
      ...nextValue,
    })
  }

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value
    const cleaned = rawValue.replace(/[^\d]/g, '')

    setAmountInput(cleaned)

    const parsed = parseInput(cleaned)
    if (cleaned.length > 0 && parsed === null) {
      setAmountError('Enter a valid amount')
      return
    }

    setAmountError('')
    updateValue({ amount: parsed })
  }

  const handleAmountBlur = () => {
    setIsFocused(false)
    setAmountInput(formatCurrency(safeValue.amount, safeValue.currency))
  }

  const resetValue = () => {
    setAmountError('')
    setAmountInput('')
    onChange(defaultSalaryValue())
  }

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={amountPlaceholder}
          value={amountInput}
          onFocus={() => setIsFocused(true)}
          onBlur={handleAmountBlur}
          onChange={handleAmountChange}
          aria-label="Salary amount"
        />

        <Select
          value={safeValue.currency}
          onValueChange={value => updateValue({ currency: value as SalaryCurrency })}
          aria-label="Salary currency"
        >
          {CURRENCY_OPTIONS.map(option => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={safeValue.period}
          onValueChange={value => updateValue({ period: value as SalaryPeriod })}
          aria-label="Salary period"
        >
          {PERIOD_OPTIONS.map(period => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        <div>
          {amountError ? <p className="text-rose-600">{amountError}</p> : <p className="text-slate-500">Amount is stored as a raw number.</p>}
        </div>
        {showReset ? (
          <button type="button" onClick={resetValue} className="text-slate-500 underline hover:text-slate-700">
            Clear
          </button>
        ) : null}
      </div>
    </div>
  )
}

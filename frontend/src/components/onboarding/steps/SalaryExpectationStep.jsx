import SalaryInput, { detectLocaleCurrency } from '../../SalaryInput'

export default function SalaryExpectationStep({ formData, setFormData }) {
  const currentSalaryValue = formData.current_salary || {
    amount: null,
    currency: detectLocaleCurrency(),
    period: 'yearly',
  }

  const expectedSalaryValue = formData.salary_expectation || {
    amount: null,
    currency: detectLocaleCurrency(),
    period: 'yearly',
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Current CTC (Cost To Company)</h3>
        <SalaryInput
          value={currentSalaryValue}
          onChange={salary => setFormData(prev => ({ ...prev, current_salary: salary }))}
          amountPlaceholder="e.g., 1500000"
        />
        <p className="text-sm text-gray-500 mt-2">Your current annual salary including all benefits</p>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Expected Minimum Salary</h3>
        <SalaryInput
          value={expectedSalaryValue}
          onChange={salary => setFormData(prev => ({ ...prev, salary_expectation: salary }))}
          amountPlaceholder="e.g., 1500000"
        />
        <p className="text-sm text-gray-500 mt-2">Minimum salary you expect in your next role. Leave blank if you prefer not to specify.</p>
      </div>
    </div>
  )
}

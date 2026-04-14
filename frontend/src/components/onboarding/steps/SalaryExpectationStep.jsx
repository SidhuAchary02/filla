import SalaryInput, { detectLocaleCurrency } from '../../SalaryInput'

export default function SalaryExpectationStep({ formData, setFormData }) {
  const salaryValue = formData.salary_expectation || {
    amount: null,
    currency: detectLocaleCurrency(),
    period: 'yearly',
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Minimum Salary Expectation</h3>
      <SalaryInput
        value={salaryValue}
        onChange={salary => setFormData(prev => ({ ...prev, salary_expectation: salary }))}
      />
      <p className="text-sm text-gray-500">Leave blank if you prefer not to specify. Currency and period help keep salary expectations globally clear.</p>
    </div>
  )
}

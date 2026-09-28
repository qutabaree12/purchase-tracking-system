import Select from './Select'

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required,
  placeholder,
  options,
  disabled,
  min,
  step,
}) {
  const id = `field-${name}`

  const renderInput = () => {
    if (type === 'select' && options) {
      return (
        <Select
          name={name}
          value={value}
          onChange={onChange}
          options={options}
          disabled={disabled}
          error={!!error}
          placeholder={placeholder || 'Sélectionner...'}
        />
      )
    }

    if (type === 'textarea') {
      return (
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          rows={3}
          required={required}
        />
      )
    }

    return (
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        step={step}
        className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        required={required}
      />
    )
  }

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

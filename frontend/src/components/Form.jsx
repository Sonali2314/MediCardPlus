import React from 'react';

export const FormGroup = ({ children, className = "" }) => {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};

export const FormLabel = ({ htmlFor, children, required = false, className = "" }) => {
  return (
    <label 
      htmlFor={htmlFor} 
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export const FormInput = ({ 
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  error = null,
  className = ""
}) => {
  const inputStyles = `
    w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
    focus:outline-none focus:ring-blue-500 focus:border-blue-500
    ${error ? 'border-red-300' : 'border-gray-300'}
    ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}
    ${className}
  `;
  
  return (
    <>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={inputStyles}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </>
  );
};

export const FormSelect = ({
  id,
  name,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  error = null,
  placeholder = "Select an option",
  className = ""
}) => {
  const selectStyles = `
    w-full px-3 py-2 border rounded-md shadow-sm
    focus:outline-none focus:ring-blue-500 focus:border-blue-500
    ${error ? 'border-red-300' : 'border-gray-300'}
    ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}
    ${className}
  `;
  
  return (
    <>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={selectStyles}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </>
  );
};

export const FormTextarea = ({
  id,
  name,
  value,
  onChange,
  placeholder = "",
  rows = 3,
  required = false,
  disabled = false,
  error = null,
  className = ""
}) => {
  const textareaStyles = `
    w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
    focus:outline-none focus:ring-blue-500 focus:border-blue-500
    ${error ? 'border-red-300' : 'border-gray-300'}
    ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}
    ${className}
  `;
  
  return (
    <>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        className={textareaStyles}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </>
  );
};

export const FormCheckbox = ({
  id,
  name,
  checked,
  onChange,
  label,
  disabled = false,
  error = null,
  className = ""
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      {label && (
        <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
          {label}
        </label>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export const FormRadio = ({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  disabled = false,
  className = ""
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        id={id}
        name={name}
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
      />
      {label && (
        <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
          {label}
        </label>
      )}
    </div>
  );
};

export const FormRadioGroup = ({
  name,
  value,
  onChange,
  options = [],
  legend,
  error = null,
  className = "",
  inline = false
}) => {
  return (
    <fieldset className={className}>
      {legend && (
        <legend className="text-sm font-medium text-gray-700 mb-1">{legend}</legend>
      )}
      <div className={`space-y-2 ${inline ? 'flex space-x-4 space-y-0' : ''}`}>
        {options.map((option) => (
          <FormRadio
            key={option.value}
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            label={option.label}
            disabled={option.disabled}
          />
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </fieldset>
  );
};

export const FormFileUpload = ({
  id,
  name,
  onChange,
  accept,
  required = false,
  label = "Upload a file",
  error = null,
  className = ""
}) => {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="cursor-pointer flex justify-center items-center w-full px-6 py-3 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600">
            <span className="relative bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
              {label}
            </span>
            <input
              id={id}
              name={name}
              type="file"
              className="sr-only"
              onChange={onChange}
              accept={accept}
              required={required}
            />
          </div>
          <p className="text-xs text-gray-500">
            Click to upload or drag and drop
          </p>
        </div>
      </label>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

const Form = ({ children, onSubmit, className = "" }) => {
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
};

export default Form;
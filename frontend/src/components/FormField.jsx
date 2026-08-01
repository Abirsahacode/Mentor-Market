import { AlertCircle } from "lucide-react";
import { useId } from "react";

export default function FormField({
  label,
  name,
  id,
  type = "text",
  options,
  as,
  value,
  onChange,
  required,
  placeholder,
  emptyOption,
  min,
  max,
  step,
  autoComplete,
  inputMode,
  disabled,
  rows = 4,
  error,
  hint,
  className = "",
  ...inputProps
}) {
  const generatedId = useId();
  const {
    "aria-describedby": externalDescribedBy,
    "aria-invalid": externalAriaInvalid,
    ...restInputProps
  } = inputProps;
  const controlId = id || name || `field-${generatedId.replaceAll(":", "")}`;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;
  const describedBy = [externalDescribedBy, hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;
  const props = {
    ...restInputProps,
    id: controlId,
    name,
    value: value ?? "",
    onChange,
    required,
    placeholder,
    min,
    max,
    step,
    autoComplete,
    inputMode,
    disabled,
    "aria-invalid": error ? true : externalAriaInvalid,
    "aria-describedby": describedBy,
  };

  return (
    <label className={`form-field${error ? " form-field-error" : ""}${className ? ` ${className}` : ""}`} htmlFor={controlId}>
      <span>{label}{required && <em aria-hidden="true">*</em>}</span>
      {as === "textarea" ? <textarea {...props} rows={rows} /> : options ? (
        <select {...props}><option value="">{emptyOption || `Select ${label.toLowerCase()}`}</option>{options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return <option key={item.value} value={item.value}>{item.label}</option>;
        })}</select>
      ) : <input {...props} type={type} />}
      {hint && <small className="form-field-hint" id={hintId}>{hint}</small>}
      {error && <small className="form-field-message" id={errorId} role="status" aria-atomic="true"><AlertCircle size={15} aria-hidden="true" /><span>{error}</span></small>}
    </label>
  );
}

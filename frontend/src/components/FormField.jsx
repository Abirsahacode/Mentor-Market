export default function FormField({ label, name, type = "text", options, as, value, onChange, required, placeholder, min, max, step, autoComplete, inputMode }) {
  const props = { id: name, name, value: value ?? "", onChange, required, placeholder, min, max, step, autoComplete, inputMode };
  return (
    <label className="form-field" htmlFor={name}>
      <span>{label}{required && <em>*</em>}</span>
      {as === "textarea" ? <textarea {...props} rows="4" /> : options ? (
        <select {...props}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return <option key={item.value} value={item.value}>{item.label}</option>;
        })}</select>
      ) : <input {...props} type={type} />}
    </label>
  );
}

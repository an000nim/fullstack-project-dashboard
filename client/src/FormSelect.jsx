import Select from "react-select";

export default function FormSelect({
  id,
  options,
  value,
  onChange,
  searchable = false,
  required = false,
}) {
  return (
    <Select
      inputId={id}
      instanceId={id}
      classNamePrefix="form-select"
      unstyled
      options={options}
      value={
        options.find((option) => String(option.value) === String(value)) || null
      }
      onChange={(option) => onChange(option?.value ?? "")}
      isSearchable={searchable}
      required={required}
      placeholder={
        searchable ? "Выберите или найдите проект" : "Выберите значение"
      }
      noOptionsMessage={() => "Ничего не найдено"}
      maxMenuHeight={200}
      menuPlacement="auto"
      menuPosition="fixed"
      menuPortalTarget={document.body}
      menuShouldScrollIntoView={false}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 30 }) }}
    />
  );
}

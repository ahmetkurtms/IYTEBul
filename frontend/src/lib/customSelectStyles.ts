const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    borderColor: state.isFocused ? '#9a0e20' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px #9a0e20' : provided.boxShadow,
    '&:hover': { borderColor: '#9a0e20' },
    minHeight: 48,
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#9a0e20'
      : state.isFocused
      ? '#fbeaec'
      : '#fff',
    color: state.isSelected
      ? '#fff'
      : '#1f2937', // text-gray-900
    fontWeight: state.isSelected ? 600 : 400,
    cursor: 'pointer',
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: '#fff',
    zIndex: 20,
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: '#1f2937',
    fontWeight: 500,
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: '#6b7280', // text-gray-400
  }),
  dropdownIndicator: (provided: any, state: any) => ({
    ...provided,
    color: state.isFocused ? '#9a0e20' : '#6b7280',
    '&:hover': { color: '#9a0e20' },
  }),
};

export default customSelectStyles; 
type SearchFieldProps = {
  placeholder: string;
};

export function SearchField({ placeholder }: SearchFieldProps) {
  return (
    <label className="search-field" aria-label={placeholder}>
      <span className="search-field__icon">⌕</span>
      <input placeholder={placeholder} type="text" />
    </label>
  );
}

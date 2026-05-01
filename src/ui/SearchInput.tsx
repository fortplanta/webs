import { useState, useRef, KeyboardEvent } from 'react';

interface SearchInputProps {
  onSubmit: (query: string) => void;
}

export default function SearchInput({ onSubmit }: SearchInputProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const showButton = focused || value.length > 0;

  return (
    <div className="search-input">
      <input
        ref={inputRef}
        className="search-input__field"
        type="text"
        placeholder="what do you want to explore?"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus
        autoComplete="off"
        spellCheck={false}
      />
      <button
        className="search-input__button"
        style={{ opacity: showButton ? 1 : 0, pointerEvents: showButton ? 'auto' : 'none' }}
        onClick={handleSubmit}
      >
        explore
      </button>
    </div>
  );
}

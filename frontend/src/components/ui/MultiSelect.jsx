import { useState, useRef, useEffect } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';

const MultiSelect = ({ options, value = [], onChange, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeOption = (e, optionValue) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="min-h-[46px] w-full bg-dark-bg border border-dark-card rounded-xl px-3 py-2 flex flex-wrap gap-2 items-center cursor-pointer transition-colors hover:border-brand-orange-500/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value.length === 0 ? (
          <span className="text-gray-500 text-sm ml-1 select-none">{placeholder}</span>
        ) : (
          value.map(v => (
            <span key={v} className="flex items-center gap-1 bg-brand-orange-500/10 text-brand-orange-500 border border-brand-orange-500/20 px-2 py-1 rounded-md text-xs font-semibold">
              {options.find(o => o.value === v)?.label || v}
              <button 
                type="button"
                onClick={(e) => removeOption(e, v)}
                className="hover:bg-brand-orange-500/20 rounded-full p-0.5 transition-colors focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <div className="ml-auto flex items-center pr-1 text-gray-500">
           <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-orange-500' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-dark-card border border-dark-border rounded-xl shadow-2xl py-1 max-h-60 overflow-y-auto animate-fade-in-up origin-top">
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm font-medium hover:bg-dark-surface transition-colors text-gray-300 hover:text-white"
              >
                <span>{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-brand-orange-500" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;

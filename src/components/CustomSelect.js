import React, { useState, useRef, useEffect } from 'react';
import { MdExpandMore } from 'react-icons/md';

function CustomSelect({ value, onChange, options, placeholder = 'Выберите...', style = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={selectRef} style={{ ...styles.container, ...style }}>
      <div
        style={{
          ...styles.selectButton,
          ...(isOpen && styles.selectButtonOpen)
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={styles.selectedText}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <MdExpandMore
          size={20}
          style={{
            ...styles.icon,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </div>

      {isOpen && (
        <div style={styles.dropdown}>
          {options.map((option) => (
            <div
              key={option.value}
              style={{
                ...styles.option,
                ...(option.value === value && styles.optionSelected)
              }}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    minWidth: '180px',
  },
  selectButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    userSelect: 'none',
  },
  selectButtonOpen: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
  },
  selectedText: {
    fontSize: '14px',
    color: '#111827',
    fontWeight: '500',
  },
  icon: {
    color: '#6b7280',
    transition: 'transform 0.2s',
    flexShrink: 0,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    maxHeight: '300px',
    overflowY: 'auto',
    animation: 'slideDown 0.2s ease-out',
  },
  option: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#111827',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    borderBottom: '1px solid #f3f4f6',
  },
  optionSelected: {
    backgroundColor: '#eff6ff',
    color: '#3b82f6',
    fontWeight: '600',
  },
};

// Добавляем CSS анимацию
if (!document.getElementById('custom-select-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'custom-select-styles';
  styleSheet.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default CustomSelect;

import React from 'react';
import { MdWarning, MdClose } from 'react-icons/md';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Удалить', cancelText = 'Отмена' }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <MdWarning size={24} color="#ef4444" />
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            <MdClose size={24} />
          </button>
        </div>
        
        <div style={styles.body}>
          <h3 style={styles.title}>{title}</h3>
          <p style={styles.message}>{message}</p>
        </div>
        
        <div style={styles.footer}>
          <button 
            onClick={onClose} 
            style={styles.cancelBtn}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            style={styles.confirmBtn}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    animation: 'slideUp 0.2s ease-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 20px 0 20px',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s',
  },
  body: {
    padding: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px 0',
  },
  message: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.5',
  },
  footer: {
    display: 'flex',
    gap: '12px',
    padding: '0 20px 20px 20px',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: 'white',
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4b5563',
    transition: 'all 0.2s ease',
    minHeight: '44px',
  },
  confirmBtn: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#ef4444',
    border: '2px solid #ef4444',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    transition: 'all 0.2s ease',
    minHeight: '44px',
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

export default ConfirmModal;

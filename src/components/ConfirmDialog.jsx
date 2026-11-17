import React, { useEffect } from 'react';
import './common.css';

// Подтверждение действия: одно модальное окно для удаления задач, записей дневника и т.п.
const ConfirmDialog = ({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) => {
  useEffect(() => {
    if (!open) return undefined;
    // Esc закрывает окно так же, как клик по затемнению
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <h3 id="confirm-dialog-title">{title}</h3>
        </div>
        <div className="modal__body">
          <p className="confirm-dialog__message">{message}</p>
        </div>
        <div className="modal__footer">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

import React, { useState, useEffect } from 'react';
import RegistrationForm from './RegistrationForm';
import './RegistrationModal.css';

const RegistrationModal = ({ isOpen, onClose, onSubmit }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleSubmit = (formData) => {
    onSubmit(formData);
    handleClose();
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`modal-content ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <RegistrationForm onSubmit={handleSubmit} onCancel={handleClose} />
      </div>
    </div>
  );
};

export default RegistrationModal;
import React, { useCallback, useEffect, useState } from 'react';
import './Clients.css';
import { apiFetch } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const EMPTY_CLIENT = { name: '', description: '', phone: '', email: '' };

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newClient, setNewClient] = useState(EMPTY_CLIENT);
  const [editClient, setEditClient] = useState(EMPTY_CLIENT);
  const { notify } = useToast();
  const { t } = useLanguage();

  const loadClients = useCallback(async () => {
    try {
      const data = await apiFetch('/clients');
      setClients(data);
    } catch (err) {
      notify(err.message, 'error');
    }
  }, [notify]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClient = async () => {
    if (!newClient.name.trim()) return;
    try {
      await apiFetch('/clients', { method: 'POST', body: newClient });
      notify(t('toast.clientAdded'), 'success');
      setNewClient(EMPTY_CLIENT);
      setIsModalOpen(false);
      loadClients();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleEdit = (client) => {
    setEditClient({
      name: client.name || '',
      description: client.description || '',
      phone: client.phone || '',
      email: client.email || '',
    });
    setEditingId(client.id);
  };

  const saveEdit = async (id) => {
    try {
      await apiFetch(`/clients/${id}`, { method: 'PUT', body: editClient });
      notify(t('toast.clientUpdated'), 'success');
      setEditingId(null);
      loadClients();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.delete') + '?')) return;
    try {
      await apiFetch(`/clients/${id}`, { method: 'DELETE' });
      notify(t('toast.deleted'), 'success');
      loadClients();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="clients container-card">
      <div className="clients__header">
        <h2 className="clients__title">{t('clients.title')}</h2>
        <button className="clients__add-btn" onClick={() => setIsModalOpen(true)}>
          {t('clients.add')}
        </button>
      </div>

      {clients.length > 0 ? (
        <div className="clients__list">
          {clients.map((client) => (
            <div key={client.id} className="client-card">
              {editingId === client.id ? (
                <div className="client-card__edit">
                  <div className="form-group">
                    <label>{t('clients.field.name')}</label>
                    <input name="name" value={editClient.name} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>{t('clients.field.description')}</label>
                    <textarea
                      name="description"
                      value={editClient.description}
                      onChange={handleEditChange}
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('clients.field.phone')}</label>
                    <input name="phone" value={editClient.phone} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>{t('clients.field.email')}</label>
                    <input name="email" value={editClient.email} onChange={handleEditChange} />
                  </div>
                  <div className="client-card__actions">
                    <button className="clients__add-btn" onClick={() => saveEdit(client.id)}>
                      {t('common.save')}
                    </button>
                    <button className="client-card__cancel" onClick={() => setEditingId(null)}>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="client-card__name">{client.name}</h3>
                  <p className="client-card__description">{client.description}</p>
                  <div className="client-card__contact">
                    {client.phone && (
                      <p>
                        <strong>{t('clients.field.phone')}:</strong> {client.phone}
                      </p>
                    )}
                    {client.email && (
                      <p>
                        <strong>{t('clients.field.email')}:</strong> {client.email}
                      </p>
                    )}
                  </div>
                  <div className="client-card__actions">
                    <button className="client-card__edit-btn" onClick={() => handleEdit(client)}>
                      {t('common.edit')}
                    </button>
                    <button
                      className="client-card__edit-btn client-card__edit-btn--danger"
                      onClick={() => handleDelete(client.id)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="clients__empty">
          <p>{t('clients.empty')}</p>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3>{t('clients.modal.add')}</h3>
              <button className="modal__close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label htmlFor="name">{t('clients.field.name')} *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newClient.name}
                  onChange={handleInputChange}
                  placeholder={t('clients.placeholder.name')}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">{t('clients.field.description')}</label>
                <textarea
                  id="description"
                  name="description"
                  value={newClient.description}
                  onChange={handleInputChange}
                  placeholder={t('clients.placeholder.description')}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">{t('clients.field.phone')}</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={newClient.phone}
                  onChange={handleInputChange}
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">{t('clients.field.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newClient.email}
                  onChange={handleInputChange}
                  placeholder="example@mail.com"
                />
              </div>
            </div>
            <div className="modal__footer">
              <button className="modal__cancel" onClick={() => setIsModalOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="modal__submit" onClick={handleAddClient}>
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;

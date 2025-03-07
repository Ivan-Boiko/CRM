import React, { useState } from 'react';
import './Clients.css';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    description: '',
    phone: '',
    email: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient({
      ...newClient,
      [name]: value
    });
  };

  const handleAddClient = () => {
    if (newClient.name.trim()) {
      setClients([
        ...clients,
        {
          id: Date.now(),
          ...newClient
        }
      ]);
      setNewClient({
        name: '',
        description: '',
        phone: '',
        email: ''
      });
      setIsModalOpen(false);
    }
  };

  return (
    <div className="clients">
      <div className="clients__header">
        <h2 className="clients__title">Клиенты</h2>
        <button 
          className="clients__add-btn"
          onClick={() => setIsModalOpen(true)}
        >
          Добавить клиента
        </button>
      </div>

      {clients.length > 0 ? (
        <div className="clients__list">
          {clients.map(client => (
            <div key={client.id} className="client-card">
              <h3 className="client-card__name">{client.name}</h3>
              <p className="client-card__description">{client.description}</p>
              <div className="client-card__contact">
                {client.phone && <p><strong>Телефон:</strong> {client.phone}</p>}
                {client.email && <p><strong>Email:</strong> {client.email}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="clients__empty">
          <p>Список клиентов пуст</p>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3>Добавить нового клиента</h3>
              <button 
                className="modal__close"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label htmlFor="name">Название *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newClient.name}
                  onChange={handleInputChange}
                  placeholder="Введите название компании или имя клиента"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Описание</label>
                <textarea
                  id="description"
                  name="description"
                  value={newClient.description}
                  onChange={handleInputChange}
                  placeholder="Добавьте описание клиента"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Телефон</label>
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
                <label htmlFor="email">Email</label>
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
              <button 
                className="modal__cancel"
                onClick={() => setIsModalOpen(false)}
              >
                Отмена
              </button>
              <button 
                className="modal__submit"
                onClick={handleAddClient}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
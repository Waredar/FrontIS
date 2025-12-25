import React, { useState, useEffect } from 'react';
import { MdAdd, MdSearch, MdEvent, MdAccessTime, MdFilterList } from 'react-icons/md';
import { toast } from 'react-toastify';
import api, { getAppointments, getMasters, getClients, createAppointment } from '../services/api';
import Modal from './Modal';
import CustomSelect from './CustomSelect';

function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [masters, setMasters] = useState([]);
  const [clients, setClients] = useState([]); // Нужно для выбора клиента
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Модальные окна
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Фильтры
  const [filters, setFilters] = useState({
    status: '',
    masterid: '',
    date_from: '',
    date_to: ''
  });

  // Форма создания
  const [newAppt, setNewAppt] = useState({
    clientid: '',
    masterid: '',
    startdatetime: '',
    source: 'Phone'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apptsData, mastersData, clientsData] = await Promise.all([
        getAppointments(filters),
        getMasters(),
        getClients(0, 500) // Загружаем первых 500 клиентов для списка
      ]);
      setAppointments(apptsData);
      setMasters(mastersData);
      setClients(clientsData);
    } catch (error) {
      console.error(error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointmentsOnly = async () => {
    try {
      const data = await getAppointments(filters);
      setAppointments(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Преобразуем дату и время в ISO формат
      const isoDate = new Date(newAppt.startdatetime).toISOString();
      
      await createAppointment({
        clientid: parseInt(newAppt.clientid),
        masterid: parseInt(newAppt.masterid),
        startdatetime: newAppt.startdatetime, // Backend Pydantic сам распарсит ISO строку
        status: 'Planned',
        source: newAppt.source
      });
      
      toast.success('Заказ создан успешно');
      setShowCreateModal(false);
      setNewAppt({ clientid: '', masterid: '', startdatetime: '', source: 'Phone' });
      loadAppointmentsOnly();
    } catch (error) {
      toast.error('Ошибка создания заказа. Проверьте дату и время.');
      console.error(error);
    }
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
  };

  const handleChangeStatus = async (appointmentId, newStatus) => {
    try {
      await api.put(`/appointments/${appointmentId}/status?status=${newStatus}`);
      toast.success(`Статус изменен на ${newStatus}`);
      loadAppointmentsOnly();
      setShowViewModal(false);
    } catch (error) {
      toast.error('Ошибка изменения статуса');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Planned': return 'badge-primary';
      case 'Completed': return 'badge-success';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getStatusText = (status) => {
    const map = {
      'Planned': 'Запланирован',
      'Completed': 'Завершён',
      'Cancelled': 'Отменён',
      'NoShow': 'Не пришел'
    };
    return map[status] || status;
  };

  // Опции для селектов
  const clientOptions = clients.map(c => ({ value: c.clientid, label: c.fullname }));
  const masterOptions = masters.filter(m => m.isactive).map(m => ({ value: m.masterid, label: m.fullname }));

  return (
    <div className="card">
      <div className="card-header">
        <div className="header-title">
          <MdEvent className="header-icon" />
          <h2>Журнал записей</h2>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <MdAdd /> Новый заказ
        </button>
      </div>

      {/* Панель фильтров */}
      <div className="filters-panel">
        <div className="filter-group">
          <select 
            value={filters.masterid} 
            onChange={(e) => setFilters({...filters, masterid: e.target.value})}
          >
            <option value="">Все мастера</option>
            {masters.map(m => <option key={m.masterid} value={m.masterid}>{m.fullname}</option>)}
          </select>
          
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">Все статусы</option>
            <option value="Planned">Запланирован</option>
            <option value="Completed">Завершен</option>
            <option value="Cancelled">Отменен</option>
          </select>

          <input 
            type="date" 
            value={filters.date_from} 
            onChange={(e) => setFilters({...filters, date_from: e.target.value})} 
          />
          <span className="separator">—</span>
          <input 
            type="date" 
            value={filters.date_to} 
            onChange={(e) => setFilters({...filters, date_to: e.target.value})} 
          />
          
          <button className="btn btn-secondary" onClick={loadAppointmentsOnly}>
            <MdFilterList /> Применить
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">Записей не найдено</div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>Клиент</th>
                <th>Мастер</th>
                <th>Источник</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appt => (
                <tr key={appt.appointmentid}>
                  <td>
                    <div className="datetime-cell">
                      <span className="date">{new Date(appt.startdatetime).toLocaleDateString()}</span>
                      <span className="time">{new Date(appt.startdatetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </td>
                  <td>{appt.client_name}</td>
                  <td>{appt.master_name}</td>
                  <td>{appt.source}</td>
                  <td><span className={`badge ${getStatusColor(appt.status)}`}>{getStatusText(appt.status)}</span></td>
                  <td>
                    <button className="btn-sm btn-secondary" onClick={() => handleViewAppointment(appt)}>
                      Детали
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно СОЗДАНИЯ */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Новая запись">
        <form onSubmit={handleCreate} className="form-grid">
          <div className="form-group full-width">
            <label>Клиент</label>
            <CustomSelect 
              options={clientOptions}
              value={newAppt.clientid}
              onChange={(val) => setNewAppt({...newAppt, clientid: val})}
              placeholder="Выберите клиента..."
            />
          </div>

          <div className="form-group full-width">
            <label>Мастер</label>
            <CustomSelect 
              options={masterOptions}
              value={newAppt.masterid}
              onChange={(val) => setNewAppt({...newAppt, masterid: val})}
              placeholder="Выберите мастера..."
            />
          </div>

          <div className="form-group">
            <label>Дата и время начала</label>
            <input 
              type="datetime-local" 
              required
              value={newAppt.startdatetime}
              onChange={(e) => setNewAppt({...newAppt, startdatetime: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Источник</label>
            <select 
              value={newAppt.source}
              onChange={(e) => setNewAppt({...newAppt, source: e.target.value})}
            >
              <option value="Phone">Телефон</option>
              <option value="WalkIn">Пришел с улицы</option>
              <option value="Online">Онлайн</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Отмена</button>
            <button type="submit" className="btn btn-primary">Создать запись</button>
          </div>
        </form>
      </Modal>

      {/* Модальное окно ДЕТАЛЕЙ */}
      {selectedAppointment && (
        <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`Заказ #${selectedAppointment.appointmentid}`}>
          <div className="appointment-details">
            <div className="detail-row">
              <strong>Клиент:</strong> {selectedAppointment.client_name}
            </div>
            <div className="detail-row">
              <strong>Мастер:</strong> {selectedAppointment.master_name}
            </div>
            <div className="detail-row">
              <strong>Время:</strong> {new Date(selectedAppointment.startdatetime).toLocaleString()}
            </div>
            
            <div className="status-actions" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <p>Сменить статус:</p>
              <div className="btn-group">
                <button type="button" className="btn btn-success" onClick={() => handleChangeStatus(selectedAppointment.appointmentid, 'Completed')}>
                  Завершить
                </button>
                <button type="button" className="btn btn-danger" onClick={() => handleChangeStatus(selectedAppointment.appointmentid, 'Cancelled')}>
                  Отменить
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AppointmentList;

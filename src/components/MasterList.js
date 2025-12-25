import React, { useState, useEffect } from 'react';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdPerson, MdArrowUpward, MdArrowDownward, MdCheckCircle, MdCancel } from 'react-icons/md';
import { toast } from 'react-toastify';
import { getMasters, createMaster, updateMaster, deleteMaster } from '../services/api';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';

// Кастомный хук для debounce
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function MasterList() {
  const [masters, setMasters] = useState([]);
  const [filteredMasters, setFilteredMasters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMaster, setEditingMaster] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // Сортировка
  const [sortField, setSortField] = useState('fullname');
  const [sortDirection, setSortDirection] = useState('asc');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    masterId: null,
    masterName: ''
  });

  // Обновленный стейт формы с новыми полями
  const [formData, setFormData] = useState({
    fullname: '',
    specialization: '',
    phone: '',
    email: '',
    passport: '',
    address: '',
    birthdate: '',
    hiredate: '',
    salary: '',
    commissionpercent: '',
    paymenttype: 'Monthly',
    isactive: true
  });

  useEffect(() => {
    loadMasters();
  }, []);

  useEffect(() => {
    let result = [...masters];

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(master =>
        master.fullname.toLowerCase().includes(searchLower) ||
        master.phone.toLowerCase().includes(searchLower) ||
        (master.specialization && master.specialization.toLowerCase().includes(searchLower))
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredMasters(result);
  }, [masters, debouncedSearch, sortField, sortDirection]);

  const loadMasters = async () => {
    setLoading(true);
    try {
      const data = await getMasters();
      setMasters(data);
    } catch (error) {
      toast.error('Ошибка загрузки мастеров');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Преобразование типов для бэкенда
      const payload = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        commissionpercent: formData.commissionpercent ? parseFloat(formData.commissionpercent) : 0,
        // Пустые строки дат превращаем в null
        birthdate: formData.birthdate || null,
        hiredate: formData.hiredate || null
      };

      if (editingMaster) {
        await updateMaster(editingMaster.masterid, payload);
        toast.success('Мастер обновлён');
      } else {
        await createMaster(payload);
        toast.success('Мастер создан');
      }
      handleCloseModal();
      loadMasters();
    } catch (error) {
      toast.error('Ошибка сохранения мастера');
      console.error(error);
    }
  };

  const handleEdit = (master) => {
    setEditingMaster(master);
    setFormData({
      fullname: master.fullname,
      specialization: master.specialization || '',
      phone: master.phone,
      email: master.email || '',
      passport: master.passport || '',
      address: master.address || '',
      birthdate: master.birthdate || '',
      hiredate: master.hiredate || '',
      salary: master.salary || '',
      commissionpercent: master.commissionpercent || '',
      paymenttype: master.paymenttype || 'Monthly',
      isactive: master.isactive
    });
    setShowModal(true);
  };

  const handleDelete = (masterId, masterName) => {
    setConfirmModal({ isOpen: true, masterId, masterName });
  };

  const confirmDelete = async () => {
    try {
      await deleteMaster(confirmModal.masterId);
      toast.success('Мастер удалён');
      loadMasters();
    } catch (error) {
      toast.error('Ошибка удаления мастера');
    } finally {
      setConfirmModal({ isOpen: false, masterId: null, masterName: '' });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMaster(null);
    setFormData({
      fullname: '', specialization: '', phone: '', email: '', passport: '',
      address: '', birthdate: '', hiredate: '', salary: '',
      commissionpercent: '', paymenttype: 'Monthly', isactive: true
    });
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <MdArrowUpward /> : <MdArrowDownward />;
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="header-title">
          <MdPerson className="header-icon" />
          <h2>Управление мастерами</h2>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <MdAdd /> Добавить мастера
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder="Поиск по имени, телефону или специализации..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-stats">
          {filteredMasters.length === masters.length 
            ? `Всего: ${masters.length}` 
            : `Найдено: ${filteredMasters.length} из ${masters.length}`}
        </div>
      </div>

      {loading ? (
        <div className="loading">Загрузка мастеров...</div>
      ) : filteredMasters.length === 0 ? (
        <div className="empty-state">{search ? 'Мастера не найдены' : 'Список мастеров пуст'}</div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>№</th>
                <th onClick={() => handleSort('fullname')} className="sortable">ФИО <SortIcon field="fullname" /></th>
                <th onClick={() => handleSort('specialization')} className="sortable">Спец-ть <SortIcon field="specialization" /></th>
                <th onClick={() => handleSort('phone')} className="sortable">Телефон <SortIcon field="phone" /></th>
                <th>Тип оплаты</th>
                <th className="text-center">Статус</th>
                <th className="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredMasters.map((master, index) => (
                <tr key={master.masterid} className={!master.isactive ? 'row-inactive' : ''}>
                  <td>{index + 1}</td>
                  <td className="font-medium">{master.fullname}</td>
                  <td>{master.specialization || '—'}</td>
                  <td>{master.phone}</td>
                  <td>
                    {master.paymenttype === 'Monthly' && 'Оклад'}
                    {master.paymenttype === 'Hourly' && 'Почасовая'}
                    {master.paymenttype === 'Commission' && 'Процент'}
                    {master.paymenttype === 'Mixed' && 'Смешанная'}
                  </td>
                  <td className="text-center">
                    {master.isactive 
                      ? <span className="badge badge-success">Активен</span>
                      : <span className="badge badge-danger">Не активен</span>
                    }
                  </td>
                  <td className="text-right">
                    <button className="btn-icon" onClick={() => handleEdit(master)} title="Редактировать">
                      <MdEdit />
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(master.masterid, master.fullname)} title="Удалить">
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно создания/редактирования */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingMaster ? 'Редактирование мастера' : 'Новый мастер'}
      >
        <form onSubmit={handleSubmit} className="form-grid">
          {/* Основная информация */}
          <div className="form-section-title">Основная информация</div>
          
          <div className="form-group">
            <label>ФИО *</label>
            <input
              type="text"
              required
              value={formData.fullname}
              onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Специализация</label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Телефон *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Дата рождения</label>
            <input
              type="date"
              value={formData.birthdate}
              onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Паспортные данные</label>
            <input
              type="text"
              placeholder="Серия номер"
              value={formData.passport}
              onChange={(e) => setFormData({ ...formData, passport: e.target.value })}
            />
          </div>

          <div className="form-group full-width">
            <label>Адрес проживания</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          {/* Трудовая информация */}
          <div className="form-section-title">Трудовая информация</div>

          <div className="form-group">
            <label>Дата найма *</label>
            <input
              type="date"
              required
              value={formData.hiredate}
              onChange={(e) => setFormData({ ...formData, hiredate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Тип оплаты</label>
            <select
              value={formData.paymenttype}
              onChange={(e) => setFormData({ ...formData, paymenttype: e.target.value })}
            >
              <option value="Monthly">Оклад (Monthly)</option>
              <option value="Hourly">Почасовая (Hourly)</option>
              <option value="Commission">Процент (Commission)</option>
              <option value="Mixed">Смешанная (Mixed)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Оклад / Ставка (₽)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Процент (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.commissionpercent}
              onChange={(e) => setFormData({ ...formData, commissionpercent: e.target.value })}
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isactive}
                onChange={(e) => setFormData({ ...formData, isactive: e.target.checked })}
              />
              Сотрудник работает (Активен)
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              {editingMaster ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Удаление мастера"
        message={`Вы уверены, что хотите удалить мастера "${confirmModal.masterName}"? Это действие нельзя отменить.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}

export default MasterList;

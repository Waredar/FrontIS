import React, { useState, useEffect } from 'react';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdPerson, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
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
  const [allMasters, setAllMasters] = useState([]);
  const [filteredMasters, setFilteredMasters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMaster, setEditingMaster] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  // Состояние для сортировки
  const [sortField, setSortField] = useState('fullname');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Состояние для модалки подтверждения
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    masterId: null,
    masterName: ''
  });
  
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

  // Применение поиска и сортировки
  useEffect(() => {
    let result = [...allMasters];
    
    // Поиск
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(master => 
        master.fullname.toLowerCase().includes(searchLower) ||
        master.phone.toLowerCase().includes(searchLower) ||
        (master.specialization && master.specialization.toLowerCase().includes(searchLower))
      );
    }
    
    // Сортировка
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
  }, [allMasters, debouncedSearch, sortField, sortDirection]);

  const loadMasters = async () => {
    setLoading(true);
    try {
      const data = await getMasters();
      setAllMasters(data);
    } catch (error) {
      toast.error('Ошибка загрузки мастеров');
    } finally {
      setLoading(false);
    }
  };

  // Функция сортировки
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
      const payload = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        commissionpercent: formData.commissionpercent ? parseFloat(formData.commissionpercent) : 0,
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
      isactive: master.isactive !== undefined ? master.isactive : true
    });
    setShowModal(true);
  };

  const handleDelete = (masterId, masterName) => {
    setConfirmModal({
      isOpen: true,
      masterId,
      masterName
    });
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
  };

  const formatPhone = (phone) => {
    if (!phone) return '—';
    const cleaned = phone.replace(/\D/g, '');
    const normalized = cleaned.startsWith('8') ? '7' + cleaned.slice(1) : cleaned;
    if (normalized.length === 11 && normalized.startsWith('7')) {
      return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
    }
    return phone;
  };

  const getPaymentTypeLabel = (type) => {
    const types = {
      'Monthly': 'Оклад',
      'Hourly': 'Почасовая',
      'Commission': 'Процент',
      'Mixed': 'Смешанная'
    };
    return types[type] || type;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <MdArrowUpward size={16} style={{ marginLeft: '4px' }} /> : 
      <MdArrowDownward size={16} style={{ marginLeft: '4px' }} />;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Мастера</h1>
          <p style={styles.subtitle}>
            {filteredMasters.length === allMasters.length 
              ? `Всего: ${allMasters.length}`
              : `Найдено: ${filteredMasters.length} из ${allMasters.length}`}
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          style={styles.addButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          }}
        >
          <MdAdd size={20} />
          Добавить мастера
        </button>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <MdSearch size={20} color="#6b7280" />
          <input
            type="text"
            placeholder="Поиск по имени, телефону или специализации..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Загрузка мастеров...</p>
          </div>
        ) : filteredMasters.length === 0 ? (
          <div style={styles.emptyState}>
            <p>{search ? 'Мастера не найдены' : 'Список мастеров пуст'}</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>№</th>
                <th 
                  style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('fullname')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    ФИО <SortIcon field="fullname" />
                  </div>
                </th>
                <th 
                  style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('phone')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Телефон <SortIcon field="phone" />
                  </div>
                </th>
                <th 
                  style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('specialization')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Специализация <SortIcon field="specialization" />
                  </div>
                </th>
                <th 
                  style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('hiredate')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Дата найма <SortIcon field="hiredate" />
                  </div>
                </th>
                <th style={{...styles.th, textAlign: 'center'}}>Статус</th>
                <th style={styles.th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredMasters.map((master, index) => (
                <tr key={master.masterid} style={styles.tr}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    <div style={styles.masterName}>
                      <div style={styles.avatar}>
                        <MdPerson size={18} />
                      </div>
                      {master.fullname}
                    </div>
                  </td>
                  <td style={styles.td}>{formatPhone(master.phone)}</td>
                  <td style={styles.td}>{master.specialization || '—'}</td>
                  <td style={styles.td}>
                    {master.hiredate ? new Date(master.hiredate).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: master.isactive ? '#d1fae5' : '#fee2e2',
                      color: master.isactive ? '#065f46' : '#991b1b'
                    }}>
                      {master.isactive ? 'Активен' : 'Не активен'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button 
                        onClick={() => handleEdit(master)} 
                        style={styles.editBtn}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#dbeafe';
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                          e.currentTarget.style.borderColor = '#dbeafe';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <MdEdit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(master.masterid, master.fullname)} 
                        style={styles.deleteBtn}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                          e.currentTarget.style.borderColor = '#ef4444';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                          e.currentTarget.style.borderColor = '#fecaca';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingMaster ? 'Редактирование мастера' : 'Новый мастер'}
        width="700px"
      >
        <form onSubmit={handleSubmit}>
          {/* Личные данные */}
          <div style={styles.sectionTitle}>Личные данные</div>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                ФИО <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={formData.fullname}
                onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                style={styles.input}
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Специализация</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                style={styles.input}
                placeholder="Парикмахер, визажист..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Телефон <span style={styles.required}>*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={styles.input}
                placeholder="+7 (999) 123-45-67"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={styles.input}
                placeholder="example@mail.ru"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Паспорт</label>
              <input
                type="text"
                value={formData.passport}
                onChange={(e) => setFormData({...formData, passport: e.target.value})}
                style={styles.input}
                placeholder="1234 567890"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Дата рождения</label>
              <input
                type="date"
                value={formData.birthdate}
                onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroupFull}>
            <label style={styles.label}>Адрес</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              style={styles.input}
              placeholder="Город, улица, дом"
            />
          </div>

          {/* Условия работы */}
          <div style={styles.sectionTitle}>Условия работы</div>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Дата найма <span style={styles.required}>*</span>
              </label>
              <input
                type="date"
                value={formData.hiredate}
                onChange={(e) => setFormData({...formData, hiredate: e.target.value})}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Тип оплаты</label>
              <select
                value={formData.paymenttype}
                onChange={(e) => setFormData({...formData, paymenttype: e.target.value})}
                style={styles.input}
              >
                <option value="Monthly">Оклад</option>
                <option value="Hourly">Почасовая</option>
                <option value="Commission">Процент</option>
                <option value="Mixed">Смешанная</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Оклад (₽)</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: e.target.value})}
                style={styles.input}
                placeholder="50000"
                min="0"
                step="0.01"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Процент комиссии (%)</label>
              <input
                type="number"
                value={formData.commissionpercent}
                onChange={(e) => setFormData({...formData, commissionpercent: e.target.value})}
                style={styles.input}
                placeholder="10"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          </div>

          <div style={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="isactive"
              checked={formData.isactive}
              onChange={(e) => setFormData({...formData, isactive: e.target.checked})}
              style={styles.checkbox}
            />
            <label htmlFor="isactive" style={styles.checkboxLabel}>
              Сотрудник активен
            </label>
          </div>

          <div style={styles.modalFooter}>
            <button 
              type="button" 
              onClick={handleCloseModal} 
              style={styles.cancelBtn}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              style={styles.submitBtn}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              {editingMaster ? 'Сохранить изменения' : 'Создать мастера'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, masterId: null, masterName: '' })}
        onConfirm={confirmDelete}
        title="Удаление мастера"
        message={`Вы действительно хотите удалить мастера "${confirmModal.masterName}"? Это действие нельзя отменить.`}
      />
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '0 0 30px 0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexShrink: 0,
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    minHeight: '44px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  toolbar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    flex: '1',
    minWidth: '300px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#111827',
    backgroundColor: 'transparent',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    flex: 1,
    minHeight: 0,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#111827',
  },
  masterName: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: '500',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#fef3c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f59e0b',
    flexShrink: 0,
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    padding: '10px 12px',
    backgroundColor: '#eff6ff',
    border: '2px solid #dbeafe',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    minWidth: '40px',
    minHeight: '40px',
  },
  deleteBtn: {
    padding: '10px 12px',
    backgroundColor: '#fef2f2',
    border: '2px solid #fecaca',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    minWidth: '40px',
    minHeight: '40px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9ca3af',
    fontSize: '16px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '12px',
    color: '#6b7280',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#3b82f6',
    marginTop: '20px',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '2px solid #e5e7eb',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
    letterSpacing: '0.01em',
  },
  required: {
    color: '#ef4444',
    fontWeight: '700',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#111827',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    minHeight: '44px',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '20px',
    marginBottom: '10px',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827',
    cursor: 'pointer',
    margin: 0,
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '2px solid #f3f4f6',
  },
  cancelBtn: {
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
    minWidth: '100px',
  },
  submitBtn: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    transition: 'all 0.2s ease',
    minHeight: '44px',
    minWidth: '140px',
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  input:focus,
  select:focus,
  textarea:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
  
  input::placeholder,
  textarea::placeholder {
    color: #9ca3af;
  }
`;
document.head.appendChild(styleSheet);

export default MasterList;

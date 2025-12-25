import React, { useState, useEffect } from 'react';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdBuild, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import { toast } from 'react-toastify';
import { getServices, createService, updateService, deleteService } from '../services/api';
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

function ServiceList() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  // Состояние для сортировки
  const [sortField, setSortField] = useState('servicename');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Состояние для модалки подтверждения
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    serviceId: null,
    serviceName: ''
  });
  
  const [formData, setFormData] = useState({
    servicename: '',
    description: '',
    baseprice: '',
    durationminutes: ''
  });

  useEffect(() => {
    loadServices();
  }, []);

  // Применение поиска и сортировки
  useEffect(() => {
    let result = [...services];
    
    // Поиск
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(service => 
        service.servicename.toLowerCase().includes(searchLower) ||
        (service.description && service.description.toLowerCase().includes(searchLower))
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
    
    setFilteredServices(result);
  }, [services, debouncedSearch, sortField, sortDirection]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      toast.error('Ошибка загрузки услуг');
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
      const submitData = {
        servicename: formData.servicename,
        description: formData.description,
        baseprice: parseFloat(formData.baseprice),
        durationminutes: parseInt(formData.durationminutes)
      };
      
      if (editingService) {
        await updateService(editingService.serviceid, submitData);
        toast.success('Услуга обновлена');
      } else {
        await createService(submitData);
        toast.success('Услуга создана');
      }
      handleCloseModal();
      loadServices();
    } catch (error) {
      toast.error('Ошибка сохранения услуги');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      servicename: service.servicename,
      description: service.description || '',
      baseprice: service.baseprice != null ? service.baseprice.toString() : '',
      durationminutes: service.durationminutes != null ? service.durationminutes.toString() : ''
    });
    setShowModal(true);
  };

  const handleDelete = (serviceId, serviceName) => {
    setConfirmModal({
      isOpen: true,
      serviceId,
      serviceName
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteService(confirmModal.serviceId);
      toast.success('Услуга удалена');
      loadServices();
    } catch (error) {
      toast.error('Ошибка удаления услуги');
    } finally {
      setConfirmModal({ isOpen: false, serviceId: null, serviceName: '' });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData({ servicename: '', description: '', baseprice: '', durationminutes: '' });
  };

  const formatPrice = (price) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (numPrice == null || isNaN(numPrice)) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numPrice);
  };

  const formatDuration = (minutes) => {
    const numMinutes = typeof minutes === 'string' ? parseInt(minutes) : minutes;
    if (numMinutes == null || isNaN(numMinutes) || numMinutes <= 0) return '—';
    if (numMinutes < 60) return `${numMinutes} мин`;
    const hours = Math.floor(numMinutes / 60);
    const mins = numMinutes % 60;
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
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
          <h1 style={styles.title}>Услуги</h1>
          <p style={styles.subtitle}>
            {filteredServices.length === services.length 
              ? `Всего: ${services.length}`
              : `Найдено: ${filteredServices.length} из ${services.length}`}
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
          Добавить услугу
        </button>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <MdSearch size={20} color="#6b7280" />
          <input
            type="text"
            placeholder="Поиск по названию или описанию..."
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
            <p>Загрузка услуг...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div style={styles.emptyState}>
            <p>{search ? 'Услуги не найдены' : 'Список услуг пуст'}</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>№</th>
                <th 
                  style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('servicename')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Название <SortIcon field="servicename" />
                  </div>
                </th>
                <th style={styles.th}>Описание</th>
                <th 
                  style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('baseprice')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Цена <SortIcon field="baseprice" />
                  </div>
                </th>
                <th 
                  style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('durationminutes')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Длительность <SortIcon field="durationminutes" />
                  </div>
                </th>
                <th style={styles.th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service, index) => (
                <tr key={service.serviceid} style={styles.tr}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    <div style={styles.serviceName}>
                      <div style={styles.icon}>
                        <MdBuild size={18} />
                      </div>
                      {service.servicename}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {service.description ? (
                      <div style={styles.description}>
                        {service.description.length > 60 
                          ? service.description.substring(0, 60) + '...'
                          : service.description}
                      </div>
                    ) : '—'}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.price}>{formatPrice(service.baseprice)}</span>
                  </td>
                  <td style={styles.td}>{formatDuration(service.durationminutes)}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button 
                        onClick={() => handleEdit(service)} 
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
                        onClick={() => handleDelete(service.serviceid, service.servicename)} 
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
        title={editingService ? 'Редактирование услуги' : 'Новая услуга'}
        width="600px"
      >
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.formGroupFull}>
              <label style={styles.label}>
                Название услуги <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={formData.servicename}
                onChange={(e) => setFormData({...formData, servicename: e.target.value})}
                style={styles.input}
                placeholder="Стрижка, окрашивание..."
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Цена (₽) <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                value={formData.baseprice}
                onChange={(e) => setFormData({...formData, baseprice: e.target.value})}
                style={styles.input}
                placeholder="1500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Длительность (мин) <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                value={formData.durationminutes}
                onChange={(e) => setFormData({...formData, durationminutes: e.target.value})}
                style={styles.input}
                placeholder="60"
                min="1"
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={styles.textarea}
              placeholder="Подробное описание услуги..."
              rows={4}
            />
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
              {editingService ? 'Сохранить изменения' : 'Создать услугу'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, serviceId: null, serviceName: '' })}
        onConfirm={confirmDelete}
        title="Удаление услуги"
        message={`Вы действительно хотите удалить услугу "${confirmModal.serviceName}"? Это действие нельзя отменить.`}
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
  serviceName: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: '500',
  },
  icon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#3b82f6',
    flexShrink: 0,
  },
  description: {
    color: '#6b7280',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  price: {
    fontWeight: '600',
    color: '#059669',
    fontSize: '15px',
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
    gridColumn: '1 / -1',
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
  textarea: {
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
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    minHeight: '100px',
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

export default ServiceList;

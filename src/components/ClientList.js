import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdPerson, MdFilterList, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import { toast } from 'react-toastify';
import { getClients, createClient, updateClient, deleteClient } from '../services/api';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
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

function ClientList() {
  const [allClients, setAllClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const observerTarget = useRef(null);
  const loadingRef = useRef(false);
  const itemsPerPage = 100;
  
  // Состояние для сортировки
  const [sortField, setSortField] = useState('fullname');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Состояние для модалки подтверждения
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    clientId: null,
    clientName: ''
  });
  
  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    email: '',
    birthdate: '',
    loyaltystatus: 'Basic',
    notes: ''
  });

  // Функция сортировки
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Функция загрузки с сервера с сортировкой
  const loadMoreClients = useCallback(async (pageNum) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    
    try {
      const data = await getClients(
        pageNum * itemsPerPage,
        itemsPerPage,
        debouncedSearch,
        statusFilter,
        sortField,
        sortDirection
      );
      
      if (data.items.length < itemsPerPage) {
        setHasMore(false);
      }
      
      setAllClients(prev => pageNum === 0 ? data.items : [...prev, ...data.items]);
      setTotal(data.total);
    } catch (error) {
      toast.error('Ошибка загрузки клиентов');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [debouncedSearch, itemsPerPage, statusFilter, sortField, sortDirection]);

  // При изменении поиска, фильтра или сортировки - полный сброс
  useEffect(() => {
    setAllClients([]);
    setPage(0);
    setHasMore(true);
    loadMoreClients(0);
  }, [debouncedSearch, statusFilter, sortField, sortDirection, loadMoreClients]);

  // Загрузка следующих страниц
  useEffect(() => {
    if (page > 0) {
      loadMoreClients(page);
    }
  }, [page, loadMoreClients]);

  // IntersectionObserver для бесконечной прокрутки
  useEffect(() => {
    const currentTarget = observerTarget.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current && allClients.length > 0) {
          setPage(prev => prev + 1);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, allClients.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.clientid, formData);
        toast.success('Клиент обновлён');
      } else {
        await createClient(formData);
        toast.success('Клиент создан');
      }
      handleCloseModal();
      
      setAllClients([]);
      setPage(0);
      setHasMore(true);
      await loadMoreClients(0);
    } catch (error) {
      toast.error('Ошибка сохранения клиента');
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      fullname: client.fullname,
      phone: client.phone,
      email: client.email || '',
      birthdate: client.birthdate || '',
      loyaltystatus: client.loyaltystatus,
      notes: client.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = (clientId, clientName) => {
    setConfirmModal({
      isOpen: true,
      clientId,
      clientName
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteClient(confirmModal.clientId);
      toast.success('Клиент удалён');
      
      setAllClients([]);
      setPage(0);
      setHasMore(true);
      await loadMoreClients(0);
    } catch (error) {
      toast.error('Ошибка удаления клиента');
    } finally {
      setConfirmModal({ isOpen: false, clientId: null, clientName: '' });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({ fullname: '', phone: '', email: '', birthdate: '', loyaltystatus: 'Basic', notes: '' });
  };

  const getLoyaltyColor = (status) => {
    switch (status) {
      case 'Platinum': return '#e5e4e2';
      case 'Gold': return '#ffd700';
      case 'Silver': return '#c0c0c0';
      default: return '#94a3b8';
    }
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
          <h1 style={styles.title}>Клиенты</h1>
          <p style={styles.subtitle}>
            Загружено: {allClients.length} из {total}
            {search && debouncedSearch !== search && ' • Поиск...'}
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
          Добавить клиента
        </button>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <MdSearch size={20} color="#6b7280" />
          <input
            type="text"
            placeholder="Поиск по имени, телефону или email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterBox}>
          <MdFilterList size={20} color="#6b7280" />
          <CustomSelect
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { value: '', label: 'Все статусы' },
              { value: 'Basic', label: 'Basic' },
              { value: 'Silver', label: 'Silver' },
              { value: 'Gold', label: 'Gold' },
              { value: 'Platinum', label: 'Platinum' }
            ]}
            placeholder="Все статусы"
          />
        </div>
      </div>

      <div style={styles.tableContainer}>
        {allClients.length === 0 && !loading ? (
          <div style={styles.emptyState}>
            <p>Клиенты не найдены</p>
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
                  onClick={() => handleSort('email')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Email <SortIcon field="email" />
                  </div>
                </th>
                <th 
                  style={{...styles.th, textAlign: 'center', cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('loyaltystatus')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Статус <SortIcon field="loyaltystatus" />
                  </div>
                </th>
                <th style={styles.th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {allClients.map((client, index) => (
                <tr key={client.clientid} style={styles.tr}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    <div style={styles.clientName}>
                      <div style={styles.avatar}>
                        <MdPerson size={18} />
                      </div>
                      {client.fullname}
                    </div>
                  </td>
                  <td style={styles.td}>{formatPhone(client.phone)}</td>
                  <td style={styles.td}>{client.email || '—'}</td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: getLoyaltyColor(client.loyaltystatus),
                      color: client.loyaltystatus === 'Basic' ? 'white' : '#1f2937'
                    }}>
                      {client.loyaltystatus}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button 
                        onClick={() => handleEdit(client)} 
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
                        onClick={() => handleDelete(client.clientid, client.fullname)} 
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
        
        <div ref={observerTarget} style={styles.loadTrigger}>
          {loading && (
            <div style={styles.loadingMore}>
              <div style={styles.spinner}></div>
              Загрузка...
            </div>
          )}
        </div>
        
        {!loading && !hasMore && allClients.length > 0 && (
          <div style={styles.endMessage}>
            Все клиенты загружены
          </div>
        )}
      </div>

      {/* Модалки остаются те же */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingClient ? 'Редактирование клиента' : 'Новый клиент'}
        width="600px"
      >
        <form onSubmit={handleSubmit}>
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
              <label style={styles.label}>Дата рождения</label>
              <input
                type="date"
                value={formData.birthdate}
                onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroupFull}>
              <label style={styles.label}>Статус лояльности</label>
              <CustomSelect
                value={formData.loyaltystatus}
                onChange={(value) => setFormData({...formData, loyaltystatus: value})}
                options={[
                  { value: 'Basic', label: 'Basic' },
                  { value: 'Silver', label: 'Silver' },
                  { value: 'Gold', label: 'Gold' },
                  { value: 'Platinum', label: 'Platinum' }
                ]}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Заметки</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              style={styles.textarea}
              placeholder="Дополнительная информация о клиенте..."
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
              {editingClient ? 'Сохранить изменения' : 'Создать клиента'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, clientId: null, clientName: '' })}
        onConfirm={confirmDelete}
        title="Удаление клиента"
        message={`Вы действительно хотите удалить клиента "${confirmModal.clientName}"? Это действие нельзя отменить.`}
      />
    </div>
  );
}

// Стили остаются те же...
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
  filterBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
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
  clientName: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: '500',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#e0e7ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#3b82f6',
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
  loadingMore: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '20px',
    color: '#6b7280',
    fontSize: '14px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadTrigger: {
    height: '1px',
    minHeight: '1px',
  },
  endMessage: {
    textAlign: 'center',
    padding: '20px',
    color: '#9ca3af',
    fontSize: '14px',
    borderTop: '1px solid #e5e7eb',
    marginBottom: '30px',
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
  
  button {
    transition: all 0.2s ease !important;
  }
  
  button:active {
    transform: scale(0.98) !important;
  }
`;
document.head.appendChild(styleSheet);

export default ClientList;

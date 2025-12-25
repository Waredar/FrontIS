import React, { useState, useEffect } from 'react';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdInventory, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import { toast } from 'react-toastify';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api';
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

function ProductList() {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  // Состояние для сортировки
  const [sortField, setSortField] = useState('productname');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Состояние для модалки подтверждения
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    productId: null,
    productName: ''
  });
  
  const [formData, setFormData] = useState({
    productname: '',
    category: '',
    unit: 'шт',
    unitprice: '',
    stockquantity: '',
    isactive: true
  });

  useEffect(() => {
    loadProducts();
  }, []);

  // Применение поиска и сортировки
  useEffect(() => {
    let result = [...allProducts];
    
    // Поиск
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(product => 
        product.productname.toLowerCase().includes(searchLower) ||
        (product.category && product.category.toLowerCase().includes(searchLower))
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
    
    setFilteredProducts(result);
  }, [allProducts, debouncedSearch, sortField, sortDirection]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setAllProducts(data);
    } catch (error) {
      toast.error('Ошибка загрузки товаров');
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
        productname: formData.productname,
        category: formData.category,
        unit: formData.unit,
        unitprice: parseFloat(formData.unitprice),
        stockquantity: parseInt(formData.stockquantity),
        isactive: formData.isactive
      };

      if (editingProduct) {
        await updateProduct(editingProduct.productid, payload);
        toast.success('Товар обновлён');
      } else {
        await createProduct(payload);
        toast.success('Товар создан');
      }
      handleCloseModal();
      loadProducts();
    } catch (error) {
      toast.error('Ошибка сохранения товара');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      productname: product.productname,
      category: product.category || '',
      unit: product.unit || 'шт',
      unitprice: product.unitprice != null ? product.unitprice.toString() : '',
      stockquantity: product.stockquantity != null ? product.stockquantity.toString() : '0',
      isactive: product.isactive !== undefined ? product.isactive : true
    });
    setShowModal(true);
  };

  const handleDelete = (productId, productName) => {
    setConfirmModal({
      isOpen: true,
      productId,
      productName
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(confirmModal.productId);
      toast.success('Товар удалён');
      loadProducts();
    } catch (error) {
      toast.error('Ошибка удаления товара');
    } finally {
      setConfirmModal({ isOpen: false, productId: null, productName: '' });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      productname: '',
      category: '',
      unit: 'шт',
      unitprice: '',
      stockquantity: '',
      isactive: true
    });
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

  const getStockColor = (quantity) => {
    if (quantity === 0) return '#ef4444';
    if (quantity < 10) return '#f59e0b';
    return '#059669';
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
          <h1 style={styles.title}>Товары</h1>
          <p style={styles.subtitle}>
            {filteredProducts.length === allProducts.length 
              ? `Всего: ${allProducts.length}`
              : `Найдено: ${filteredProducts.length} из ${allProducts.length}`}
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
          Добавить товар
        </button>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <MdSearch size={20} color="#6b7280" />
          <input
            type="text"
            placeholder="Поиск по названию или категории..."
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
            <p>Загрузка товаров...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <p>{search ? 'Товары не найдены' : 'Список товаров пуст'}</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>№</th>
                <th 
                  style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('productname')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Название <SortIcon field="productname" />
                  </div>
                </th>
                <th 
                  style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('category')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Категория <SortIcon field="category" />
                  </div>
                </th>
                <th 
                  style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('unit')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Единица <SortIcon field="unit" />
                  </div>
                </th>
                <th 
                  style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('unitprice')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Цена <SortIcon field="unitprice" />
                  </div>
                </th>
                <th 
                  style={{...styles.th, cursor: 'pointer', userSelect: 'none'}} 
                  onClick={() => handleSort('stockquantity')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    Остаток <SortIcon field="stockquantity" />
                  </div>
                </th>
                <th style={{...styles.th, textAlign: 'center'}}>Статус</th>
                <th style={styles.th}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product.productid} style={styles.tr}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    <div style={styles.productName}>
                      <div style={styles.icon}>
                        <MdInventory size={18} />
                      </div>
                      {product.productname}
                    </div>
                  </td>
                  <td style={styles.td}>{product.category || '—'}</td>
                  <td style={styles.td}>{product.unit}</td>
                  <td style={styles.td}>
                    <span style={styles.price}>{formatPrice(product.unitprice)}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      fontWeight: '600',
                      color: getStockColor(product.stockquantity)
                    }}>
                      {product.stockquantity} {product.unit}
                    </span>
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: product.isactive ? '#d1fae5' : '#fee2e2',
                      color: product.isactive ? '#065f46' : '#991b1b'
                    }}>
                      {product.isactive ? 'Активен' : 'Не активен'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button 
                        onClick={() => handleEdit(product)} 
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
                        onClick={() => handleDelete(product.productid, product.productname)} 
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
        title={editingProduct ? 'Редактирование товара' : 'Новый товар'}
        width="600px"
      >
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.formGroupFull}>
              <label style={styles.label}>
                Название товара <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={formData.productname}
                onChange={(e) => setFormData({...formData, productname: e.target.value})}
                style={styles.input}
                placeholder="Шампунь, краска для волос..."
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Категория</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                style={styles.input}
                placeholder="Косметика, инструменты..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Единица измерения <span style={styles.required}>*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                style={styles.input}
                required
              >
                <option value="шт">шт</option>
                <option value="л">л</option>
                <option value="мл">мл</option>
                <option value="кг">кг</option>
                <option value="г">г</option>
                <option value="м">м</option>
                <option value="упак">упак</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Цена за единицу (₽) <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                value={formData.unitprice}
                onChange={(e) => setFormData({...formData, unitprice: e.target.value})}
                style={styles.input}
                placeholder="500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Количество на складе <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                value={formData.stockquantity}
                onChange={(e) => setFormData({...formData, stockquantity: e.target.value})}
                style={styles.input}
                placeholder="100"
                min="0"
                required
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
              Товар активен
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
              {editingProduct ? 'Сохранить изменения' : 'Создать товар'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, productId: null, productName: '' })}
        onConfirm={confirmDelete}
        title="Удаление товара"
        message={`Вы действительно хотите удалить товар "${confirmModal.productName}"? Это действие нельзя отменить.`}
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
  productName: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: '500',
  },
  icon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#e0e7ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6366f1',
    flexShrink: 0,
  },
  price: {
    fontWeight: '600',
    color: '#059669',
    fontSize: '15px',
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

export default ProductList;

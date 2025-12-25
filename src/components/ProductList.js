import React, { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    productname: '',
    category: '',
    unit: '',
    unitprice: '',
    stockquantity: '',
    isactive: true
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      alert('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        unitprice: parseFloat(formData.unitprice),
        stockquantity: parseInt(formData.stockquantity)
      };
      
      if (editingProduct) {
        await updateProduct(editingProduct.productid, payload);
      } else {
        await createProduct(payload);
      }
      
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ productname: '', category: '', unit: '', unitprice: '', stockquantity: '', isactive: true });
      loadProducts();
    } catch (error) {
      alert('Ошибка сохранения товара');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      productname: product.productname,
      category: product.category || '',
      unit: product.unit,
      unitprice: product.unitprice.toString(),
      stockquantity: product.stockquantity.toString(),
      isactive: product.isactive
    });
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await deleteProduct(productId);
      loadProducts();
    } catch (error) {
      alert('Ошибка удаления товара');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({ productname: '', category: '', unit: '', unitprice: '', stockquantity: '', isactive: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Товары ({products.length})</h2>
        <button onClick={() => setShowForm(!showForm)} style={styles.addButton}>
          {showForm ? 'Отмена' : '+ Добавить товар'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3>{editingProduct ? 'Редактирование товара' : 'Новый товар'}</h3>
          
          <label style={styles.label}>Название *</label>
          <input
            type="text"
            value={formData.productname}
            onChange={(e) => setFormData({...formData, productname: e.target.value})}
            style={styles.input}
            required
          />

          <label style={styles.label}>Категория</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            style={styles.input}
            placeholder="Косметика, Аксессуары..."
          />

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
            <div>
              <label style={styles.label}>Единица измерения *</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                style={styles.input}
                placeholder="шт, мл, г..."
                required
              />
            </div>
            
            <div>
              <label style={styles.label}>Цена за единицу (₽) *</label>
              <input
                type="number"
                value={formData.unitprice}
                onChange={(e) => setFormData({...formData, unitprice: e.target.value})}
                style={styles.input}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <label style={styles.label}>Остаток на складе *</label>
          <input
            type="number"
            value={formData.stockquantity}
            onChange={(e) => setFormData({...formData, stockquantity: e.target.value})}
            style={styles.input}
            required
            min="0"
          />

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.isactive}
              onChange={(e) => setFormData({...formData, isactive: e.target.checked})}
            />
            <span style={{marginLeft: '8px'}}>Активен</span>
          </label>

          <div style={styles.formButtons}>
            <button type="submit" style={styles.submitButton}>
              {editingProduct ? 'Сохранить' : 'Создать'}
            </button>
            <button type="button" onClick={handleCancel} style={styles.cancelButton}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Название</th>
              <th style={styles.th}>Категория</th>
              <th style={styles.th}>Ед. изм.</th>
              <th style={styles.th}>Цена</th>
              <th style={styles.th}>Остаток</th>
              <th style={styles.th}>Статус</th>
              <th style={styles.th}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.productid} style={styles.tr}>
                <td style={styles.td}>{product.productname}</td>
                <td style={styles.td}>{product.category || '—'}</td>
                <td style={styles.td}>{product.unit}</td>
                <td style={styles.td}>{product.unitprice} ₽</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.stockBadge,
                    backgroundColor: product.stockquantity === 0 ? '#dc3545' :
                                   product.stockquantity < 10 ? '#ffc107' : '#28a745'
                  }}>
                    {product.stockquantity}
                  </span>
                </td>
                <td style={styles.td}>
                  {product.isactive ? (
                    <span style={styles.badgeActive}>Активен</span>
                  ) : (
                    <span style={styles.badgeInactive}>Неактивен</span>
                  )}
                </td>
                <td style={styles.td}>
                  <button onClick={() => handleEdit(product)} style={styles.editButtonSmall}>
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(product.productid)} style={styles.deleteButtonSmall}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  addButton: { padding: '12px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  form: { marginBottom: '30px', padding: '25px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' },
  input: { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
  checkboxLabel: { display: 'flex', alignItems: 'center', marginBottom: '20px' },
  formButtons: { display: 'flex', gap: '10px' },
  submitButton: { padding: '12px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  cancelButton: { padding: '12px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  th: { padding: '15px', textAlign: 'left', backgroundColor: '#f8f9fa', fontWeight: 'bold', borderBottom: '2px solid #dee2e6' },
  td: { padding: '12px 15px', borderBottom: '1px solid #dee2e6' },
  tr: { transition: 'background-color 0.2s' },
  stockBadge: { padding: '4px 12px', color: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  badgeActive: { padding: '4px 12px', backgroundColor: '#28a745', color: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  badgeInactive: { padding: '4px 12px', backgroundColor: '#6c757d', color: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  editButtonSmall: { padding: '6px 12px', marginRight: '5px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  deleteButtonSmall: { padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};

export default ProductList;

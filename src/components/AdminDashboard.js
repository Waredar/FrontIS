import React, { useState } from 'react';
import { MdPeople, MdContentCut, MdMedicalServices, MdInventory, MdAssignment, MdCalendarToday, MdLogout } from 'react-icons/md';
import ClientList from './ClientList';
import MasterList from './MasterList';
import ServiceList from './ServiceList';
import ProductList from './ProductList';
import AppointmentList from './AppointmentList';

function AdminDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState('clients');

  const menuItems = [
    { id: 'clients', label: 'Клиенты', icon: MdPeople },
    { id: 'masters', label: 'Мастера', icon: MdContentCut },
    { id: 'services', label: 'Услуги', icon: MdMedicalServices },
    { id: 'products', label: 'Товары', icon: MdInventory },
    { id: 'appointments', label: 'Заказы', icon: MdAssignment },
    { id: 'calendar', label: 'Календарь', icon: MdCalendarToday },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'clients': return <ClientList />;
      case 'masters': return <MasterList />;
      case 'services': return <ServiceList />;
      case 'products': return <ProductList />;
      case 'appointments': return <AppointmentList />;
      case 'calendar': return <div style={styles.placeholder}>Календарь в разработке</div>;
      default: return <ClientList />;
    }
  };

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>💈</div>
          <h2 style={styles.logoText}>Салон</h2>
        </div>
        
        <nav style={styles.nav}>
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={activeSection === item.id ? styles.navItemActive : styles.navItem}
              >
                <Icon size={20} />
                <span style={styles.navItemText}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {user.fullname.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={styles.userName}>{user.fullname}</div>
              <div style={styles.userRole}>Администратор</div>
            </div>
          </div>
          <button onClick={onLogout} style={styles.logoutBtn}>
            <MdLogout size={18} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        {renderContent()}
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f5f7fa',
    overflow: 'hidden',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#1e293b',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto',
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
  },
  logo: {
    padding: '30px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '32px',
  },
  logoText: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  nav: {
    flex: 1,
    padding: '20px 0',
  },
  navItem: {
    width: '100%',
    padding: '14px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '15px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: '500',
  },
  navItemActive: {
    width: '100%',
    padding: '14px 20px',
    border: 'none',
    backgroundColor: '#334155',
    color: 'white',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    borderLeft: '3px solid #3b82f6',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navItemText: {
    flex: 1,
  },
  sidebarFooter: {
    padding: '20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '15px',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
  },
  userRole: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  logoutBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s',
  },
  main: {
    marginLeft: '260px',
    flex: 1,
    padding: '30px',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  placeholder: {
    padding: '60px',
    textAlign: 'center',
    color: '#999',
    fontSize: '18px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
};


export default AdminDashboard;

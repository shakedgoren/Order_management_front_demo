import { NavLink } from 'react-router-dom';
import { useAuth } from './AuthBridge';

const NAV_ITEMS = [
  { path: '/dashboard',           label: 'משמרת',    icon: '📋', end: true  },
  { path: '/dashboard/current',   label: 'הזמנות',   icon: '🛍️', end: false },
  { path: '/dashboard/customers', label: 'לקוחות',   icon: '👥', end: false },
  { path: '/dashboard/history',   label: 'היסטוריה', icon: '📊', end: false },
];

export default function BottomNav() {
  const { role } = useAuth();
  const items = role === 'admin'
    ? NAV_ITEMS
    : NAV_ITEMS.filter(i => i.path === '/dashboard/current');

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

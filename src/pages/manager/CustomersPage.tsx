import { useState, useEffect } from 'react';
import api from '../../api';
import { Customer, Order } from '../../types';

interface CustomerWithHistory extends Customer {
  orders_count?: number;
  last_order_date?: string;
  orders?: Order[];
}

const fmtDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithHistory[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const url = search.trim() ? `/customers/?name=${encodeURIComponent(search)}` : '/customers/';
        const r = await api.get(url);
        setCustomers(r.data?.results ?? r.data ?? []);
      } catch { setCustomers([]); }
      setLoading(false);
    };
    const t = setTimeout(fetch, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search]);

  const toggleExpand = async (cId: number) => {
    if (expandedId === cId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(cId);

    // Check if we already have orders for this customer
    const curr = customers.find(c => c.id === cId);
    if (curr && !curr.orders) {
      try {
        const r = await api.get(`/customers/${cId}/`);
        setCustomers(prev => prev.map(c => c.id === cId ? { ...c, orders: r.data.orders } : c));
      } catch { }
    }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <h1 className="page-title">👥 לקוחות</h1>
        <p className="page-subtitle">{customers.length} לקוחות פעילים</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          className="f-input"
          placeholder="🔍 חיפוש לפי שם..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : customers.length === 0 ? (
        <div className="empty-s">
          <div className="ei">👤</div>
          <h3>לא נמצאו לקוחות</h3>
          <p>{search ? 'נסי חיפוש אחר' : 'לא קיימים לקוחות עדיין'}</p>
        </div>
      ) : (
        <div className="cust-list" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {customers.map(c => {
            const isExp = expandedId === c.id;
            return (
              <div key={c.id}
                className={`cust-card ${isExp ? 'expanded' : ''}`}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  border: `1.5px solid ${isExp ? 'var(--amber)' : 'var(--ink-06)'}`,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: isExp ? '0 10px 25px -5px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <div
                  className="cust-row"
                  onClick={() => toggleExpand(c.id)}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div className="cr-left" style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div className="cr-avatar" style={{
                      width: 44, height: 44, borderRadius: '50%', background: isExp ? 'var(--amber)' : 'var(--ink-06)',
                      color: isExp ? '#fff' : 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 900
                    }}>
                      {c.name?.[0] ?? '?'}
                    </div>
                    <div>
                      <div className="cr-name" style={{ fontWeight: 800, fontSize: 16 }}>{c.name}</div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                        {c.phone && <span style={{ fontSize: 12, color: 'var(--ink-50)' }}>📞 {c.phone}</span>}
                        {c.last_order_date && <span style={{ fontSize: 12, color: 'var(--ink-30)' }}>🕒 הזמנה אחרונה: {new Date(c.last_order_date).toLocaleDateString('he-IL')}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="cr-orders" style={{
                      background: 'var(--amber-soft)', color: 'var(--amber)',
                      padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 800
                    }}>
                      {c.orders_count || 0} הזמנות
                    </div>
                    <div style={{ fontSize: 18, color: 'var(--ink-30)', transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</div>
                  </div>
                </div>

                {isExp && (
                  <div className="cust-details" style={{ padding: '0 20px 20px', borderTop: '1px solid var(--ink-06)', background: '#f9fafb' }}>
                    <div style={{ marginTop: 15 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-50)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        📋 היסטוריית הזמנות
                      </h4>
                      {!c.orders ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}><div className="spinner" style={{ width: 20, height: 20 }} /></div>
                      ) : c.orders.length === 0 ? (
                        <div style={{ fontSize: 13, color: 'var(--ink-30)', textAlign: 'center', padding: '10px' }}>אין הזמנות קודמות לקוח זה</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {c.orders.map(o => (
                            <div key={o.id} style={{ background: '#fff', padding: 12, borderRadius: 10, border: '1px solid var(--ink-06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 800 }}>{fmtDate(o.created_at)}</div>
                                <div style={{ fontSize: 11, color: 'var(--ink-30)', marginTop: 2 }}>
                                  {o.order_type === 'delivery' ? `🛵 משלוח ל-${o.delivery_address || '—'}` : `🏠 איסוף מ-${o.location === 'yavne' ? 'יבנה' : 'עיינות'}`}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                  {o.items?.map(i => (
                                    <span key={i.item_name} style={{ fontSize: 10, background: 'var(--ink-06)', padding: '2px 6px', borderRadius: 4 }}>
                                      {i.item_name} ×{i.quantity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 14, fontWeight: 900 }}>₪{o.total_price}</div>
                                <div style={{
                                  fontSize: 10, fontWeight: 800, marginTop: 4,
                                  color: o.status === 'done' ? '#059669' : 'var(--amber)',
                                  background: o.status === 'done' ? '#ecfdf5' : 'var(--amber-soft)',
                                  padding: '2px 6px', borderRadius: 4, textAlign: 'center'
                                }}>
                                  {o.status === 'done' ? 'בוצע' : 'ממתין'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

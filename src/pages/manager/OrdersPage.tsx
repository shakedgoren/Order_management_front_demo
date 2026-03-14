import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../api';
import { useToast } from '../../App';
import { fetchCurrentShabbat } from '../../store/shabbatSlice';
import { fetchOrders, createOrder, updateOrder, updateOrderStatus, optimisticUpdateOrder } from '../../store/ordersSlice';
import { RootState, AppDispatch } from '../../store';
import { Order, Customer, Inventory, PaymentType } from '../../types';

const ORDER_ITEMS = [
  "ג'חנון", "ג'חנון חמאה", "תוספת ביצה", "תוספת רסק",
  "קובנה", "בורקס גבינה", 'בורקס תפו"א', "בורקס תרד",
  "זיווה", "מלוואח", "מלוואח ממולא", "מלוואח מגולגל",
  "פתות", "לאבנה", "מלבי", "מיץ תפוזים", "מיץ רימונים", "עוגת שמרים", "מאפים",
];
const ITEM_PRICES: Record<string, number> = {
  "ג'חנון": 22, "ג'חנון חמאה": 25, "תוספת ביצה": 3, "תוספת רסק": 3,
  "קובנה": 25, "בורקס גבינה": 27, 'בורקס תפו"א': 27, "בורקס תרד": 27,
  "זיווה": 30, "מלוואח": 30, "מלוואח ממולא": 30, "מלוואח מגולגל": 30,
  "פתות": 35, "לאבנה": 35, "מלבי": 12, "מיץ תפוזים": 25, "מיץ רימונים": 25, "עוגת שמרים": 45, "מאפים": 34,
};
const WALK_IN_ITEMS = ["ג'חנון", "ג'חנון חמאה", "בורקס גבינה", 'בורקס תפו"א', "בורקס תרד", "מלבי", "קובנה"];
const INV_LABELS: Record<string, string> = {
  jachnun: "ג'חנון", jachnun_butter: "ג'חנון חמאה", kubane: "קובנה",
  burekas_cheese: "בורקס גבינה", burekas_potato: 'בורקס תפו"א',
  burekas_spinach: "בורקס תרד", malabi: "מלבי", orange_juice: "מיץ תפוזים",
};
const INV_REV: Record<string, string> = Object.fromEntries(Object.entries(INV_LABELS).map(([k, v]) => [v, k]));
const PAY_OPTS = [{ v: 'none', l: '-' }, { v: 'bit', l: 'ביט 📱' }, { v: 'cash', l: 'מזומן 💵' }, { v: 'credit', l: 'אשראי 💳' }];
const PAY_LBL: Record<string, string> = { none: '-', bit: '📱 ביט', cash: '💵 מזומן', credit: '💳 אשראי' };
const PAY_CLASS: Record<string, string> = { cash: 'cash', bit: 'bit', credit: 'credit', paybox: 'bit', none: '' };
const SLOTS = (() => { const s: string[] = []; let h = 8, m = 30; while (h < 13 || (h === 13 && m <= 30)) { s.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`); m += 10; if (m >= 60) { m = 0; h++; } } return s; })();
const fmt = (p: number) => `₪${p.toLocaleString('he-IL')}`;

// ─── Inventory Bar ────────────────────────────────────
function InvBar({ inv }: { inv?: Inventory }) {
  if (!inv) return null;
  return (
    <div className="inv-bar">
      <div className="inv-bar-title">מלאי נוכחי</div>
      <div className="inv-chips">
        {Object.entries(INV_LABELS).map(([k, lbl]) => {
          const val = inv[k] as number;
          if (val == null) return null;
          return (
            <div key={k} className={`inv-chip${val <= 0 ? ' low' : ''}`}>
              <div className="inv-chip-val">{val}</div>
              <div className="inv-chip-lbl">{lbl}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Items picker ─────────────────────────────────────
function ItemsPicker({ items, inv, onChange }: { items: Record<string, number>; inv?: Inventory; onChange: (n: string, q: number) => void }) {
  return (
    <div className="items-g">
      {ORDER_ITEMS.map(name => {
        const k = INV_REV[name];
        const rem = (inv && k && inv[k] != null) ? inv[k] as number : null;
        const isOut = rem !== null && rem <= 0;
        return (
          <div key={name} className="item-r" style={isOut ? { opacity: 0.45, pointerEvents: 'none' } : {}}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexGrow: 1 }}>
              <div className="item-r-lbl">{name}</div>
              {rem !== null && rem > 0 && <div style={{ fontSize: 11, color: rem <= 5 ? 'var(--red)' : 'var(--ink)', fontWeight: 1000 }}>מלאי: {rem}</div>}
              {(isOut || rem == 0) && <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 1000, }}>אזל!</div>}
            </div>
            <input type="number" min="0" className="item-r-inp" placeholder=""
              value={items[name] || ''} disabled={isOut || rem == 0}
              onChange={e => { let v = parseInt(e.target.value) || 0; if (rem !== null && v > rem) v = rem; onChange(name, v); }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Customer autocomplete ────────────────────────────
function CustAuto({ name, phone, onSelect, onName, onPhone }: { name: string; phone: string; onSelect: (c: Customer) => void; onName: (v: string) => void; onPhone: (v: string) => void }) {
  const [sugg, setSugg] = useState<Customer[]>([]); const [open, setOpen] = useState(false); const t = useRef<any>(null);
  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; onName(v);
    if (t.current) clearTimeout(t.current);
    if (v.length < 1) { setSugg([]); setOpen(false); return; }
    t.current = setTimeout(async () => { try { const r = await api.get(`/customers/?name=${encodeURIComponent(v)}`); setSugg(r.data); setOpen(r.data.length > 0); } catch { } }, 300);
  };
  return (
    <div>
      <div className="f-group" style={{ position: 'relative' }}>
        <label className="f-label">שם לקוח</label>
        <input className="f-input" placeholder="הקלד שם..." value={name} onChange={handleName}
          onBlur={() => setTimeout(() => setOpen(false), 180)} autoComplete="off" />
        {open && <div className="autocomplete-dropdown">
          {sugg.map(c => <div key={c.id} className="autocomplete-item" onMouseDown={() => { onSelect(c); setOpen(false); }}>
            <div className="ac-name">{c.name}</div>
            <div className="ac-phone">{c.phone}{c.address ? ` · ${c.address}` : ''}</div>
          </div>)}
        </div>}
      </div>
      <div className="f-group">
        <label className="f-label">טלפון</label>
        <input className="f-input" placeholder="05X-XXXXXXX" value={phone} onChange={e => onPhone(e.target.value)} style={{ direction: 'ltr' }} />
      </div>
    </div>
  );
}

// ─── Payment selector ─────────────────────────────────
function PayOpts({ value, onChange }: { value: string; onChange: (v: PaymentType) => void }) {
  return (
    <div>
      <label className="f-label" style={{ marginBottom: 8, display: 'block' }}>אמצעי תשלום</label>
      <div className="pay-opts">
        {PAY_OPTS.filter(o => o.v !== 'none').map(o => (
          <div key={o.v} className={`pay-opt${value === o.v ? ' sel' : ''}`} onClick={() => onChange(o.v as PaymentType)}>{o.l}</div>
        ))}
      </div>
    </div>
  );
}

// ─── New Order Drawer ─────────────────────────────────
function NewOrderDrawer({ shabbat, location, onClose }: { shabbat: { id: number; inventory?: Inventory[]; has_delivery: boolean }; location: 'yavne' | 'ayyanot'; onClose: () => void }) {
  const toast = useToast(); const dispatch = useDispatch<AppDispatch>();
  const orders = useSelector((s: RootState) => s.orders.list);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [cName, setCName] = useState(''); const [cPhone, setCPhone] = useState('');
  const [cAddr, setCAddr] = useState(''); const [cId, setCId] = useState<number | null>(null);
  const [delTime, setDelTime] = useState(''); const [pay, setPay] = useState<PaymentType>('none');
  const [notes, setNotes] = useState(''); const [items, setItems] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const existingTimes = orders.filter(o => o.order_type === 'delivery').map(o => o.delivery_time);
  const slots = SLOTS.filter(s => !existingTimes.includes(s));
  const isDelivery = location === 'yavne' && orderType === 'delivery';
  const inv = shabbat.inventory?.find(i => i.location === location);
  const total = Object.entries(items).reduce((a, [n, q]) => a + (ITEM_PRICES[n] || 0) * q, 0);
  const submit = async () => {
    if (!cName.trim() || !cPhone.trim()) { toast('יש להזין שם וטלפון', 'error'); return; }
    setLoading(true);
    const itemsList = Object.entries(items).filter(([, q]) => q > 0).map(([item_name, quantity]) => ({ item_name, quantity }));
    try {
      await dispatch(createOrder({
        shabbat_id: shabbat.id, customer_id: cId, customer_name: cName, customer_phone: cPhone,
        customer_address: isDelivery ? cAddr : undefined, location, order_type: location === 'ayyanot' ? 'pickup' : orderType,
        delivery_time: isDelivery ? delTime : undefined, delivery_address: isDelivery ? cAddr : undefined,
        payment_type: pay, notes, items: itemsList
      })).unwrap();
      toast('ההזמנה נוצרה! 🎉', 'success'); dispatch(fetchCurrentShabbat()); onClose();
    } catch (e) { toast(typeof e === 'string' ? e : 'שגיאה', 'error'); }
    setLoading(false);
  };
  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="drawer">
        <div className="drawer-handle" />
        <div className="drawer-header">
          <span className="drawer-title">➕ הזמנה חדשה — {location === 'yavne' ? 'יבנה' : 'עיינות'}</span>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">
          {location === 'yavne' && (
            <div className="f-group">
              <label className="f-label">סוג הזמנה</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['pickup', 'delivery'].map(t => (
                  <div key={t} className={`pay-opt${orderType === t ? ' sel' : ''}`} style={{ flex: 1, textAlign: 'center' }} onClick={() => setOrderType(t as any)}>
                    {t === 'pickup' ? '🏠 איסוף' : '🛵 משלוח'}
                  </div>
                ))}
              </div>
            </div>
          )}
          <CustAuto name={cName} phone={cPhone}
            onSelect={c => { setCId(c.id); setCName(c.name); setCPhone(c.phone); if (c.address) setCAddr(c.address); }}
            onName={n => { setCName(n); setCId(null); }} onPhone={setCPhone} />
          {isDelivery && <>
            <div className="f-group">
              <label className="f-label">כתובת משלוח</label>
              <input className="f-input" placeholder="רחוב, מספר, עיר" value={cAddr} onChange={e => setCAddr(e.target.value)} />
            </div>
            <div className="f-group">
              <label className="f-label">שעת משלוח</label>
              <select className="f-input" value={delTime} onChange={e => setDelTime(e.target.value)} style={{ direction: 'ltr' }}>
                <option value="">בחר שעה...</option>
                {slots.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </>}
          <div className="f-group">
            <label className="f-label">פרטי הזמנה</label>
            <ItemsPicker items={items} inv={inv} onChange={(n, q) => setItems(p => ({ ...p, [n]: q }))} />
          </div>
          <PayOpts value={pay} onChange={setPay} />
          <div className="f-group">
            <label className="f-label">הערות</label>
            <textarea className="f-input" rows={2} placeholder="הערות..." value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'none' }} />
          </div>
          {total > 0 && <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 900, color: 'var(--amber)' }}>{fmt(total)}</div>}
          <button className="submit-btn" onClick={submit} disabled={loading}>{loading ? '⏳ יוצר...' : 'צור הזמנה ✓ '}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Order Drawer ────────────────────────────────
function EditOrderDrawer({ order, shabbat, onClose }: { order: Order; shabbat: { inventory?: Inventory[] }; onClose: () => void }) {
  const toast = useToast(); const dispatch = useDispatch<AppDispatch>();
  const orders = useSelector((s: RootState) => s.orders.list);
  const [items, setItems] = useState<Record<string, number>>(Object.fromEntries((order.items || []).map(i => [i.item_name, i.quantity])));
  const [notes, setNotes] = useState(order.notes || '');
  const [delTime, setDelTime] = useState(order.delivery_time || '');
  const [delAddr, setDelAddr] = useState(order.delivery_address || '');
  const [loading, setLoading] = useState(false);
  const existing = orders.filter(o => o.order_type === 'delivery' && o.id !== order.id).map(o => o.delivery_time);
  const slots = SLOTS.filter(s => s === order.delivery_time || !existing.includes(s));
  const inv = shabbat.inventory?.find(i => i.location === order.location);
  const total = Object.entries(items).reduce((a, [n, q]) => a + (ITEM_PRICES[n] || 0) * q, 0);
  const save = async () => {
    setLoading(true);
    const itemsList = Object.entries(items).filter(([, q]) => q > 0).map(([item_name, quantity]) => ({ item_name, quantity }));
    try {
      await dispatch(updateOrder({ orderId: order.id, data: { notes, delivery_time: delTime || undefined, delivery_address: delAddr || undefined, items: itemsList } })).unwrap();
      toast('עודכן', 'success'); dispatch(fetchCurrentShabbat()); onClose();
    } catch { toast('שגיאה', 'error'); }
    setLoading(false);
  };
  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="drawer">
        <div className="drawer-handle" />
        <div className="drawer-header">
          <span className="drawer-title">✏️ עריכת הזמנה — {order.customer?.name || '?'}</span>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">
          {order.order_type === 'delivery' && <>
            <div className="f-group"><label className="f-label">כתובת</label><input className="f-input" value={delAddr} onChange={e => setDelAddr(e.target.value)} /></div>
            <div className="f-group">
              <label className="f-label">שעת משלוח</label>
              <select className="f-input" value={delTime} onChange={e => setDelTime(e.target.value)} style={{ direction: 'ltr' }}>
                <option value="">בחר שעה...</option>
                {slots.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </>}
          <div className="f-group"><label className="f-label">פרטי הזמנה</label><ItemsPicker items={items} inv={inv} onChange={(n, q) => setItems(p => ({ ...p, [n]: q }))} /></div>
          <div className="f-group"><label className="f-label">הערות</label><textarea className="f-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'none' }} /></div>
          {total > 0 && <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 900, color: 'var(--amber)' }}>{fmt(total)}</div>}
          <button className="submit-btn" onClick={save} disabled={loading}>{loading ? '⏳ שומר...' : '💾 שמור'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Walk-In Card ─────────────────────────────────────
function WalkInCard({ walkIn, inv }: { walkIn: Order; inv?: Inventory }) {
  const toast = useToast(); const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    WALK_IN_ITEMS.forEach(n => { m[n] = 0; });
    (walkIn.items || []).forEach(i => { if (WALK_IN_ITEMS.includes(i.item_name)) m[i.item_name] = i.quantity; });
    return m;
  });
  const latRef = useRef(local); const dbRef = useRef<any>(null);
  const send = useCallback((map: Record<string, number>) => {
    const lst = Object.entries(map).filter(([, q]) => q > 0).map(([item_name, quantity]) => ({ item_name, quantity }));
    const tot = lst.reduce((s, i) => s + (ITEM_PRICES[i.item_name] || 0) * i.quantity, 0);
    dispatch(optimisticUpdateOrder({ orderId: walkIn.id, items: lst, totalPrice: tot }));
    dispatch(updateOrder({ orderId: walkIn.id, data: { items: lst } })).unwrap()
      .then(() => dispatch(fetchCurrentShabbat())).catch(() => toast('שגיאה', 'error'));
  }, [dispatch, walkIn.id, toast]);
  const getMax = (name: string, currentState: Record<string, number>): number | null => {
    const k = INV_REV[name];
    if (!inv || !k || inv[k] == null) return null;
    return Number(inv[k]) + (currentState[name] || 0);
  };
  const adj = (name: string, d: number) => setLocal(p => {
    if (d > 0) {
      const max = getMax(name, p);
      if (max !== null && ((p[name] || 0) + d) > max) {
        toast(`אין מלאי עבור ${name}`, 'error');
        return p;
      }
    }
    const n = Math.max(0, (p[name] || 0) + d); const u = { ...p, [name]: n };
    latRef.current = u; if (dbRef.current) clearTimeout(dbRef.current);
    dbRef.current = setTimeout(() => send(latRef.current), 300); return u;
  });
  const total = Object.entries(local).reduce((s, [n, q]) => s + (ITEM_PRICES[n] || 0) * q, 0);
  const summary = Object.entries(local).filter(([, v]) => v > 0).map(([k, v]) => `${k} ×${v}`).join(' · ') || 'לחץ לעדכון';
  return (
    <>
      <div className="walkin-c" onClick={() => setOpen(true)}>
        <div className="wc-left">
          <div className="wc-icon">🏠</div>
          <div><div className="wc-title">הזמינו במקום</div><div className="wc-items">{summary}</div></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div className="wc-price">{total > 0 ? fmt(total) : '—'}</div>
          <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>עדכן ✏️</div>
        </div>
      </div>
      {open && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="drawer">
            <div className="drawer-handle" />
            <div className="drawer-header">
              <span className="drawer-title">🏠 הזמינו במקום</span>
              <button className="drawer-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="drawer-body">
              <div className="items-g">
                {WALK_IN_ITEMS.map(name => {
                  const qty = local[name] || 0;
                  return (
                    <div key={name} className="item-r" style={{ background: qty > 0 ? 'rgba(232,134,12,0.08)' : 'var(--surf2)', border: `1.5px solid ${qty > 0 ? 'rgba(232,134,12,0.3)' : 'var(--ink-06)'}` }}>
                      <div className="item-r-lbl">{name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button disabled={qty === 0} onClick={() => adj(name, -1)}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--ink-12)', background: 'var(--white)', fontSize: 16, fontWeight: 700, cursor: qty > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-50)' }}>−</button>
                        <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 900, fontSize: 16, color: qty > 0 ? 'var(--amber)' : 'var(--ink)' }}>{qty}</span>
                        <button onClick={() => adj(name, 1)}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--amber)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {total > 0 && <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 900, color: 'var(--amber)' }}>{fmt(total)}</div>}
              <button className="submit-btn" onClick={() => setOpen(false)}>אישור ✓</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Order Card ───────────────────────────────────────
function OrderCard({ order, isDelivery, onStatus, onPay, onEdit }: { order: Order; isDelivery: boolean; onStatus: (o: Order) => void; onPay: (o: Order, p: PaymentType) => void; onEdit: (o: Order) => void }) {
  const [exp, setExp] = useState(false);
  const isDone = order.status === 'done';
  const chips = order.items || [];
  const locLbl = order.location === 'yavne' ? 'יבנה' : 'עיינות';
  const timeLbl = isDelivery ? (order.delivery_time || '—') : new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const payClass = PAY_CLASS[order.payment_type] || '';
  const payLbl = PAY_LBL[order.payment_type] || '';
  return (
    <div className={`ord-card s-${order.status}`} onClick={() => setExp(v => !v)}>

      {/* שורה יחידה: שם | chips | סטטוס */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8 }}>
        <div style={{ flexShrink: 0 }}>
          <div className="card-name" style={{ fontSize: 14 }}>{order.customer?.name || (order.is_walk_in ? 'במקום' : '—')}</div>
          <div className="card-time" style={{ fontSize: 11 }}>{timeLbl} · {locLbl}</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1, minWidth: 0 }}>
          {chips.slice(0, exp ? chips.length : 2).map(i => (
            <span key={i.item_name} className="card-chip" style={{ fontSize: 11, padding: '2px 7px' }}>{i.item_name}<span className="cqty">×{i.quantity}</span></span>
          ))}
          {!exp && chips.length > 2 && <span className="card-chip" style={{ color: 'var(--amber)', background: 'var(--amber-soft)', fontSize: 11, padding: '2px 7px' }}>+{chips.length - 2}</span>}
        </div>

        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <div className={`s-badge ${order.status}`}
            onClick={e => { e.stopPropagation(); onStatus(order); }}
            style={{ cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}>
            <span className="s-dot" />{isDone ? 'נמסר ✓' : 'ממתין'}
          </div>
          <div className="card-price" style={{ fontSize: 14 }}><small>₪</small>{order.total_price || 0}</div>
        </div>
      </div>

      {/* שורה שנייה: טלפון + כתובת */}
      {(order.customer?.phone || (isDelivery && order.delivery_address)) && (
        <div style={{ display: 'flex', gap: 10, paddingRight: 8, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--ink-06)' }}>
          {order.customer?.phone && <a href={`tel:${order.customer.phone}`} style={{ fontSize: 11, color: 'var(--ink-30)', textDecoration: 'none' }}>📞 {order.customer.phone}</a>}
          {isDelivery && order.delivery_address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-30)' }}>📍 {order.delivery_address}</span>
              <a
                href={`https://waze.com/ul?q=${encodeURIComponent(order.delivery_address)}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 10, color: 'var(--amber)', textDecoration: 'none', fontWeight: 700, border: '1px solid var(--amber)', padding: '1px 4px', borderRadius: 4 }}
                onClick={e => e.stopPropagation()}
              >נווט 🗺️</a>
            </div>
          )}
          {payClass && <span className={`pay-chip ${payClass}`} style={{ fontSize: 10, marginRight: 'auto' }}>{payLbl}</span>}
        </div>
      )}

      {/* פעולות — רק בלחיצה */}
      {exp && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--ink-06)', display: 'flex', gap: 8, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
          <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onEdit(order)}>✏️ ערוך</button>
          <select className="payment-select" value={order.payment_type} onChange={e => onPay(order, e.target.value as PaymentType)} style={{ flex: 1, minWidth: 80 }}>
            {PAY_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

// ─── Orders Panel ─────────────────────────────────────
type SubTab = 'yavne-pickup' | 'yavne-delivery' | 'ayyanot';

function OrdersPanel({ shabbat, orders }: { shabbat: { id: number; inventory?: Inventory[]; has_delivery: boolean; yavne_open: boolean; ayyanot_open: boolean }; orders: Order[] }) {
  const toast = useToast(); const dispatch = useDispatch<AppDispatch>();
  const [sub, setSub] = useState<SubTab>('yavne-pickup');
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [showNew, setShowNew] = useState(false);

  const getFiltered = (s: SubTab) => {
    if (s === 'yavne-delivery') return orders
      .filter(o => o.location === 'yavne' && o.order_type === 'delivery')
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'waiting' ? -1 : 1;
        return (a.delivery_time || '').localeCompare(b.delivery_time || '');
      });
    if (s === 'yavne-pickup') return orders
      .filter(o => o.location === 'yavne' && o.order_type === 'pickup' && !o.is_walk_in)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'waiting' ? -1 : 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    return orders.filter(o => o.location === 'ayyanot' && o.order_type === 'pickup' && !o.is_walk_in)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'waiting' ? -1 : 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  };

  const filtered = getFiltered(sub);
  const walkIn = orders.find(o => o.is_walk_in && o.location === (sub === 'ayyanot' ? 'ayyanot' : 'yavne'));
  const showWalkIn = sub === 'yavne-pickup' || sub === 'ayyanot';
  const curLoc = sub === 'ayyanot' ? 'ayyanot' : 'yavne';
  const inv = shabbat.inventory?.find(i => i.location === curLoc);

  const all = orders.filter(o => !o.is_walk_in);
  const active = all.filter(o => o.status === 'waiting').length;
  const revenue = all.reduce((s, o) => s + (o.total_price || 0), 0);

  const yd = orders.filter(o => o.location === 'yavne' && o.order_type === 'delivery').length;
  const yp = orders.filter(o => o.location === 'yavne' && o.order_type === 'pickup' && !o.is_walk_in).length;
  const ay = orders.filter(o => o.location === 'ayyanot' && !o.is_walk_in).length;

  const onStatus = async (order: Order) => {
    const ns = order.status === 'waiting' ? 'done' : 'waiting';
    try { await dispatch(updateOrderStatus({ orderId: order.id, status: ns })).unwrap(); dispatch(fetchCurrentShabbat()); }
    catch { toast('שגיאה', 'error'); }
  };
  const onPay = async (order: Order, payment_type: PaymentType) => {
    try { await dispatch(updateOrder({ orderId: order.id, data: { payment_type } })).unwrap(); dispatch(fetchCurrentShabbat()); }
    catch { toast('שגיאה', 'error'); }
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-strip" style={{ marginBottom: 16 }}>
        <div className="stat-c accent"><div className="stat-v">{active}</div><div className="stat-l">פעילות</div></div>
        <div className="stat-c"><div className="stat-v">{all.length}</div><div className="stat-l">היום</div></div>
        <div className="stat-c"><div className="stat-v">{fmt(revenue)}</div><div className="stat-l">סה"כ</div></div>
      </div>

      {/* Sub-tabs */}
      <div className="page-tabs" style={{ marginBottom: 16 }}>
        {shabbat.yavne_open && (
          <button className={`ptab${sub === 'yavne-pickup' ? ' active' : ''}`} onClick={() => setSub('yavne-pickup')}>
            🏠 יבנה <span className="ptab-count">{yp}</span>
          </button>
        )}
        {shabbat.has_delivery && shabbat.yavne_open && (
          <button className={`ptab${sub === 'yavne-delivery' ? ' active' : ''}`} onClick={() => setSub('yavne-delivery')}>
            🛵 משלוחים <span className="ptab-count">{yd}</span>
          </button>
        )}
        {shabbat.ayyanot_open && (
          <button className={`ptab${sub === 'ayyanot' ? ' active' : ''}`} onClick={() => setSub('ayyanot')}>
            🌿 עיינות <span className="ptab-count">{ay}</span>
          </button>
        )}
      </div>

      {/* Inventory */}
      <InvBar inv={inv} />

      {/* Walk-in */}
      {showWalkIn && walkIn && <WalkInCard walkIn={walkIn} inv={inv} />}

      {/* Sec row */}
      <div className="sec-row">
        <div className="sec-title">
          {sub === 'yavne-delivery' ? '🛵 יבנה — משלוחים' : sub === 'yavne-pickup' ? '🏠 יבנה — איסוף עצמי' : '🌿 עיינות'} ({filtered.length})
        </div>
        <span className="sec-action" onClick={() => setShowNew(true)}>+ הזמנה חדשה</span>
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="empty-s"><div className="ei">📋</div><h3>אין הזמנות</h3><p>כרגע אין הזמנות בקטגוריה זו</p></div>
      ) : (
        <div className="orders-list">
          {filtered.map(o => <OrderCard key={o.id} order={o} isDelivery={sub === 'yavne-delivery'} onStatus={onStatus} onPay={onPay} onEdit={setEditOrder} />)}
        </div>
      )}

      {/* FAB */}
      <div className="fab-wrap">
        <button className="fab-btn" onClick={() => setShowNew(true)}>
          <div className="fab-ico">+</div>
          הזמנה חדשה
        </button>
      </div>

      {showNew && <NewOrderDrawer shabbat={shabbat} location={curLoc} onClose={() => setShowNew(false)} />}
      {editOrder && <EditOrderDrawer order={editOrder} shabbat={shabbat} onClose={() => setEditOrder(null)} />}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────
export default function OrdersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const shabbat = useSelector((s: RootState) => s.shabbat.current);
  const orders = useSelector((s: RootState) => s.orders.list);
  const lastLocal = useSelector((s: RootState) => s.orders.lastLocalAction);
  const [notFound, setNotFound] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await dispatch(fetchCurrentShabbat()).unwrap();
        if (r) { setNotFound(false); await dispatch(fetchOrders(r.id)).unwrap(); }
        else { if (shabbat) { setNotFound(false); dispatch(fetchOrders(shabbat.id)); } else setNotFound(true); }
      } catch { if (shabbat) { setNotFound(false); dispatch(fetchOrders(shabbat.id)); } else setNotFound(true); }
      setLoaded(true);
    })();
  }, [dispatch]);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8001';
    const es = new EventSource(`${base}/orders/events/`);

    es.onmessage = e => {
      try {
        const d = JSON.parse(e.data);
        if (d.type && d.type !== 'ping' && shabbat) {
          // Re-fetch everything when an order event happens
          dispatch(fetchOrders(shabbat.id));
          dispatch(fetchCurrentShabbat());
        }
      } catch { }
    };

    // Manual fallback refresh every 30 seconds if socket stalls
    const timer = setInterval(() => {
      if (shabbat) {
        dispatch(fetchOrders(shabbat.id));
        dispatch(fetchCurrentShabbat());
      }
    }, 30000);

    return () => {
      es.close();
      clearInterval(timer);
    };
  }, [dispatch, shabbat?.id]);

  useEffect(() => {
    if (!shabbat || !loaded) return;
    const mk = async (loc: 'yavne' | 'ayyanot') => {
      if (!orders.some(o => o.is_walk_in && o.location === loc))
        try { await dispatch(createOrder({ shabbat_id: shabbat.id, is_walk_in: true, location: loc, order_type: 'pickup', items: [] })).unwrap(); } catch { }
    };
    if (shabbat.yavne_open) mk('yavne');
    if (shabbat.ayyanot_open) mk('ayyanot');
  }, [shabbat?.id, loaded]);

  if (!loaded) return <div className="loading-center"><div className="spinner" /></div>;
  if (notFound || !shabbat) return (
    <div className="no-shift-msg"><div className="nsm-icon">🔒</div><h3>אין משמרת פתוחה</h3><p>לפני שניתן לנהל הזמנות, יש לפתוח משמרת בלשונית "משמרת".</p></div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🛍️ הזמנות</h1>
        <p className="page-subtitle">{shabbat.date}</p>
      </div>
      <OrdersPanel shabbat={shabbat} orders={orders} />
    </div>
  );
}

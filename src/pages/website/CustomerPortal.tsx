import { useState, useEffect } from 'react';
import api from '../../api';

const INVENTORY_ITEMS = [
  { key: 'jachnun', label: "ג'חנון", backend_name: "ג'חנון", price: 22 },
  { key: 'jachnun_butter', label: "ג'חנון חמאה", backend_name: "ג'חנון חמאה", price: 25 },
  { key: 'kubane', label: 'קובנה', backend_name: 'קובנה', price: 25 },
  { key: 'burekas_cheese', label: 'בורקס גבינה', backend_name: 'בורקס גבינה', price: 27 },
  { key: 'burekas_potato', label: 'בורקס תפו"א', backend_name: 'בורקס תפו"א', price: 27 },
  { key: 'burekas_spinach', label: 'בורקס תרד', backend_name: 'בורקס תרד', price: 27 },
  { key: 'egg', label: 'תוספת ביצה', backend_name: 'תוספת ביצה', price: 3 },
  { key: 'resak', label: 'תוספת רסק', backend_name: 'תוספת רסק', price: 3 },
  { key: 'malabi', label: 'מלבי', backend_name: 'מלבי', price: 12 },
  { key: 'orange_juice', label: 'מיץ תפוזים סחוט', backend_name: 'מיץ תפוזים', price: 25 },
];

const TIME_SLOTS = (() => {
  const s: string[] = [];
  let h = 8, m = 0;
  while (h < 13 || (h === 13 && m === 0)) {
    s.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 10;
    if (m >= 60) { m = 0; h++; }
  }
  return s;
})();

interface ShabbatData {
  id: number;
  date: string;
  yavne_open: boolean;
  ayyanot_open: boolean;
  inventory: Array<{ location: string;[key: string]: number | string }>;
}

interface CustomerPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerPortal({ isOpen, onClose }: CustomerPortalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [currentShabbat, setCurrentShabbat] = useState<ShabbatData | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<'yavne' | 'ayyanot' | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [time, setTime] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // OTP State
  const [otpStep, setOtpStep] = useState<0 | 1>(0);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setToken(null);
      setOtpStep(0);
      setOtpPhone('');
      setOtpCode('');
      setOtpError('');
      fetchCurrentShabbat();
    }
  }, [isOpen]);

  const fetchCurrentShabbat = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await api.get('/shabbat/current/');
      setCurrentShabbat(res.data);
      if (res.data.yavne_open && !res.data.ayyanot_open) setLocation('yavne');
      else if (res.data.ayyanot_open && !res.data.yavne_open) setLocation('ayyanot');
    } catch (e: any) {
      setCurrentShabbat(null);
      if (e.response?.status === 404) setNotFound(true);
    }
    setLoading(false);
  };

  const handleRequestOtp = async () => {
    if (!otpPhone || otpPhone.length < 9) {
      setOtpError('אנא הזן מספר נייד תקין');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      await api.post('/auth/otp/request/', { phone: otpPhone });
      setOtpStep(1);
    } catch (e: any) {
      setOtpError(e.response?.data?.error || 'שגיאה בשליחת הקוד');
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 4) {
      setOtpError('נא להזין קוד בן 4 ספרות');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/otp/verify/', { phone: otpPhone, otp: otpCode });
      if (res.data.token) {
        localStorage.setItem('customerToken', res.data.token);
        setToken(res.data.token);
        setPhone(res.data.customer?.phone || otpPhone);
        setName(res.data.customer?.name || '');
        fetchCurrentShabbat();
      }
    } catch (e: any) {
      setOtpError(e.response?.data?.error || 'קוד שגוי, אנא נסה שוב');
    }
    setOtpLoading(false);
  };

  const updateCart = (key: string, delta: number) => {
    setCart(prev => {
      const next = (prev[key] || 0) + delta;
      if (next <= 0) { const c = { ...prev }; delete c[key]; return c; }
      return { ...prev, [key]: next };
    });
  };

  const getStock = (key: string) => {
    if (!currentShabbat || !location) return 0;
    const inv = currentShabbat.inventory?.find(i => i.location === location);
    if (!inv) return 0;
    if (!(key in inv)) return 999;
    return (inv[key] as number) || 0;
  };

  const cartTotal = Object.entries(cart).reduce((sum, [key, qty]) => {
    return sum + (INVENTORY_ITEMS.find(i => i.key === key)?.price || 0) * qty;
  }, 0);

  const isLowStock = location ? getStock('jachnun') < 20 : false;

  const submitOrder = async () => {
    if (!location) return alert('אנא בחר/י עמדת איסוף');
    if (isLowStock) return alert('המלאי מצומצם מדי להזמנה אונליין. נא להתקשר.');
    if (!name) return alert('אנא הזן/י שם מלא');
    if (!time) return alert('אנא בחר/י שעת איסוף');
    if (!phone) return alert('אנא הזן/י מספר טלפון');
    const items = Object.entries(cart).map(([key, qty]) => ({
      item_name: INVENTORY_ITEMS.find(i => i.key === key)?.backend_name || key,
      quantity: qty,
    }));
    if (items.length === 0) return alert('העגלה ריקה');
    try {
      await api.post('/orders/', {
        shabbat_id: currentShabbat!.id, is_walk_in: false, location,
        order_type: 'pickup', delivery_time: time,
        customer_phone: phone, customer_name: name, items, payment_type: 'none',
      });
      setSubmitted(true);
      setCart({});
      setTimeout(() => { setSubmitted(false); onClose(); }, 3000);
    } catch (e: any) { alert(e.response?.data?.detail || 'שגיאה בשליחת ההזמנה'); }
  };

  const handleClose = () => {
    if (otpStep === 1 && !token) {
      setOtpStep(0);
      setOtpCode('');
      setOtpError('');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div style={{ background: '#fff', borderRadius: 24, maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 32, position: 'relative', direction: 'rtl', fontFamily: 'Heebo, Rubik, sans-serif' }}>
        <button onClick={handleClose} style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: 25 }}>
          <img src="/logo.png" alt="logo" style={{ width: 120, height: 120, objectFit: 'contain', margin: '0 auto 10px' }} />
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#E8860C', margin: 0 }}>הזמנה אונליין</h2>
          <p style={{ color: '#888', marginTop: 4 }}>ג'חנון על גלגלים — ישר מהתנור</p>
        </div>

        {notFound ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 50, marginBottom: 20 }}>🗓️</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12, color: '#1e293b' }}>ההזמנות לשבת עוד לא נפתחו</h3>
            <p style={{ color: '#64748b', marginBottom: 25, fontSize: 16, lineHeight: 1.5 }}>
              ניתן לבצע הזמנה מראש בטלפון במוקד המכירות שלנו. נשמח לעמוד לשירותכם!
            </p>
            <a href="tel:0507607887" className="s-btn s-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 35px', borderRadius: 12, textDecoration: 'none', fontWeight: 900, fontSize: 16, boxShadow: '0 10px 15px -3px rgba(232,134,12,0.3)' }}>
              📞 צלצלו עכשיו
            </a>
          </div>
        ) : !token ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 15 }}>📱</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>התחברות</h3>
            <p style={{ color: '#666', marginBottom: 25, fontSize: 14 }}>הזן את מספר הטלפון שלך לקבלת קוד אימות ב-WhatsApp</p>

            {otpStep === 0 ? (
              <div style={{ maxWidth: 280, margin: '0 auto' }}>
                <input type="tel" placeholder="מספר טלפון (לדוגמה: 0501234567)" value={otpPhone} onChange={e => setOtpPhone(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #ddd', marginBottom: 15, textAlign: 'center', fontSize: 16, fontFamily: 'inherit' }} />
                {otpError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10, fontWeight: 600 }}>{otpError}</p>}
                <button onClick={handleRequestOtp} disabled={otpLoading} className="s-btn s-btn-primary" style={{ width: '100%', padding: '12px', borderRadius: 10, fontWeight: 800 }}>
                  {otpLoading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : 'שלח קוד אימות 💬'}
                </button>
              </div>
            ) : (
              <div style={{ maxWidth: 280, margin: '0 auto' }}>
                <input type="text" maxLength={4} placeholder="קוד בן 4 ספרות" value={otpCode} onChange={e => setOtpCode(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1.5px solid #E8860C', marginBottom: 15, textAlign: 'center', fontSize: 20, fontWeight: 800, letterSpacing: 8, fontFamily: 'inherit' }} />
                {otpError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10, fontWeight: 600 }}>{otpError}</p>}
                <button onClick={handleVerifyOtp} disabled={otpLoading} className="s-btn s-btn-primary" style={{ width: '100%', padding: '12px', borderRadius: 10, fontWeight: 800, marginBottom: 10 }}>
                  {otpLoading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : 'אמת וגש למרכז ההזמנות ✅'}
                </button>
                <button onClick={() => setOtpStep(0)} style={{ background: 'none', border: 'none', color: '#666', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>חזור להזנת טלפון</button>
              </div>
            )}
          </div>
        ) : loading || !currentShabbat ? (
          <div className="loading-center" style={{ padding: '60px 0' }}><div className="spinner" /></div>
        ) : submitted ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 60, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginBottom: 10 }}>ההזמנה התקבלה!</h2>
            <p style={{ color: '#666', fontSize: 16 }}>אישור הזמנה נשלח אליך ב-WhatsApp.<br />נתראה ביום שבת!</p>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 25 }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>מאיפה תרצו לאסוף?</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    if (currentShabbat.yavne_open) {
                      setLocation('yavne');
                      setCart({});
                    } else {
                      alert('העמדה סגורה כעת');
                    }
                  }}
                  style={{
                    flex: 1, padding: 12, borderRadius: 10,
                    border: `2px solid ${location === 'yavne' ? '#E8860C' : '#e5e7eb'}`,
                    background: location === 'yavne' ? '#FFF7ED' : '#fff',
                    fontWeight: 700, cursor: 'pointer',
                    opacity: currentShabbat.yavne_open ? 1 : 0.6
                  }}
                >🏘️ יבנה {!currentShabbat.yavne_open && '(סגור)'}</button>
                <button
                  onClick={() => {
                    if (currentShabbat.ayyanot_open) {
                      setLocation('ayyanot');
                      setCart({});
                    } else {
                      alert('העמדה סגורה כעת');
                    }
                  }}
                  style={{
                    flex: 1, padding: 12, borderRadius: 10,
                    border: `2px solid ${location === 'ayyanot' ? '#E8860C' : '#e5e7eb'}`,
                    background: location === 'ayyanot' ? '#FFF7ED' : '#fff',
                    fontWeight: 700, cursor: 'pointer',
                    opacity: currentShabbat.ayyanot_open ? 1 : 0.6
                  }}
                >🌳 עיינות {!currentShabbat.ayyanot_open && '(סגור)'}</button>
              </div>
            </div>

            {location && (
              <>
                {isLowStock ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff9f0', borderRadius: 16, border: '1px solid #fee2e2' }}>
                    <div style={{ fontSize: 40, marginBottom: 15 }}>⚠️</div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#991b1b', marginBottom: 10 }}>נשאר מלאי מצומצם</h3>
                    <p style={{ color: '#b91c1c', marginBottom: 25, fontSize: 15, fontWeight: 500 }}>
                      נותרו פחות מ-20 ג'חנונים בנקודה זו. <br />
                      על מנת לבצע הזמנה יש להתקשר למוקד ההזמנות.
                    </p>
                    <a href="tel:0507607887" className="s-btn s-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 30px', borderRadius: 10, textDecoration: 'none', fontWeight: 800 }}>
                      📞 בצע שיחה
                    </a>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 25 }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 13 }}>שם מלא</label>
                        <input type="text" placeholder="שם מלא..." value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontFamily: 'inherit', fontSize: 14 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 13 }}>שעת איסוף</label>
                        <select value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontFamily: 'inherit', fontSize: 14 }}>
                          <option value="">בחר שעה...</option>
                          {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, fontSize: 13 }}>טלפון לזיהוי</label>
                        <input type="tel" placeholder="05X-XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontFamily: 'inherit', fontSize: 14 }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 25 }}>
                      <label style={{ fontWeight: 700, fontSize: 14 }}>מה תרצו להזמין?</label>
                      {INVENTORY_ITEMS.map(item => {
                        const stock = getStock(item.key);
                        const inCart = cart[item.key] || 0;
                        return (
                          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 14, background: stock > 0 ? '#f9fafb' : '#fee2e2', border: '1px solid #f1f5f9', opacity: stock === 0 ? 0.7 : 1 }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 15 }}>{item.label}</div>
                              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>₪{item.price}</div>
                            </div>
                            {stock > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button onClick={() => updateCart(item.key, -1)} disabled={inCart === 0} style={{ width: 32, height: 32, borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer', opacity: inCart === 0 ? 0.4 : 1 }}>-</button>
                                <span style={{ fontWeight: 800, width: 20, textAlign: 'center' }}>{inCart}</span>
                                <button onClick={() => updateCart(item.key, 1)} disabled={inCart >= stock} style={{ width: 32, height: 32, borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer', opacity: inCart >= stock ? 0.4 : 1 }}>+</button>
                              </div>
                            ) : (
                              <div style={{ fontSize: 13, color: '#b91c1c', fontWeight: 800 }}>אזל</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ position: 'sticky', bottom: -32, background: 'white', padding: '20px 0', borderTop: '1px solid #f1f5f9', marginTop: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                        <span style={{ fontWeight: 800, fontSize: 17 }}>סך הכל:</span>
                        <span style={{ fontWeight: 900, fontSize: 24, color: '#1e293b' }}>₪{cartTotal}</span>
                      </div>
                      <button onClick={submitOrder} disabled={cartTotal === 0} className="s-btn s-btn-primary" style={{ width: '100%', padding: '16px', borderRadius: 14, fontSize: 16, fontWeight: 900, boxShadow: '0 10px 15px -3px rgba(232,134,12,0.3)' }}>
                        שליחת הזמנה 🚀
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

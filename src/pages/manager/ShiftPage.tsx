import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentShabbat, openShabbat, closeShabbat, updateInventory } from '../../store/shabbatSlice';
import { useToast } from '../../App';
import { useAuth } from '../../components/layout/AuthBridge';
import { RootState, AppDispatch } from '../../store';
import { Inventory } from '../../types';

const INVENTORY_ITEMS = [
  { key: 'jachnun', label: "ג'חנון" },
  { key: 'jachnun_butter', label: "ג'חנון חמאה" },
  { key: 'kubane', label: 'קובנה' },
  { key: 'burekas_cheese', label: 'בורקס גבינה' },
  { key: 'burekas_potato', label: 'בורקס תפו"א' },
  { key: 'burekas_spinach', label: 'בורקס תרד וגבינה' },
  { key: 'malabi', label: 'מלבי' },
  { key: 'orange_juice', label: 'מיץ תפוזים' },
];

const getNearestSaturday = (): string => {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 6=Sat
  const diff = day === 6 ? 0 : (6 - day);
  const sat = new Date(today);
  sat.setDate(today.getDate() + diff);
  return sat.toISOString().split('T')[0];
};

const EMPLOYEES = ['ניר', 'מירי', 'ינקי', 'מיכל', 'שקד', 'נתנאל', 'אורי', 'איציק', 'אילי', 'עמית', 'טל'];

type InvMap = Record<string, number>;

const emptyInventory = (): InvMap =>
  Object.fromEntries(INVENTORY_ITEMS.map((i) => [i.key, 0]));

// ─── Inventory Modal ──────────────────────────────────
interface InventoryModalProps {
  title: string;
  values: InvMap;
  initialEmployees?: string[];
  isCreation: boolean;
  onSave: (values: InvMap, employees: string[]) => void;
  onClose: () => void;
}

function InventoryModal({ title, values, initialEmployees = [], isCreation, onSave, onClose }: InventoryModalProps) {
  const [temp, setTemp] = useState<InvMap>({ ...values });
  const [tempEmps, setTempEmps] = useState<string[]>(initialEmployees);

  const toggleEmp = (emp: string) =>
    setTempEmps((prev) => prev.includes(emp) ? prev.filter((e) => e !== emp) : [...prev, emp]);

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal glass-modal">
        <div className="modal-header">
          <h2 className="modal-title">📦 {title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="inventory-form-grid" style={{ marginBottom: isCreation ? 0 : 20 }}>
          {INVENTORY_ITEMS.map((item) => (
            <div className="form-group" key={item.key}>
              <label className="form-label">{item.label}</label>
              <input
                type="number" min="0" className="form-input"
                value={temp[item.key] ?? ''}
                onChange={(e) => setTemp((p) => ({ ...p, [item.key]: parseInt(e.target.value) || 0 }))}
                style={{ direction: 'ltr', textAlign: 'center', fontSize: 16, fontWeight: 700 }}
              />
            </div>
          ))}
        </div>

        {isCreation && (
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 12, fontWeight: 800 }}>👥 צוות עובדים</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EMPLOYEES.map((emp) => (
                <div
                  key={emp}
                  onClick={() => toggleEmp(emp)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                    background: tempEmps.includes(emp) ? '#FDBA74' : 'rgba(255,255,255,0.4)',
                    color: tempEmps.includes(emp) ? '#fff' : '#333',
                    border: '1px solid rgba(0,0,0,0.1)', fontWeight: 700, fontSize: 14, transition: '0.2s',
                  }}
                >{emp}</div>
              ))}
            </div>
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: 14 }}
          onClick={() => onSave(temp, tempEmps)}
        >אישור ועדכון</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function ShiftPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const { role } = useAuth();

  const currentShabbat = useSelector((s: RootState) => s.shabbat.current);
  const loading = useSelector((s: RootState) => s.shabbat.loading);

  const [actionLoading, setActionLoading] = useState(false);
  const [yavneOpen, setYavneOpen] = useState<boolean | null>(null);
  const [ayyanotOpen, setAyyanotOpen] = useState<boolean | null>(null);
  const [hasDelivery, setHasDelivery] = useState<boolean | null>(null);
  const [yavneInv, setYavneInv] = useState<InvMap>(emptyInventory());
  const [ayyanotInv, setAyyanotInv] = useState<InvMap>(emptyInventory());
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showYavneModal, setShowYavneModal] = useState(false);
  const [showAyyanotModal, setShowAyyanotModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<'yavne' | 'ayyanot' | null>(null);
  const [selectedDateStr] = useState(() => getNearestSaturday());

  const formattedDate = new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  useEffect(() => {
    if (role !== 'admin') navigate('/dashboard/current');
  }, [role, navigate]);

  useEffect(() => { dispatch(fetchCurrentShabbat()); }, [dispatch]);

  useEffect(() => {
    if (currentShabbat?.inventory) {
      const y = currentShabbat.inventory.find((i) => i.location === 'yavne');
      const a = currentShabbat.inventory.find((i) => i.location === 'ayyanot');
      if (y) setYavneInv(y as unknown as InvMap);
      if (a) setAyyanotInv(a as unknown as InvMap);
    }
  }, [currentShabbat]);

  const handleOpenShabbat = async () => {
    if (yavneOpen === null || ayyanotOpen === null || hasDelivery === null) {
      toast('יש לענות על כל השאלות', 'error'); return;
    }
    setActionLoading(true);
    try {
      await dispatch(openShabbat({
        date: formattedDate,
        yavne_open: yavneOpen, ayyanot_open: ayyanotOpen, has_delivery: hasDelivery,
        employees: selectedEmployees,
        yavne_inventory: yavneOpen ? { location: 'yavne', ...yavneInv } : null,
        ayyanot_inventory: ayyanotOpen ? { location: 'ayyanot', ...ayyanotInv } : null,
      })).unwrap();
      toast('השבת נפתחה בהצלחה! 🎉', 'success');
    } catch (e) {
      toast(typeof e === 'string' ? e : 'שגיאה בפתיחת שבת', 'error');
    }
    setActionLoading(false);
  };

  const handleUpdateInventory = async (newValues: InvMap) => {
    if (!currentShabbat) return;
    setActionLoading(true);
    try {
      const items: Partial<Inventory>[] = [];
      if (currentShabbat.yavne_open)
        items.push({ location: 'yavne', ...(editingLoc === 'yavne' ? newValues : yavneInv) });
      if (currentShabbat.ayyanot_open)
        items.push({ location: 'ayyanot', ...(editingLoc === 'ayyanot' ? newValues : ayyanotInv) });

      await dispatch(updateInventory({ shabbatId: currentShabbat.id, items })).unwrap();
      toast('המלאי עודכן בהצלחה', 'success');
      if (editingLoc === 'yavne') setYavneInv(newValues);
      else setAyyanotInv(newValues);
      setShowYavneModal(false); setShowAyyanotModal(false); setEditingLoc(null);
    } catch {
      toast('שגיאה בעדכון מלאי', 'error');
    }
    setActionLoading(false);
  };

  const handleCloseShabbat = async () => {
    if (!currentShabbat || !window.confirm('האם את בטוחה שאת רוצה לסגור את המשמרת?')) return;
    setActionLoading(true);
    try {
      await dispatch(closeShabbat(currentShabbat.id)).unwrap();
      toast('המשמרת נסגרה בהצלחה', 'success');
      setYavneOpen(null); setAyyanotOpen(null); setHasDelivery(null);
      setYavneInv(emptyInventory()); setAyyanotInv(emptyInventory());
      setSelectedEmployees([]);
    } catch {
      toast('שגיאה בסגירת משמרת', 'error');
    }
    setActionLoading(false);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  // ── Active shift view ──
  if (currentShabbat) {
    return (
      <div style={{ maxWidth: 700 }}>
        <div className="page-header">
          <h1 className="page-title">⚙️ ניהול משמרת פעילה</h1>
          <p className="page-subtitle">{currentShabbat.date}</p>
        </div>

        <div className="card glass-card" style={{ padding: 30 }}>
          <h3 style={{ marginBottom: 20, fontWeight: 800, fontSize: 18 }}>עדכון מלאי במידת הצורך</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {currentShabbat.yavne_open && (
              <div className="modern-toggle-card active" onClick={() => { setEditingLoc('yavne'); setShowYavneModal(true); }}>
                <div className="icon-circle">🏘️</div>
                <div style={{ fontWeight: 700 }}>עמדת יבנה</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>לחץ לעדכון מלאי</div>
              </div>
            )}
            {currentShabbat.ayyanot_open && (
              <div className="modern-toggle-card active" onClick={() => { setEditingLoc('ayyanot'); setShowAyyanotModal(true); }}>
                <div className="icon-circle">🌳</div>
                <div style={{ fontWeight: 700 }}>עמדת עיינות</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>לחץ לעדכון מלאי</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, padding: 16, background: '#FFF7ED', borderRadius: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: '#C2410C' }}>👥 עובדי המשמרת:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {currentShabbat.employees?.map((emp) => (
                <span key={emp} style={{ background: '#FDBA74', color: '#7C2D12', padding: '3px 10px', borderRadius: 10, fontSize: 13, fontWeight: 800 }}>{emp}</span>
              )) ?? '—'}
            </div>
          </div>

          <div style={{ marginTop: 40, paddingTop: 30, borderTop: '1px solid #eee' }}>
            <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', padding: 16, fontSize: 16 }}
              onClick={handleCloseShabbat} disabled={actionLoading}>
              🔒 סגירת משמרת
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
              סגירת המשמרת תעביר אותה להיסטוריה ותאפשר פתיחת משמרת חדשה.
            </p>
          </div>
        </div>

        {showYavneModal && (
          <InventoryModal title="עדכון מלאי יבנה" values={yavneInv} isCreation={false}
            onSave={(v) => handleUpdateInventory(v)} onClose={() => setShowYavneModal(false)} />
        )}
        {showAyyanotModal && (
          <InventoryModal title="עדכון מלאי עיינות" values={ayyanotInv} isCreation={false}
            onSave={(v) => handleUpdateInventory(v)} onClose={() => setShowAyyanotModal(false)} />
        )}
      </div>
    );
  }

  // ── Open new shift view ──
  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1 className="page-title" style={{ fontSize: 32 }}>✨ פתיחת משמרת חדשה</h1>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-color)' }}>📅 {formattedDate}</div>
        </div>
      </div>

      <div className="card glass-card" style={{ padding: 40, borderRadius: 24 }}>
        {/* Step 1 - stations */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>1. בחירת עמדות פעילות</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className={`modern-toggle-card ${yavneOpen === true ? 'active' : yavneOpen === false ? 'active-no' : ''}`}
              onClick={() => { if (yavneOpen !== true) { setYavneOpen(true); setShowYavneModal(true); } else setYavneOpen(false); }}>
              <div className="icon-circle">{yavneOpen === true ? '🏘️' : '🏠'}</div>
              <div style={{ fontWeight: 700 }}>עמדת יבנה פתוחה?</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {yavneOpen === true ? 'כן - המלאי הוזן' : yavneOpen === false ? 'לא' : 'לחץ לבחירה'}
              </div>
            </div>
            <div className={`modern-toggle-card ${ayyanotOpen === true ? 'active' : ayyanotOpen === false ? 'active-no' : ''}`}
              onClick={() => { if (ayyanotOpen !== true) { setAyyanotOpen(true); setShowAyyanotModal(true); } else setAyyanotOpen(false); }}>
              <div className="icon-circle">{ayyanotOpen === true ? '🌳' : '🌱'}</div>
              <div style={{ fontWeight: 700 }}>עמדת עיינות פתוחה?</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {ayyanotOpen === true ? 'כן - המלאי הוזן' : ayyanotOpen === false ? 'לא' : 'לחץ לבחירה'}
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 - settings */}
        <div style={{ marginBottom: 32, paddingTop: 32, borderTop: '1px solid #eee' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>2. הגדרות נוספות</h2>
          <div className={`modern-toggle-card ${hasDelivery === true ? 'active' : hasDelivery === false ? 'active-no' : ''}`}
            onClick={() => setHasDelivery((v) => !v)}>
            <div className="icon-circle">🚚</div>
            <div style={{ fontWeight: 700 }}>יש משלוחים היום?</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {hasDelivery === true ? 'כן' : hasDelivery === false ? 'לא' : 'לחץ לבחירה'}
            </div>
          </div>
        </div>

        {/* Selected employees */}
        {selectedEmployees.length > 0 && (
          <div style={{ marginBottom: 32, padding: 20, background: '#FFF7ED', borderRadius: 16, border: '1px solid #FFEDD5' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, color: '#C2410C' }}>👥 עובדים שנבחרו:</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedEmployees.map((emp) => (
                <span key={emp} style={{ background: '#FDBA74', color: '#7C2D12', padding: '4px 12px', borderRadius: 12, fontSize: 14, fontWeight: 800 }}>{emp}</span>
              ))}
            </div>
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: 20, fontSize: 20, borderRadius: 16 }}
          onClick={handleOpenShabbat}
          disabled={actionLoading || yavneOpen === null || ayyanotOpen === null || hasDelivery === null}
        >
          {actionLoading ? '⏳ פותח שבת...' : '🔥 פתח משמרת בהצלחה'}
        </button>
      </div>

      {showYavneModal && (
        <InventoryModal title="הזנת מלאי יבנה" values={yavneInv} initialEmployees={selectedEmployees}
          isCreation={true}
          onSave={(v, emps) => { setYavneInv(v); setSelectedEmployees(emps); setShowYavneModal(false); }}
          onClose={() => { if (Object.values(yavneInv).every((x) => x === 0)) setYavneOpen(false); setShowYavneModal(false); }}
        />
      )}
      {showAyyanotModal && (
        <InventoryModal title="הזנת מלאי עיינות" values={ayyanotInv} initialEmployees={selectedEmployees}
          isCreation={true}
          onSave={(v, emps) => { setAyyanotInv(v); setSelectedEmployees(emps); setShowAyyanotModal(false); }}
          onClose={() => { if (Object.values(ayyanotInv).every((x) => x === 0)) setAyyanotOpen(false); setShowAyyanotModal(false); }}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerPortal from './CustomerPortal';

const ADMIN_PASSWORD = 'Sg280896';

// ─── Login Modal ──────────────────────────────────────
function LoginModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const USERS: Record<string, { pass: string; role: string }> = {
    jahnonmanager: { pass: 'Sg280896', role: 'manager' },
    jahnononweels: { pass: 'Jahnon1020304050', role: 'worker' },
  };

  const doLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = user.trim().toLowerCase();
    if (USERS[u] && USERS[u].pass === pass) {
      const role = USERS[u].role === 'manager' ? 'admin' : 'employee';
      localStorage.setItem('user_role', role);
      onClose();
      navigate('/dashboard');
    } else {
      setError(true);
      setPass('');
    }
  };

  const s = {
    overlay: {
      position: 'fixed' as const, inset: 0,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9000, padding: 16,
    },
    modal: {
      background: '#fff', borderRadius: 22, padding: 36,
      width: '90%', maxWidth: 400, position: 'relative' as const,
      boxShadow: '0 16px 50px rgba(0,0,0,0.14)', color: '#18120A',
    },
    closeBtn: {
      position: 'absolute' as const, top: 14, left: 14,
      width: 32, height: 32, borderRadius: '50%',
      border: '1.5px solid rgba(24,18,10,0.12)',
      background: 'rgba(24,18,10,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18, color: 'rgba(24,18,10,0.5)', cursor: 'pointer',
    },
    label: { display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 },
    input: {
      width: '100%', padding: '12px 14px',
      border: '1.5px solid rgba(24,18,10,0.12)',
      borderRadius: 12, fontSize: 15,
      background: '#FAF7F2', fontFamily: 'inherit',
      color: '#18120A', boxSizing: 'border-box' as const,
      outline: 'none', direction: 'rtl' as const,
    },
    errBox: {
      background: '#FEE2E2', color: '#B91C1C',
      border: '1px solid #F87171', borderRadius: 8,
      padding: '10px 14px', fontSize: 13, marginBottom: 16,
    },
    submitBtn: {
      width: '100%', padding: 14, border: 'none', borderRadius: 16,
      background: 'linear-gradient(135deg,#E8860C,#C96E00)',
      color: '#fff', fontSize: 15, fontWeight: 800,
      cursor: 'pointer', fontFamily: 'inherit',
      boxShadow: '0 8px 28px rgba(232,134,12,0.38)',
    },
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
        <div style={{ textAlign: 'center', fontSize: 48, marginBottom: 12 }}>🔐</div>
        <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 900, marginBottom: 6 }}>כניסת עובדים</h2>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(24,18,10,0.5)', marginBottom: 28 }}>הזן פרטי התחברות למערכת הניהול</p>

        {error && (
          <div style={s.errBox}>שם משתמש או סיסמה שגויים. נסה שוב.</div>
        )}

        <form onSubmit={doLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={s.label}>שם משתמש</label>
            <input style={s.input} type="text" placeholder="username..."
              value={user} onChange={e => { setUser(e.target.value); setError(false); }} />
          </div>
          <div>
            <label style={s.label}>סיסמה</label>
            <input style={s.input} type="password" placeholder="••••••••"
              value={pass} onChange={e => { setPass(e.target.value); setError(false); }} />
          </div>
          <button type="submit" style={s.submitBtn}>התחבר למערכת 🚀</button>
        </form>
      </div>
    </div>
  );
}

// ─── Google Reviews Component ──────────────────────────
function GoogleReviewsWrapper({ amber, ink, ink50, cream }: any) {
  const [placeInfo, setPlaceInfo] = useState<{ rating: number; total: number } | null>(null);

  return (
    <div style={{ padding: '45px 24px', maxWidth: 1160, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, background: 'rgba(232,134,12,0.09)', color: amber, fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' as const }}>לקוחות ממליצים</div>
        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, letterSpacing: -0.5, marginBottom: 12 }}>מה הלקוחות שלנו אומרים? 💬</h2>
        {placeInfo && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15, color: ink50, fontWeight: 600 }}>
            <span style={{ color: '#FCD34D', fontSize: 20 }}>★</span> <span style={{ color: ink, fontWeight: 800 }}>{placeInfo.rating}</span> מתוך {placeInfo.total} מדרגים בגוגל
          </div>
        )}
      </div>
      <GoogleReviews onPlaceInfo={setPlaceInfo} />
    </div>
  );
}

function GoogleReviews({ onPlaceInfo }: { onPlaceInfo: (info: { rating: number; total: number }) => void }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback reviews in case API fails
  const fallbackReviews = [
    { text: "הג׳חנון הכי טעים שאכלתי! שירות מעולה ומחיר הוגן. ממליץ בחום לכולם.", author_name: 'דני כהן', rating: 5, time: Date.now() / 1000 - 86400 * 5 },
    { text: "הזמנו שולחן שוק ליום הולדת, היה פשוט ואוו! האוכל הגיע חם, טרי ובשפע. האורחים לא הפסיקו להחמיא.", author_name: 'שירלי לוי', rating: 5, time: Date.now() / 1000 - 86400 * 12 },
    { text: "מקום קבוע שלנו בשבת בבוקר. אין על השירות של ניר והצוות.", author_name: 'אביב מזרחי', rating: 5, time: Date.now() / 1000 - 86400 * 30 },
  ];

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const API_KEY = '<YOUR_GOOGLE_MAPS_API_KEY>';
        const PLACE_ID = '<YOUR_GOOGLE_PLACE_ID>';
        
        // Load Google Maps SDK dynamically
        const loadGoogleMaps = () => new Promise((resolve, reject) => {
          if ((window as any).google && (window as any).google.maps) {
            resolve((window as any).google.maps);
            return;
          }
          const existingScript = document.getElementById('google-maps-script');
          if (existingScript) {
            const checkReady = setInterval(() => {
              if ((window as any).google && (window as any).google.maps) {
                clearInterval(checkReady);
                resolve((window as any).google.maps);
              }
            }, 100);
            return;
          }

          const script = document.createElement('script');
          script.id = 'google-maps-script';
          script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=he`;
          script.async = true;
          script.defer = true;
          script.onload = () => resolve((window as any).google.maps);
          script.onerror = (err) => reject(err);
          document.head.appendChild(script);
        });

        const maps: any = await loadGoogleMaps();
        const mapContext = document.createElement('div');
        const service = new maps.places.PlacesService(mapContext);
        
        service.getDetails({
          placeId: PLACE_ID,
          fields: ['reviews', 'rating', 'user_ratings_total']
        }, (place: any, status: any) => {
          if (status === maps.places.PlacesServiceStatus.OK && place) {
            if (place.rating && place.user_ratings_total) {
              onPlaceInfo({ rating: place.rating, total: place.user_ratings_total });
            }

            if (place.reviews && Array.isArray(place.reviews)) {
              try {
                // Filter high ratings (> 4) and take top 6
                const sortedReviews = place.reviews
                  .filter((r: any) => r.rating > 4)
                  .sort((a: any, b: any) => {
                    if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0); // Highest rating first
                    return (b.time || 0) - (a.time || 0); // Then newest
                  })
                  .slice(0, 6);
                setReviews(sortedReviews);
              } catch (err) {
                console.error("Error sorting reviews:", err);
                setReviews(fallbackReviews);
              }
            } else {
              console.warn("Reviews array missing in Google API response");
              setReviews(fallbackReviews);
            }
          } else {
             console.warn("Google API response not OK", status);
             setReviews(fallbackReviews);
          }
          setLoading(false);
        });
      } catch (e) {
        console.error("Failed to load Google Maps SDK:", e);
        setReviews(fallbackReviews);
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ background: '#fff', border: `1px solid rgba(24,18,10,0.06)`, borderRadius: 22, padding: 28, height: 180, animation: 'pulse 1.5s infinite', opacity: 0.6 }} />
        ))}
        <style>{`@keyframes pulse { 0% { background: #fff; } 50% { background: #fdfdfd; } 100% { background: #fff; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
      {reviews.map((r, i) => (
        <a key={i} href="https://search.google.com/local/reviews?placeid=ChIJydlS5dC7AhUR0FcqHj2Ema0" target="_blank" rel="noreferrer" 
          style={{ background: '#fff', border: `1px solid rgba(24,18,10,0.06)`, borderRadius: 22, padding: 28, boxShadow: '0 2px 14px rgba(0,0,0,0.03)', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', cursor: 'pointer' }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#1a73e8' }}
          onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 14px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = 'rgba(24,18,10,0.06)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {r.profile_photo_url ? (
                <img src={r.profile_photo_url} alt={r.author_name || 'אורח'} style={{ width: 40, height: 40, borderRadius: '50%' }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#666' }}>
                  {(r.author_name || 'א').charAt(0)}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{r.author_name || 'משתמש גוגל'}</div>
                <div style={{ fontSize: 12, color: 'rgba(24,18,10,0.5)' }}>{r.relative_time_description || new Date((r.time || Date.now() / 1000) * 1000).toLocaleDateString('he-IL')}</div>
              </div>
            </div>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{ width: 24, height: 24, opacity: 0.8 }} />
          </div>
          
          <div style={{ color: '#FCD34D', fontSize: 15, marginBottom: 12, letterSpacing: 2 }}>
            {'★'.repeat(Math.round(r.rating || 5)) + '☆'.repeat(5 - Math.round(r.rating || 5))}
          </div>
          
          <p style={{ fontSize: 14, color: 'rgba(24,18,10,0.6)', lineHeight: 1.6, flex: 1, margin: 0, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            "{r.text || ''}"
          </p>
        </a>
      ))}
    </div>
  );
}

// ─── Main HomePage ─────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showCustomerPortal, setShowCustomerPortal] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMenuOpen(false);
  };

  const handleContact = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const type = formData.get('type') as string;
    const message = formData.get('message') as string;

    const text = `שלום, שמי ${name}. אני מעוניין בפרטים על ${type}.%0Aטלפון: ${phone}%0Aהודעה: ${message}`;
    window.open(`https://wa.me/972507607887?text=${text}`, '_blank');
    setContactSent(true);
  };

  // ── CSS tokens as inline vars ──
  const amber = '#E8860C';
  const amberH = '#C96E00';
  const amberL = '#F59E0B';
  const amberDim = '#FCD34D';
  const ink = '#18120A';
  const ink50 = 'rgba(24,18,10,0.50)';
  const ink12 = 'rgba(24,18,10,0.12)';
  const ink06 = 'rgba(24,18,10,0.06)';
  const cream = '#FDF8F0';
  const surf2 = '#FAF7F2';

  return (
    <div dir="rtl" style={{ fontFamily: 'Heebo, Rubik, sans-serif', background: cream, color: ink, minHeight: '100vh' }}>

      {/* ══ HEADER ════════════════════════════════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(18px)',
        borderBottom: `1px solid ${ink06}`,
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            overflow: 'hidden',
          }}><img src="/logo.png" alt="לוגו" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.3, lineHeight: 1.1 }}>ג׳חנון על גלגלים</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: ink50 }}>קייטרינג ומאפים תימניים</div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="desktop-nav">
          {[['saturdays', 'שבתות'], ['events', 'אירועים'], ['reviews', 'ממליצים'], ['contact', 'צור קשר']].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              padding: '7px 14px', borderRadius: 30, border: 'none',
              fontSize: 14, fontWeight: 600, color: ink50, background: 'none',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
              onMouseOver={e => { e.currentTarget.style.color = amber; e.currentTarget.style.background = 'rgba(232,134,12,0.09)'; }}
              onMouseOut={e => { e.currentTarget.style.color = ink50; e.currentTarget.style.background = 'none'; }}
            >{label}</button>
          ))}
        </nav>

        {/* Desktop right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-right">
          <a href="tel:0537788735" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', borderRadius: 30,
            border: `1.5px solid ${ink12}`, fontSize: 13, fontWeight: 700,
            color: ink, background: '#fff', textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            <span style={{ color: amber }}>📞</span>עיינות: 053-7788735
          </a>
          <a href="tel:0545574096" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', borderRadius: 30,
            border: `1.5px solid ${ink12}`, fontSize: 13, fontWeight: 700,
            color: ink, background: '#fff', textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            <span style={{ color: amber }}>📞</span>יבנה: 054-5574096
          </a>
          {localStorage.getItem('user_role') ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/dashboard')} style={{
                padding: '9px 18px', borderRadius: 30, border: `1.5px solid ${ink}`,
                background: '#fff', color: ink, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit'
              }}>לוח בקרה 📊</button>
              <button onClick={() => { localStorage.removeItem('user_role'); window.location.reload(); }} style={{
                padding: '9px 18px', borderRadius: 30, border: 'none',
                background: ink, color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit'
              }}>התנתק 🚪</button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)} style={{
              padding: '9px 18px', borderRadius: 30, border: 'none',
              background: ink, color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
              onMouseOver={e => e.currentTarget.style.background = amber}
              onMouseOut={e => e.currentTarget.style.background = ink}
            >כניסת עובדים 🔐</button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="mobile-hamburger" onClick={() => setMenuOpen(v => !v)}
          style={{ display: 'none', background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: ink }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 72, left: 16, zIndex: 199,
          background: '#fff', border: `1px solid ${ink06}`, padding: '12px 24px 16px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)', borderRadius: 16,
          width: 'max-content', minWidth: 180
        }}>
          {[['saturdays', 'שבתות'], ['events', 'אירועים'], ['reviews', 'ממליצים'], ['contact', 'צור קשר']].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              display: 'block', width: '100%', background: 'none', border: 'none',
              textAlign: 'right', padding: '11px 4px', fontFamily: 'inherit',
              fontSize: 15, fontWeight: 600, color: ink50, cursor: 'pointer',
              borderBottom: `1px solid ${ink06}`,
            }}>{label}</button>
          ))}
          <a href="tel:0537788735" style={{ display: 'block', padding: '10px 4px', color: amber, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>📞 עיינות: 053-7788735</a>
          <a href="tel:0545574096" style={{ display: 'block', padding: '10px 4px', color: amber, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>📞 יבנה: 054-5574096</a>
          {localStorage.getItem('user_role') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              <button onClick={() => navigate('/dashboard')} style={{
                width: '100%', padding: '10px 14px', borderRadius: 30,
                border: `1.5px solid ${ink}`, background: '#fff', color: ink, fontFamily: 'inherit',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>לוח בקרה 📊</button>
              <button onClick={() => { localStorage.removeItem('user_role'); window.location.reload(); }} style={{
                width: '100%', padding: '10px 14px', borderRadius: 30,
                border: 'none', background: ink, color: '#fff', fontFamily: 'inherit',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>התנתק 🚪</button>
            </div>
          ) : (
            <button onClick={() => { setShowLogin(true); setMenuOpen(false); }} style={{
              width: '100%', marginTop: 10, padding: '10px 14px', borderRadius: 30,
              border: 'none', background: ink, color: '#fff', fontFamily: 'inherit',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>כניסת עובדים 🔐</button>
          )}
        </div>
      )}

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section style={{
        minHeight: '88vh', background: '#1A1208', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', overflow: 'hidden', borderRadius: '0 0 24px 24px', margin: '0 0',
      }}>
        {/* bg glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(232,134,12,0.18) 0%, rgba(26,18,8,0.0) 70%), radial-gradient(ellipse 50% 80% at 10% 80%, rgba(232,134,12,0.08) 0%, transparent 60%)',
        }} />
        {/* dots */}
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.3,
          backgroundImage: 'radial-gradient(circle, rgba(232,134,12,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 700, padding: '16px 24px' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 16px', borderRadius: 30,
            border: '1px solid rgba(232,134,12,0.35)',
            background: 'rgba(232,134,12,0.10)',
            color: amberDim, fontSize: 13, fontWeight: 700, marginBottom: 24, letterSpacing: 0.3,
          }}> שבת בבוקר · כל שבוע מחדש</div>

          <h1 style={{
            fontSize: 'clamp(2rem,6vw,3.4rem)', fontWeight: 900, color: '#fff',
            letterSpacing: -1, lineHeight: 1.12, marginBottom: 18,
          }}>
            השילוב המושלם בין<br />
            <span style={{
              background: `linear-gradient(90deg, ${amber}, ${amberDim})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>מסורת של שבת</span> לחגיגה של אירועים
          </h1>

          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', marginBottom: 36, lineHeight: 1.6 }}>
            ג׳חנון חם וטרי בסופ״ש | קייטרינג ושולחנות שוק לאירועים בלתי נשכחים
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowCustomerPortal(true)} style={{
              padding: '14px 30px', borderRadius: 30, border: 'none',
              background: `linear-gradient(135deg,${amber},${amberH})`,
              color: '#fff', fontSize: 16, fontWeight: 800,
              boxShadow: '0 8px 28px rgba(232,134,12,0.38)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >📱 הזמנות אונליין</button>
            <a href="tel:0537788735" style={{
              padding: '14px 30px', borderRadius: 30,
              border: '1.5px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff', fontSize: 16, fontWeight: 700,
              backdropFilter: 'blur(8px)', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}>📞 חייגו אלינו</a>
          </div>

          <img
            src="/home.png"
            alt="ג׳חנון על גלגלים"
            onError={e => (e.currentTarget.style.display = 'none')}
            style={{ width: 'min(520px,90vw)', margin: '30px auto 0px', opacity: 0.85, display: 'block', borderRadius: '24px' }}
          />
        </div>
      </section>

      {/* ══ SATURDAYS ═════════════════════════════════════ */}
      <section id="saturdays" style={{ background: cream, borderRadius: '0 0 24px 24px', margin: '12px 0 0', overflow: 'hidden' }}>
        <div style={{ padding: '45px 24px', maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, background: 'rgba(232,134,12,0.09)', color: amber, fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' as const }}>השבתות שלנו</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, letterSpacing: -0.5, marginBottom: 12 }}>בכל שבת בבוקר<br />מחכים לכם 🌅</h2>
            <p style={{ fontSize: 16, color: ink50, maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>שתי עמדות, שני מיקומים — אותו ג׳חנון מדהים</p>
          </div>

          {/* Location cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 28 }}>
            {/* Ayanot */}
            <div style={{ background: '#fff', border: `1px solid ${ink06}`, borderRadius: 22, overflow: 'hidden', boxShadow: '0 2px 14px rgba(0,0,0,0.07)', transition: 'all 0.2s' }}
              onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 28px rgba(0,0,0,0.10)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 14px rgba(0,0,0,0.07)'; }}>
              <div style={{ height: 200, overflow: 'hidden', background: '#F5EFE3' }}>
                <img src="/ayanot.png" alt="עיינות" onError={e => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>🌿 צומת עיינות</h3>
                <p style={{ fontSize: 14, color: ink50, marginBottom: 14, lineHeight: 1.6 }}>בואו ליהנות מאווירה טובה ואוכל מצוין בדרך לטיול או לים. טרי, חם ומושלם.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href="https://waze.com/ul/hsv8tx4p5r" target="_blank" rel="noreferrer" style={{ flex: 2, padding: 11, borderRadius: 10, background: '#1a56db', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>🗺️ נווט</a>
                  <a href="https://wa.me/972537788735" target="_blank" rel="noreferrer" style={{ flex: 1, padding: 11, borderRadius: 10, background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💬</a>
                  <a href="tel:0537788735" style={{ flex: 1, padding: 11, borderRadius: 10, background: amber, color: '#fff', textDecoration: 'none', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📞</a>
                </div>
              </div>
            </div>

            {/* Yavne */}
            <div style={{ background: '#fff', border: `1px solid ${ink06}`, borderRadius: 22, overflow: 'hidden', boxShadow: '0 2px 14px rgba(0,0,0,0.07)', transition: 'all 0.2s' }}
              onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 28px rgba(0,0,0,0.10)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 14px rgba(0,0,0,0.07)'; }}>
              <div style={{ height: 200, overflow: 'hidden', background: '#F5EFE3' }}>
                <img src="/yavne.png" alt="יבנה" onError={e => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>🏠 יבנה, פעמונית 18</h3>
                <p style={{ fontSize: 14, color: ink50, marginBottom: 14, lineHeight: 1.6 }}>הנקודה הביתית שלנו. חם, טרי ומפנק. <strong>משלוחים זמינים ביבנה!</strong></p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href="https://waze.com/ul?q=פעמונית+18+יבנה" target="_blank" rel="noreferrer" style={{ flex: 2, padding: 11, borderRadius: 10, background: '#1a56db', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>🗺️ נווט</a>
                  <a href="https://wa.me/972545574096" target="_blank" rel="noreferrer" style={{ flex: 1, padding: 11, borderRadius: 10, background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💬</a>
                  <a href="tel:0545574096" style={{ flex: 1, padding: 11, borderRadius: 10, background: amber, color: '#fff', textDecoration: 'none', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📞</a>
                </div>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div style={{ background: '#fff', border: `1px solid ${ink06}`, borderRadius: 22, padding: 40, boxShadow: '0 2px 14px rgba(0,0,0,0.07)', marginTop: 48 }}>
            <h3 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 900, color: amber, marginBottom: 8 }}>🍽️ התפריט שלנו</h3>
            <p style={{ textAlign: 'center', color: ink50, fontSize: 14, marginBottom: 32 }}>החל מ-08:00 בבוקר · עד שנגמר</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '0 40px' }}>
              <div>
                {[
                  { name: "ג׳חנון", desc: "כולל ביצה, רסק וסחוג", price: "₪22" },
                  { name: "ג׳חנון חמאה", desc: "כולל ביצה, רסק וסחוג", price: "₪25" },
                  { name: "מלוואח", desc: "מולא/מגולגל, בתוספת ₪2", price: "₪30" },
                  { name: "בורקס טורקי", desc: 'גבינה / גבינה ותרד / תפו"א', price: "₪27" },
                  { name: "קובניות", desc: "אוורירית וטעימה (בהזמנה מראש)", price: "₪25" },
                  { name: "מלבי שמנת", desc: "קינוח מושלם עם סירופ קוקוס ובוטנים", price: "₪12" },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 0', borderBottom: `1px dashed ${ink12}`, gap: 12 }}>
                    <div><div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div><div style={{ fontSize: 12, color: ink50, marginTop: 3 }}>{item.desc}</div></div>
                    <div style={{ fontWeight: 900, fontSize: 17, color: amber, whiteSpace: 'nowrap' }}>{item.price}</div>
                  </div>
                ))}
              </div>
              <div>
                {[
                  { name: 'תפו"א ממולא', desc: "עד 3 תוספות לבחירה", price: "₪35" },
                  { name: "פתות מתוק/מלוח", desc: "עד 3 תוספות לבחירה", price: "₪35" },
                  { name: "סבאייה קטנה/גדולה", desc: "בהזמנה מראש", price: "₪70/₪120" },
                  { name: "עוגת שמרים", desc: "שוקולד / לוטוס / קינמון / ריבה", price: "₪50" },
                  { name: "עוגת שמרים קראנץ", desc: "מבחר מילויים", price: "₪35" },
                  { name: "מיץ סחוט טרי", desc: "רימונים / תפוזים לפי עונה", price: "₪25" },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 0', borderBottom: `1px dashed ${ink12}`, gap: 12 }}>
                    <div><div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div><div style={{ fontSize: 12, color: ink50, marginTop: 3 }}>{item.desc}</div></div>
                    <div style={{ fontWeight: 900, fontSize: 17, color: amber, whiteSpace: 'nowrap' }}>{item.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ EVENTS ════════════════════════════════════════ */}
      <section id="events" style={{ background: surf2, padding: '10px 0', borderRadius: '0 0 24px 24px', margin: '12px 0 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, background: 'rgba(232,134,12,0.09)', color: amber, fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' as const }}>אירועים</div>
            <h2 style={{ fontSize: 'clamp(1.5rem,3.5vw,2.2rem)', fontWeight: 900, letterSpacing: -0.5, marginBottom: 8 }}>אירועים ברמה אחרת 🎉</h2>
            <p style={{ fontSize: 15, color: ink50, maxWidth: 520, margin: '0 auto', lineHeight: 1.5 }}>ימי הולדת, אירועי חברה, מסיבת רווקים/ות, בר/בת מצווה ועוד</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 10, marginBottom: 20 }}>
            {[['🛒', 'שולחנות שוק עשירים'], ['🍗', 'עמדת שניצל'], ['🍔', 'עמדת המבורגר פרימיום'], ['🍕', 'עמדת פיצות בטאבון'], ['🥘', 'עמדת שבת בבוקר'], ['🍝', 'עמדת איטלקי'], ['🍜', 'עמדה אסייאתית'], ['🍓', 'עמדת פירות'], ['🥤', 'בר שייקים טריים'], ['🍰', 'שולחנות מתוקים וקינוחים']].map(([icon, label]) => (
              <div key={label} style={{ background: '#fff', border: `1px solid ${ink06}`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontWeight: 600, fontSize: 13, transition: 'all 0.2s', cursor: 'default' }}
                onMouseOver={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = amber; d.style.color = amber; d.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = ink06; d.style.color = ink; d.style.transform = ''; }}>
                <span style={{ fontSize: 18 }}>{icon}</span>{label}
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, color: amber, marginTop: 4 }}>✨ אפשרות לתפריט בהתאמה אישית מלאה מול הלקוח</p>
        </div>
      </section>

      {/* ══ REVIEWS ══════════════════════════════════════ */}
      <section id="reviews" style={{ background: cream, borderRadius: '0 0 24px 24px', margin: '12px 0 0', overflow: 'hidden' }}>
        <GoogleReviewsWrapper amber={amber} ink={ink} ink50={ink50} cream={cream} />
      </section>

      {/* ══ CONTACT ══════════════════════════════════════ */}
      <section id="contact" style={{ background: ink, color: '#fff', padding: '45px 0', borderRadius: '24px 24px 0 0', margin: '12px 0 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 60, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, background: 'rgba(232,134,12,0.20)', color: amberDim, fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' as const }}>בואו נרים לכם אירוע</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: 24, marginTop: 14 }}>יצירת קשר 📬</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[['👤', 'ניר'], ['📞', '050-7607887'], ['📍', 'יבנה ועיינות']].map(([icon, text]) => (
                <li key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, fontSize: 15 }}>
                  <span style={{ color: amber, fontSize: 18 }}>{icon}</span>{text}
                </li>
              ))}
            </ul>
          </div>

          {contactSent ? (
            <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 22, padding: '40px 30px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h3 style={{ color: '#4ADE80', fontWeight: 800, marginBottom: 8 }}>הפרטים נשלחו!</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>נחזור אליך בהקדם 🙏</p>
            </div>
          ) : (
            <form onSubmit={handleContact} style={{ background: '#fff', borderRadius: 22, padding: 32, color: ink, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>שם מלא</label>
                <input name="name" type="text" placeholder="הכנס שמך..." required style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${ink12}`, borderRadius: 12, fontSize: 14, color: ink, background: surf2, fontFamily: 'inherit', boxSizing: 'border-box' as const, direction: 'rtl', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>טלפון</label>
                <input name="phone" type="tel" placeholder="05X-XXXXXXX" required style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${ink12}`, borderRadius: 12, fontSize: 14, color: ink, background: surf2, fontFamily: 'inherit', boxSizing: 'border-box' as const, direction: 'rtl', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>סוג אירוע</label>
                <select name="type" style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${ink12}`, borderRadius: 12, fontSize: 14, color: ink, background: surf2, fontFamily: 'inherit', boxSizing: 'border-box' as const }}>
                  <option value="כללי">בחרו סוג אירוע...</option>
                  <option value="יום הולדת">יום הולדת</option>
                  <option value="אירוע חברה">אירוע חברה</option>
                  <option value="בר/בת מצווה">בר/בת מצווה</option>
                  <option value="אחר">אחר</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>הודעה</label>
                <textarea name="message" rows={3} placeholder="ספרו לנו על האירוע..." style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${ink12}`, borderRadius: 12, fontSize: 14, color: ink, background: surf2, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' as const, outline: 'none', direction: 'rtl' }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: 14, border: 'none', borderRadius: 16, background: `linear-gradient(135deg,${amber},${amberH})`, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 28px rgba(232,134,12,0.38)' }}>
                שלח פרטים ✉️
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════ */}
      <footer style={{ background: '#111', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 24, fontSize: 13, borderRadius: ' 0 0 24px 24px' }}>
        © 2026 ג׳חנון על גלגלים. כל הזכויות שמורות.
      </footer>

      {/* ══ Modals ══════════════════════════════════════ */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <CustomerPortal isOpen={showCustomerPortal} onClose={() => setShowCustomerPortal(false)} />

      {/* ══ Responsive ══════════════════════════════════ */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-right { display: none !important; }
          .mobile-hamburger { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-hamburger { display: none !important; }
        }
        section[id] { scroll-margin-top: 80px; }
      `}</style>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, FileText, FlaskConical, Pill, Lock, Play, RotateCcw, Heart, User, MapPin, Scale, Ruler, X, CheckCircle2, ChevronRight, Phone, ArrowLeft, ShieldCheck, History, Calendar, Trash2 } from 'lucide-react';
import { supabase } from './supabase';
import MedicineOutput from './components/MedicineOutput.jsx';

const resolveApiBase = () => {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:8000';
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  return isLocalHost ? 'http://localhost:8000' : window.location.origin;
};

const API = resolveApiBase();
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: '\u0939\u093f\u0902\u0926\u0940', short: 'हि' },
  { code: 'te', label: '\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41', short: 'తె' },
];

const T = {
  en: {
    signIn: "Sign In",
    enterMobile: "Enter your mobile number to get started.",
    getOtp: "Get OTP",
    verifyOtp: "Verify OTP",
    verifyContinue: "Verify & Continue",
    sentCode: "We sent a 4-digit code to",
    back: "Back",
    history: "History",
    profile: "Profile",
    scanTitle: "Understand any",
    scanSub: "medical document",
    quote: "Your health is a conversation; we're here to help you understand every word.",
    openCam: "Open Camera",
    uploadFile: "Upload File",
    bestMobile: "Best on mobile",
    anyFile: "Any photo or PDF",
    neverStored: "Encrypted · Documents are never stored.",
    madeFor: "Designed for your well-being.",
    healthProfile: "Your Health Profile",
    scanHistory: "Scan History",
    save: "Save Profile",
    signOut: "Sign Out",
    noScans: "No scans yet. Start by scanning a document!",
    analyzing: "Analyzing Your Document",
    preparing: "Reading content and preparing explanation...",
    scanAnother: "Scan Another Document",
    care: "Care",
    summary: "AI Summary",
    confNote: "Confidence",
    resend: "Resend OTP",
    fullName: "Full Name",
    age: "Age",
    weight: "Weight",
    location: "Location (State)",
    langPref: "Preferred Language"
  },
  hi: {
    signIn: "लॉग इन करें",
    enterMobile: "शुरू करने के लिए अपना मोबाइल नंबर दर्ज करें।",
    getOtp: "ओटीपी प्राप्त करें",
    verifyOtp: "ओटीपी सत्यापित करें",
    verifyContinue: "सत्यापित करें और आगे बढ़ें",
    sentCode: "हमने इस नंबर पर 4-अंकीय कोड भेजा है",
    back: "पीछे",
    history: "इतिहास",
    profile: "प्रोफ़ाइल",
    scanTitle: "किसी भी चिकित्सा दस्तावेज़",
    scanSub: "को समझें",
    quote: "आपका स्वास्थ्य एक बातचीत है; हम आपको हर शब्द समझने में मदद करने के लिए यहां हैं।",
    openCam: "कैमरा खोलें",
    uploadFile: "फ़ाइल अपलोड करें",
    bestMobile: "मोबाइल पर सबसे अच्छा",
    anyFile: "कोई भी फोटो या पीडीएफ",
    neverStored: "एन्क्रिप्टेड · आपके दस्तावेज़ कभी संग्रहीत नहीं किए जाते।",
    madeFor: "आपके कल्याण के लिए डिज़ाइन किया गया।",
    healthProfile: "आपका स्वास्थ्य प्रोफ़ाइल",
    scanHistory: "स्कैन इतिहास",
    save: "प्रोफ़ाइल सहेजें",
    signOut: "साइन आउट",
    noScans: "अभी तक कोई स्कैन नहीं। दस्तावेज़ स्कैन करके शुरू करें!",
    analyzing: "आपके दस्तावेज़ का विश्लेषण कर रहे हैं",
    preparing: "सामग्री पढ़ना और स्पष्टीकरण तैयार करना...",
    scanAnother: "दूसरा दस्तावेज़ स्कैन करें",
    care: "देखभाल",
    summary: "एआई सारांश",
    confNote: "विश्वास स्तर",
    resend: "ओटीपी दोबारा भेजें",
    fullName: "पूरा नाम",
    age: "आयु",
    weight: "वजन",
    location: "स्थान (राज्य)",
    langPref: "पसंद की भाषा"
  },
  te: {
    signIn: "సైన్ ఇన్ చేయండి",
    enterMobile: "ప్రారంభించడానికి మీ మొబైల్ నంబర్‌ను నమోదు చేయండి.",
    getOtp: "ఓటిపి పొందండి",
    verifyOtp: "ఓటిపిని ధృవీకరించండి",
    verifyContinue: "ధృవీకరించండి మరియు కొనసాగించండి",
    sentCode: "మేము 4-అంకెల కోడ్‌ను దీనికి పంపాము",
    back: "వెనుకకు",
    history: "చరిత్ర",
    profile: "ప్రొఫైల్",
    scanTitle: "ఏదైనా వైద్య పత్రాన్ని",
    scanSub: "అర్థం చేసుకోండి",
    quote: "మీ ఆరోగ్యం ఒక సంభాషణ; ప్రతి పదాన్ని అర్థం చేసుకోవడంలో మీకు సహాయపడటానికి మేము ఇక్కడ ఉన్నాము.",
    openCam: "కెమెరా తెరవండి",
    uploadFile: "ఫైల్ అప్‌లోడ్ చేయండి",
    bestMobile: "మొబైల్‌లో ఉత్తమంగా పనిచేస్తుంది",
    anyFile: "ఏదైనా ఫోటో లేదా PDF",
    neverStored: "ఎన్క్రిప్టెడ్ · మీ పత్రాలు ఎప్పుడూ నిల్వ చేయబడవు.",
    madeFor: "మీ శ్రేయస్సు కోసం రూపొందించబడింది.",
    healthProfile: "మీ ఆరోగ్య ప్రొఫైల్",
    scanHistory: "స్కాన్ చరిత్ర",
    save: "ప్రొఫైల్‌ను సేవ్ చేయండి",
    signOut: "సైన్ అవుట్",
    noScans: "ఇంకా స్కాన్‌లు లేవు. పత్రాన్ని స్కాన్ చేయడం ద్వారా ప్రారంభించండి!",
    analyzing: "మీ పత్రాన్ని విశ్లేషిస్తున్నాము",
    preparing: "విషయాలను చదవడం మరియు వివరణను సిద్ధం చేయడం...",
    scanAnother: "మరొక పత్రాన్ని స్కాన్ చేయండి",
    care: "సంరక్షణ",
    summary: "AI సారాంశం",
    confNote: "నమ్మక స్థాయి",
    resend: "ఓటిపిని మళ్ళీ పంపండి",
    fullName: "పూర్తి పేరు",
    age: "వయస్సు",
    weight: "బరువు",
    location: "ప్రాంతం (రాష్ట్రం)",
    langPref: "ఇష్టమైన భాష"
  }
};

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const TYPE_META = {
  prescription: { icon: FileText, label: 'Prescription', code: 'Rx', accent: '#E986A8', tint: '#FCE8F1' },
  lab_report: { icon: FlaskConical, label: 'Lab Report', code: 'Lab', accent: '#4CBFA4', tint: '#E2F7F2' },
  medicine: { icon: Pill, label: 'Medicine', code: 'Med', accent: '#72B4E8', tint: '#E6F3FC' },
};

const STATUS_COLORS = {
  normal: { main: '#4CBFA4', bg: '#E2F7F2', text: '#1E7A65' },
  high: { main: '#E986A8', bg: '#FCE8F1', text: '#9B3A5F' },
  low: { main: '#72B4E8', bg: '#E6F3FC', text: '#1A5E96' },
  info: { main: '#7C6FCD', bg: '#EDEAFC', text: '#4A3FA0' },
};

function DesktopSection({ label, color, children }) {
  return (
    <div style={S.dSection}>
      <div style={{ ...S.dLabel, color }}>{label}</div>
      {children}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState('en');
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('arogya_session') === 'true');
  
  const [loginStep, setLoginStep] = useState('number');
  const [phone, setPhone] = useState(localStorage.getItem('arogya_phone') || '');
  const [otp, setOtp] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('arogya_profile');
    return saved ? JSON.parse(saved) : { name: '', age: '', weight: '', height: '', location: '', language: 'en' };
  });
  const [historyItems, setHistoryItems] = useState([]);
  const camRef = useRef(null);
  const fileRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const cur = T[lang] || T.en;

  useEffect(() => {
    localStorage.setItem('arogya_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('arogya_session', isAuthenticated);
    if (isAuthenticated && phone) {
      localStorage.setItem('arogya_phone', phone);
      fetchCloudData();
    }
  }, [isAuthenticated]);

  const fetchCloudData = async () => {
    if (!import.meta.env.VITE_SUPABASE_URL) return;
    try {
      const { data: pData } = await supabase.from('profiles').select('*').eq('phone', phone).single();
      if (pData) { setProfile(pData); setLang(pData.language || 'en'); }
      const { data: hData } = await supabase.from('scans').select('*').eq('user_phone', phone).order('created_at', { ascending: false });
      if (hData) setHistoryItems(hData);
    } catch (e) { console.error(e); }
  };

  const syncProfile = async (newProfile) => {
    setProfile(newProfile);
    if (!isAuthenticated || !import.meta.env.VITE_SUPABASE_URL) return;
    await supabase.from('profiles').upsert({ phone, ...newProfile });
  };

  const saveScan = async (scanResult) => {
    if (!isAuthenticated || !import.meta.env.VITE_SUPABASE_URL) {
      setHistoryItems(prev => [{ ...scanResult, created_at: new Date().toISOString() }, ...prev]);
      return;
    }
    // The scans table references profiles(phone), so make sure the profile row exists first
    const { error: profileError } = await supabase.from('profiles').upsert({ phone, ...profile });
    if (profileError) { console.error('Profile upsert failed:', profileError); return; }
    const newScan = { user_phone: phone, title: scanResult.title, document_type: scanResult.document_type, summary: scanResult.summary, result_data: scanResult, created_at: new Date().toISOString() };
    const { data, error } = await supabase.from('scans').insert(newScan).select().single();
    if (error) { console.error('Scan save failed:', error); return; }
    if (data) setHistoryItems(prev => [data, ...prev]);
  };

  const handleLogin = () => { if (phone.length === 10) { setLoginStep('otp'); } };
  const verifyOtp = () => { if (otp.length === 4) { setIsAuthenticated(true); } };
  const logout = () => { setIsAuthenticated(false); localStorage.removeItem('arogya_session'); reset(); };

  const handleFile = async (file) => {
    if (!file) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setIsPlaying(false); }
    setPreview(URL.createObjectURL(file));
    setPhase('processing');
    setResult(null);
    setErr(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API}/analyze?language=${lang}`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setResult(data);
      setPhase('done');
      saveScan(data);
    } catch (error) { setErr(error.message); setPhase('error'); }
  };

  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
      else { audioRef.current.play(); setIsPlaying(true); }
      return;
    }
    const text = result?.audio_text || result?.summary;
    if (!text) return;
    const audioUrl = `${API}/api/audio?text=${encodeURIComponent(text)}&lang=${lang}`;
    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlaying(false);
    audioRef.current = audio;
    audio.play().then(() => setIsPlaying(true)).catch(e => console.error("Audio playback failed:", e));
  };

  const reset = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsPlaying(false);
    setPreview(null); setResult(null); setErr(null); setPhase('idle');
  };

  return (
    <div style={S.root}>
      {!isAuthenticated ? (
        <div style={S.authRoot}>
          <div style={S.authCircle1} /><div style={S.authCircle2} />
          <div style={S.authCard}>
            <div style={S.authHeader}><div style={S.authLogo}>Arogya<span style={{ color: '#7C6FCD' }}>Lens</span></div><p style={S.authSub}>{cur.quote?.split(';')[0]}</p></div>
            {loginStep === 'number' ? (
              <div>
                <h2 style={S.authTitle}>{cur.signIn}</h2><p style={S.authDesc}>{cur.enterMobile}</p>
                <div style={S.inputField}><div style={S.phonePrefix}><img src="https://flagcdn.com/w20/in.png" alt="IN" style={{ width: 20, borderRadius: 2 }} /><span style={{ marginLeft: 8, fontWeight: 700, color: '#1C1A35' }}>+91</span></div>
                <input style={S.phoneInput} type="tel" placeholder="00000 00000" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}/></div>
                <button style={{ ...S.authBtn, opacity: phone.length === 10 ? 1 : 0.6 }} onClick={handleLogin} disabled={phone.length < 10 || isLoggingIn}>{isLoggingIn ? <div style={S.miniSpinner} /> : <>{cur.getOtp} <ChevronRight size={18} style={{ marginLeft: 4 }} /></>}</button>
              </div>
            ) : (
              <div>
                <button style={S.backBtn} onClick={() => setLoginStep('number')}><ArrowLeft size={16} style={{ marginRight: 6 }} /> {cur.back}</button>
                <h2 style={S.authTitle}>{cur.verifyOtp}</h2><p style={S.authDesc}>{cur.sentCode} <br/><span style={{ color: '#1C1A35', fontWeight: 700 }}>+91 {phone}</span></p>
                <div style={S.otpRow}>{[0,1,2,3].map(i => (<input key={i} style={S.otpBox} type="text" maxLength={1} value={otp[i] || ''} onChange={e => { const val = e.target.value; if (val.length <= 1) { const newOtp = otp.split(''); newOtp[i] = val; setOtp(newOtp.join('')); if (val && i < 3) e.target.nextSibling?.focus(); } }}/>))}</div>
                <button style={{ ...S.authBtn, marginTop: 32, opacity: otp.length === 4 ? 1 : 0.6 }} onClick={verifyOtp} disabled={otp.length < 4 || isLoggingIn}>{isLoggingIn ? <div style={S.miniSpinner} /> : <>{cur.verifyContinue}</>}</button>
                <p style={S.resendText}>{cur.resend}</p>
              </div>
            )}
            <div style={S.authFooter}><ShieldCheck size={14} style={{ marginRight: 6, color: '#4CBFA4' }} />Test Mode · No SMS Charges</div>
          </div>
        </div>
      ) : (
        <>
          <nav style={S.nav}>
            <div style={S.navInner}>
              <div style={S.logo}>Arogya<span style={{ color: '#7C6FCD' }}>Lens</span></div>
              <div style={S.navActions}>
                <button style={S.navIconBtn} onClick={() => setShowHistory(true)}><History size={20} /><span style={S.navBtnText}>{cur.history}</span></button>
                <div style={S.vDividerNav} />
                <button style={S.profileBtn} onClick={() => setShowProfile(true)}>{profile.name ? <span style={S.userName}>{profile.name.split(' ')[0]}</span> : null}<User size={20} strokeWidth={2} /></button>
              </div>
            </div>
          </nav>

          <div style={S.main}>
            {phase === 'idle' && !result && (
              <div style={S.staticLayoutPC}>
                <header style={S.heroStatic}>
                  <div style={S.taglineStatic}>Smart · Simple · In your language</div>
                  <h1 style={S.h1Static}>{cur.scanTitle}<br /><span style={{ color: '#7C6FCD' }}>{cur.scanSub}</span></h1>
                  <p style={S.quoteStatic}>{cur.quote}</p>
                </header>
                <div style={S.docDisplayStatic}>
                  {Object.entries(TYPE_META).map(([key, item]) => {
                    const Icon = item.icon;
                    return (
                      <div key={key} style={{ ...S.miniBoxStatic, borderLeft: `3px solid ${item.accent}` }}>
                        <div style={{ ...S.miniIconStatic, background: item.tint, color: item.accent }}><Icon size={18} strokeWidth={1.5} /></div>
                        <div><div style={{ ...S.miniCodeStatic, color: item.accent }}>{item.code}</div><div style={S.miniTitleStatic}>{item.label}</div></div>
                      </div>
                    );
                  })}
                </div>
                <div style={S.uploadPanelStatic}>
                  <div style={S.actionStatic} onClick={() => camRef.current?.click()} className="upload-hover-lavender">
                    <input type="file" accept="image/*" capture="environment" ref={camRef} style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
                    <div style={S.actionIconStatic}><Camera size={28} strokeWidth={1.5} color="#7C6FCD" /></div>
                    <div><div style={S.actionTitleStatic}>{cur.openCam}</div><div style={S.actionSubStatic}>{cur.bestMobile}</div></div>
                  </div>
                  <div style={S.vDividerStatic} />
                  <div style={S.actionStatic} onClick={() => fileRef.current?.click()} className="upload-hover-mint">
                    <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
                    <div style={S.actionIconStatic}><Upload size={28} strokeWidth={1.5} color="#4CBFA4" /></div>
                    <div><div style={S.actionTitleStatic}>{cur.uploadFile}</div><div style={S.actionSubStatic}>{cur.anyFile}</div></div>
                  </div>
                </div>
                <div style={S.footerStatic}>
                  <div style={S.footerItem}><Lock size={12} strokeWidth={2} style={{ marginRight: 6 }} /><span>{cur.neverStored}</span></div>
                  <div style={S.dotSeparator} />
                  <div style={S.footerItem}><Heart size={12} strokeWidth={2} style={{ marginRight: 6, color: '#E986A8' }} /><span>{cur.madeFor}</span></div>
                </div>
              </div>
            )}
            
            {phase === 'processing' && (
              <div style={S.centerViewport}>
                <div style={S.spinnerContainer}><div style={S.spinnerLarge} /></div>
                <h2 style={S.statusTitle}>{cur.analyzing}</h2><p style={S.statusSub}>{cur.preparing}</p>
              </div>
            )}

            {phase === 'error' && (
              <div style={S.centerViewport}>
                <h2 style={{ ...S.statusTitle, color: '#E986A8' }}>Analysis Failed</h2>
                <p style={S.statusSub}>{err}</p>
                <button style={{ ...S.btnFinal, marginTop: 24, width: 'auto', padding: '12px 32px' }} onClick={reset}>Try Again</button>
              </div>
            )}

            {result && phase === 'done' && result.document_type === 'medicine' && result.medicines?.length > 0 && (
              <MedicineOutput result={result} onPlayAudio={handlePlayAudio} isPlaying={isPlaying} onReset={reset} labels={cur} />
            )}

            {result && phase === 'done' && !(result.document_type === 'medicine' && result.medicines?.length > 0) && (
              <div style={{ padding: '20px 0' }}>
                 <div style={{ ...S.confidenceBanner, background: STATUS_COLORS[result.confidence === 'high' ? 'normal' : 'high'].bg, color: STATUS_COLORS[result.confidence === 'high' ? 'normal' : 'high'].text }}>
                   <strong>{result.confidence} {cur.confNote}</strong><span> • {result.confidence_note}</span>
                 </div>
                 <div style={S.resultLayout}>
                    <div style={S.resultSide}>
                      <div style={S.resultHeaderRow}><div style={{ ...S.typeBadge, background: '#EDEAFC', color: '#7C6FCD' }}>{TYPE_META[result.document_type]?.label}</div><button style={S.playBtn} onClick={handlePlayAudio}><Play size={14} fill="currentColor" style={{ marginRight: 8 }} /> Play Audio</button></div>
                      <h2 style={S.mainTitle}>{result.title}</h2>
                      <div style={S.carePanel}><div style={S.careBadge}>{cur.care}</div><p style={S.careBody}>{result.reassurance}</p></div>
                    </div>
                    <div style={S.resultContent}>
                      <DesktopSection label={cur.summary} color="#7C6FCD"><p style={S.bodyP}>{result.summary}</p></DesktopSection>
                      
                      {result.what_to_do && result.what_to_do.length > 0 && (
                        <DesktopSection label="What To Do" color="#4CBFA4">
                          <ul style={{ paddingLeft: 20, margin: 0, color: '#7A7490', fontSize: 15, lineHeight: 1.8 }}>
                            {result.what_to_do.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </DesktopSection>
                      )}

                      {result.details && result.details.length > 0 && (
                        <DesktopSection label="Details" color="#E986A8">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {result.details.map((detail, idx) => {
                              const sColors = STATUS_COLORS[detail.status] || STATUS_COLORS.info;
                              return (
                                <div key={idx} style={{ padding: '16px 20px', borderRadius: 16, background: sColors.bg, border: `1px solid ${sColors.main}40` }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: sColors.text }}>{detail.name}</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: sColors.main, background: '#FFFFFF', padding: '4px 10px', borderRadius: 8 }}>{detail.primary}</div>
                                  </div>
                                  {detail.secondary && <div style={{ fontSize: 14, color: sColors.text, marginTop: 8, opacity: 0.9 }}>{detail.secondary}</div>}
                                  {(detail.when || detail.duration) && (
                                    <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, fontWeight: 700, color: sColors.main }}>
                                      {detail.when && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🕒 {detail.when}</div>}
                                      {detail.duration && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>📅 {detail.duration}</div>}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </DesktopSection>
                      )}

                      {result.timeline && result.timeline.length > 0 && (
                        <DesktopSection label="Timeline" color="#72B4E8">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {result.timeline.map((step, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: 16 }}>
                                <div style={{ width: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#72B4E8' }} />
                                  {idx !== result.timeline.length - 1 && <div style={{ width: 2, flex: 1, background: '#E6F3FC', marginTop: 4 }} />}
                                </div>
                                <div style={{ paddingBottom: idx !== result.timeline.length - 1 ? 16 : 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: '#72B4E8', textTransform: 'uppercase', marginBottom: 4 }}>{step.step}</div>
                                  <div style={{ fontSize: 15, color: '#1C1A35', fontWeight: 500 }}>{step.action}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </DesktopSection>
                      )}

                      {result.key_points && result.key_points.length > 0 && (
                        <DesktopSection label="Key Points" color="#7C6FCD">
                          <ul style={{ paddingLeft: 20, margin: 0, color: '#7A7490', fontSize: 15, lineHeight: 1.8 }}>
                            {result.key_points.map((pt, i) => <li key={i}>{pt}</li>)}
                          </ul>
                        </DesktopSection>
                      )}

                      <button style={S.btnFinal} onClick={reset}>{cur.scanAnother}</button>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {showProfile && (
            <div style={S.modalOverlay} onClick={() => setShowProfile(false)}>
              <div style={S.modalContent} onClick={e => e.stopPropagation()}>
                <div style={S.modalHeader}><h2 style={S.modalTitle}>{cur.healthProfile}</h2><button style={S.closeBtn} onClick={() => setShowProfile(false)}><X size={20} /></button></div>
                <div style={S.profileForm}>
                  <div style={S.formGroup}><label style={S.label}>{cur.fullName}</label><div style={S.inputWrap}><User size={16} style={S.inputIcon} /><input style={S.input} type="text" value={profile.name} onChange={e => syncProfile({ ...profile, name: e.target.value })}/></div></div>
                  <div style={S.formRow}><div style={S.formGroup}><label style={S.label}>{cur.age}</label><input style={S.input} type="number" value={profile.age} onChange={e => syncProfile({ ...profile, age: e.target.value })}/></div><div style={S.formGroup}><label style={S.label}>{cur.weight}</label><input style={S.input} type="number" value={profile.weight} onChange={e => syncProfile({ ...profile, weight: e.target.value })}/></div></div>
                  <div style={S.formGroup}><label style={S.label}>{cur.location}</label><select style={S.select} value={profile.location} onChange={e => syncProfile({ ...profile, location: e.target.value })}><option value="">Select State</option>{STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div style={S.formGroup}><label style={S.label}>{cur.langPref}</label>
                    <div style={S.langSelectRow}>{LANGS.map(l => (<button key={l.code} onClick={() => { setLang(l.code); syncProfile({ ...profile, language: l.code }); }} style={{ ...S.langOpt, ...(lang === l.code ? S.langOptActive : {}) }}>{l.label}</button>))}</div>
                  </div>
                  <button style={S.saveBtn} onClick={() => setShowProfile(false)}>{cur.save}</button>
                  <button style={{ ...S.resendLink, border: 'none', background: 'none' }} onClick={logout}>{cur.signOut}</button>
                </div>
              </div>
            </div>
          )}

          {showHistory && (
            <div style={S.modalOverlay} onClick={() => setShowHistory(false)}>
              <div style={{ ...S.modalContent, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                <div style={S.modalHeader}><h2 style={S.modalTitle}>{cur.scanHistory}</h2><button style={S.closeBtn} onClick={() => setShowHistory(false)}><X size={20} /></button></div>
                <div style={S.historyList}>
                  {historyItems.length === 0 ? (<div style={S.emptyHistory}><History size={48} style={{ opacity: 0.2, marginBottom: 16 }} /><p>{cur.noScans}</p></div>) : 
                  (historyItems.map((item, i) => (<div key={i} style={S.historyItem} onClick={() => { setResult(item.result_data); setShowHistory(false); setPhase('done'); }}><div style={{ ...S.miniIconStatic, background: TYPE_META[item.document_type]?.tint, color: TYPE_META[item.document_type]?.accent }}>{React.createElement(TYPE_META[item.document_type]?.icon || FileText, { size: 18 })}</div><div style={{ flex: 1 }}><div style={S.historyTitle}>{item.title}</div><div style={S.historyMeta}><Calendar size={12} style={{ marginRight: 4 }} /> {new Date(item.created_at).toLocaleDateString()}</div></div><ChevronRight size={18} style={{ color: '#B0AACC' }} /></div>)))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        body { overflow: hidden !important; margin: 0; font-family: 'Inter', sans-serif; }
        .spinnerLarge { width: 48px; height: 48px; border: 4px solid #EDEAFC; border-top-color: #7C6FCD; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .upload-hover-lavender:hover { background: #EDEAFC !important; }
        .upload-hover-mint:hover { background: #E2F7F2 !important; }
      `}</style>
    </div>
  );
}

const S = {
  authRoot: { height: '100vh', background: '#F8F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  authCircle1: { position: 'absolute', width: 400, height: 400, background: '#EDEAFC', borderRadius: '50%', top: '-10%', left: '-10%', filter: 'blur(80px)' },
  authCircle2: { position: 'absolute', width: 300, height: 300, background: '#FCE8F1', borderRadius: '50%', bottom: '5%', right: '5%', filter: 'blur(60px)' },
  authCard: { width: '100%', maxWidth: 420, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', borderRadius: 32, padding: 40, boxShadow: '0 20px 60px rgba(124, 111, 205, 0.1)', border: '1px solid rgba(255, 255, 255, 0.4)', textAlign: 'center', zIndex: 10 },
  authHeader: { marginBottom: 40 },
  authLogo: { fontSize: 28, fontWeight: 900, marginBottom: 8 },
  authSub: { fontSize: 13, color: '#7A7490' },
  authTitle: { fontSize: 24, fontWeight: 800, color: '#1C1A35', marginBottom: 12 },
  authDesc: { fontSize: 14, color: '#7A7490', lineHeight: 1.6, marginBottom: 32 },
  inputField: { background: '#FFFFFF', borderRadius: 16, border: '1.5px solid #EEEBFB', display: 'flex', alignItems: 'center', padding: '14px 20px', marginBottom: 24 },
  phonePrefix: { display: 'flex', alignItems: 'center', borderRight: '1px solid #EEEBFB', paddingRight: 12, marginRight: 16 },
  phoneInput: { flex: 1, border: 'none', outline: 'none', fontSize: 16, fontWeight: 600, color: '#1C1A35', background: 'transparent', letterSpacing: '1px' },
  authBtn: { width: '100%', background: '#7C6FCD', color: '#FFFFFF', padding: '16px', borderRadius: 16, fontSize: 15, fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(124, 111, 205, 0.2)' },
  miniSpinner: { width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  backBtn: { background: 'none', border: 'none', color: '#7C6FCD', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', marginBottom: 20, cursor: 'pointer' },
  otpRow: { display: 'flex', gap: 12, justifyContent: 'center' },
  otpBox: { width: 60, height: 72, borderRadius: 16, border: '1.5px solid #EEEBFB', background: '#FFFFFF', textAlign: 'center', fontSize: 24, fontWeight: 800, color: '#7C6FCD', outline: 'none' },
  resendText: { fontSize: 13, color: '#7A7490', marginTop: 24 },
  resendLink: { color: '#7C6FCD', fontWeight: 700, cursor: 'pointer' },
  authFooter: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 40, fontSize: 11, fontWeight: 700, color: '#B0AACC', textTransform: 'uppercase', letterSpacing: '1px' },
  root: { height: '100vh', background: '#F8F7FF', color: '#1C1A35', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  nav: { height: 60, background: '#FFFFFF', borderBottom: '1px solid #EEEBFB', flexShrink: 0 },
  navInner: { maxWidth: 1400, margin: '0 auto', height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', width: '100%' },
  logo: { fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' },
  navActions: { display: 'flex', alignItems: 'center', gap: 16 },
  navIconBtn: { display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#7A7490', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  navBtnText: { color: '#7A7490' },
  vDividerNav: { width: 1, height: 24, background: '#EEEBFB' },
  profileBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 12, background: '#F8F7FF', border: '1px solid #EEEBFB', color: '#7C6FCD' },
  userName: { fontSize: 13, fontWeight: 700, color: '#1C1A35' },
  main: { maxWidth: 1400, margin: '0 auto', flex: 1, padding: '0 40px 40px 40px', width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflowY: 'auto' },
  staticLayoutPC: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0' },
  heroStatic: { marginBottom: 32, maxWidth: 900 },
  taglineStatic: { background: '#EDEAFC', color: '#4A3FA0', fontSize: 10, fontWeight: 800, borderRadius: 999, padding: '6px 16px', display: 'inline-block', marginBottom: 16, letterSpacing: '0.5px', textTransform: 'uppercase' },
  h1Static: { fontSize: 44, fontWeight: 900, lineHeight: 1.1, margin: 0, letterSpacing: '-1px' },
  quoteStatic: { fontSize: 15, color: '#7A7490', marginTop: 12, fontStyle: 'italic', maxWidth: 580, lineHeight: 1.5 },
  docDisplayStatic: { display: 'flex', gap: 16, marginBottom: 32 },
  miniBoxStatic: { background: '#FFFFFF', border: '1px solid #EAE8F5', borderRadius: 20, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 170, textAlign: 'left', boxShadow: '0 2px 8px rgba(124, 111, 205, 0.03)' },
  miniIconStatic: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  miniCodeStatic: { fontSize: 9, fontWeight: 900, letterSpacing: '0.5px', marginBottom: 1 },
  miniTitleStatic: { fontSize: 13, fontWeight: 700 },
  uploadPanelStatic: { background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(10px)', border: '1.5px dashed #C4BCEE', borderRadius: 32, padding: '24px 40px', display: 'flex', alignItems: 'center', width: '100%', maxWidth: 840, boxShadow: '0 10px 40px rgba(124, 111, 205, 0.08)' },
  actionStatic: { flex: 1, display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', padding: '16px 24px', borderRadius: 20, transition: 'all 0.2s ease' },
  actionIconStatic: { width: 48, height: 48, borderRadius: 14, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' },
  actionTitleStatic: { fontSize: 15, fontWeight: 800, color: '#1C1A35' },
  actionSubStatic: { fontSize: 12, color: '#7A7490' },
  vDividerStatic: { width: 1, height: 60, background: '#EEEBFB' },
  footerStatic: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 },
  footerItem: { display: 'flex', alignItems: 'center', fontSize: 12, color: '#B0AACC', fontWeight: 600 },
  dotSeparator: { width: 4, height: 4, borderRadius: '50%', background: '#EEEBFB' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(28, 26, 53, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#FFFFFF', borderRadius: 32, width: '100%', maxWidth: 480, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 800, color: '#1C1A35' },
  closeBtn: { background: '#F8F7FF', color: '#7A7490', border: 'none', borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  historyList: { display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' },
  historyItem: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 20, background: '#F8F7FF', border: '1px solid #EEEBFB', cursor: 'pointer' },
  historyTitle: { fontSize: 15, fontWeight: 700, color: '#1C1A35' },
  historyMeta: { fontSize: 12, color: '#B0AACC', display: 'flex', alignItems: 'center', marginTop: 4 },
  emptyHistory: { textAlign: 'center', padding: '40px 0', color: '#B0AACC' },
  profileForm: { display: 'flex', flexDirection: 'column', gap: 20 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { fontSize: 12, fontWeight: 700, color: '#7A7490' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, color: '#7C6FCD' },
  input: { width: '100%', padding: '12px 14px 12px 40px', borderRadius: 14, border: '1.5px solid #EEEBFB', fontSize: 14 },
  select: { width: '100%', padding: '12px 14px 12px 40px', borderRadius: 14, border: '1.5px solid #EEEBFB', fontSize: 14, appearance: 'none' },
  langOpt: { flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid #EEEBFB', fontSize: 13, fontWeight: 600, color: '#7A7490' },
  langOptActive: { background: '#EDEAFC', color: '#7C6FCD', borderColor: '#7C6FCD' },
  saveBtn: { background: '#7C6FCD', color: '#FFFFFF', padding: '14px', borderRadius: 16, fontSize: 15, fontWeight: 700, border: 'none' },
  langSelectRow: { display: 'flex', gap: 8 },
  confidenceBanner: { padding: '14px 24px', borderRadius: 16, marginBottom: 32, fontSize: 14, textAlign: 'center' },
  resultLayout: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 48 },
  resultSide: { position: 'sticky', top: 0, height: 'fit-content' },
  resultHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  typeBadge: { padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800 },
  playBtn: { background: '#7C6FCD', color: '#FFFFFF', padding: '8px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700 },
  mainTitle: { fontSize: 32, fontWeight: 800, marginBottom: 24, lineHeight: 1.1 },
  carePanel: { padding: '24px', borderRadius: 24, border: '1px solid #EAE8F5', background: '#FFFFFF' },
  careBadge: { display: 'inline-block', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: '#EDEAFC', color: '#7C6FCD', marginBottom: 12 },
  careBody: { margin: 0, fontSize: 15, color: '#7A7490', lineHeight: 1.7 },
  resultContent: { display: 'flex', flexDirection: 'column', gap: 16 },
  dSection: { background: '#FFFFFF', border: '1px solid #EAE8F5', borderRadius: 24, padding: '28px' },
  dLabel: { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 16 },
  bodyP: { fontSize: 15, color: '#7A7490', lineHeight: 1.8 },
  btnFinal: { width: '100%', background: '#7C6FCD', color: '#FFFFFF', padding: '18px', borderRadius: 20, fontSize: 16, fontWeight: 800 },
  centerViewport: { height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' },
  spinnerContainer: { marginBottom: 24 },
  statusTitle: { fontSize: 20, fontWeight: 800, marginBottom: 8 },
  statusSub: { fontSize: 14, color: '#7A7490' },
};

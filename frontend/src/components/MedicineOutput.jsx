import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Pill, Play, Pause, Download, AlertTriangle, CheckCircle2, ShieldCheck, Leaf, Clock, Activity, FileText, Image as ImageIcon } from 'lucide-react';

const COLORS = {
  purple: '#7C6FCD', purpleTint: '#EDEAFC', purpleText: '#4A3FA0',
  green: '#4CBFA4', greenTint: '#E2F7F2', greenText: '#1E7A65',
  yellow: '#E8A33D', yellowTint: '#FDF3E2', yellowText: '#8A5A14',
  red: '#E25C5C', redTint: '#FCE9E9', redText: '#9B2C2C',
  ink: '#1C1A35', muted: '#7A7490', line: '#ECEAF5',
};

const M = {
  page: { padding: '20px 0' },
  banner: { padding: '12px 20px', borderRadius: 14, fontSize: 14, marginBottom: 20 },
  header: { background: '#FFFFFF', borderRadius: 20, padding: '24px 28px', border: `1px solid ${COLORS.line}`, marginBottom: 16 },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: COLORS.purpleTint, color: COLORS.purple, fontSize: 12, fontWeight: 800, padding: '6px 12px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: 900, color: COLORS.ink, margin: '14px 0 0', lineHeight: 1.2 },
  headerBtns: { display: 'flex', gap: 10 },
  actionBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, background: COLORS.purple, color: '#FFF', border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  actionBtnGhost: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF', color: COLORS.purple, border: `1.5px solid ${COLORS.purple}`, borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  section: { background: '#FFFFFF', borderRadius: 20, padding: '22px 28px', border: `1px solid ${COLORS.line}`, marginBottom: 16 },
  sectionLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  summaryText: { fontSize: 16, lineHeight: 1.75, color: COLORS.ink, margin: 0 },
  medGrid: { display: 'flex', flexDirection: 'column', gap: 18 },
  medCard: { borderRadius: 16, border: `1px solid ${COLORS.line}`, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(28,26,53,0.05)', overflow: 'hidden' },
  medHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '20px 24px' },
  medName: { fontSize: 20, fontWeight: 800, color: COLORS.greenText, margin: 0 },
  medPurpose: { fontSize: 14.5, color: COLORS.muted, fontWeight: 500, margin: '5px 0 0' },
  doseBox: { display: 'flex', border: `1px solid ${COLORS.line}`, borderRadius: 12, overflow: 'hidden' },
  doseCol: { padding: '10px 20px', textAlign: 'center' },
  doseLabel: { fontSize: 11, fontWeight: 800, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  doseValue: { fontSize: 15, fontWeight: 800, color: COLORS.ink },
  medBody: { display: 'flex', flexWrap: 'wrap', gap: 24, borderTop: `1px solid ${COLORS.line}`, padding: '18px 24px' },
  medCol: { flex: '1 1 260px', minWidth: 240 },
  medColHead: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, marginBottom: 8 },
  medColText: { fontSize: 14.5, color: COLORS.ink, lineHeight: 1.6, margin: 0 },
  warnItem: { display: 'flex', gap: 10, alignItems: 'flex-start', background: COLORS.redTint, border: `1px solid ${COLORS.red}30`, borderRadius: 12, padding: '12px 16px', fontSize: 14.5, color: COLORS.redText, fontWeight: 600 },
  checkItem: (warn) => ({ display: 'flex', gap: 10, alignItems: 'flex-start', background: warn ? COLORS.yellowTint : COLORS.greenTint, borderRadius: 12, padding: '12px 16px', fontSize: 14.5, color: warn ? COLORS.yellowText : COLORS.greenText, fontWeight: 600 }),
  list: { margin: 0, paddingLeft: 20, color: COLORS.ink, fontSize: 15, lineHeight: 1.9 },
  keyPoint: { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: COLORS.ink, lineHeight: 1.6, padding: '6px 0' },
  cta: { width: '100%', background: COLORS.purple, color: '#FFF', border: 'none', borderRadius: 16, padding: '18px 0', fontSize: 16, fontWeight: 800, cursor: 'pointer', marginTop: 8 },
};

function Section({ icon: Icon, label, color, children }) {
  return (
    <div style={M.section}>
      <div style={{ ...M.sectionLabel, color }}><Icon size={15} strokeWidth={2.5} /> {label}</div>
      {children}
    </div>
  );
}

export default function MedicineOutput({ result, onPlayAudio, isPlaying, onReset, labels = {} }) {
  const confSafe = result.confidence === 'high';
  const banner = confSafe
    ? { background: COLORS.greenTint, color: COLORS.greenText }
    : { background: COLORS.yellowTint, color: COLORS.yellowText };

  const pageRef = useRef(null);
  const [showDownload, setShowDownload] = useState(false);

  const downloadPdf = () => { setShowDownload(false); window.print(); };

  const downloadImage = async () => {
    setShowDownload(false);
    const canvas = await html2canvas(pageRef.current, { backgroundColor: '#F7F6FC', scale: 2 });
    const link = document.createElement('a');
    link.download = `${(result.title || 'medicine').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={M.page} ref={pageRef}>
      <div style={{ ...M.banner, ...banner }}>
        <strong>{result.confidence} {labels.confNote || 'Confidence'}</strong>
        {result.confidence_note && <span> • {result.confidence_note}</span>}
      </div>

      {/* 1. HEADER */}
      <div style={M.header}>
        <div style={M.headerTop}>
          <div style={M.badge}><Pill size={13} /> Medicine</div>
          <div style={M.headerBtns}>
            <button style={M.actionBtn} onClick={onPlayAudio}>
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              {isPlaying ? 'Pause Audio' : 'Play Audio'}
            </button>
            <div style={{ position: 'relative' }}>
              <button style={M.actionBtnGhost} onClick={() => setShowDownload(v => !v)}><Download size={15} /> Download</button>
              {showDownload && (
                <div style={{ position: 'absolute', top: '110%', right: 0, background: '#FFF', border: `1px solid ${COLORS.line}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(28,26,53,0.12)', zIndex: 20, overflow: 'hidden', minWidth: 190 }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: COLORS.ink, cursor: 'pointer' }} onClick={downloadPdf}>
                    <FileText size={16} color={COLORS.purple} /> Download as PDF
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderTop: `1px solid ${COLORS.line}`, fontSize: 14, fontWeight: 600, color: COLORS.ink, cursor: 'pointer' }} onClick={downloadImage}>
                    <ImageIcon size={16} color={COLORS.green} /> Download as Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <h1 style={M.title}>{result.title}</h1>
      </div>

      {/* 2. AI SUMMARY */}
      {result.summary && (
        <Section icon={Activity} label={labels.summary || 'AI Summary'} color={COLORS.purple}>
          <p style={M.summaryText}>{result.summary}</p>
        </Section>
      )}

      {/* 3. MEDICINE CARDS */}
      {result.medicines?.length > 0 && (
        <Section icon={Pill} label="Medicines Detected" color={COLORS.purple}>
          <div style={M.medGrid}>
            {result.medicines.map((med, i) => {
              const sideEffects = (med.side_effects || '').split(/[;.]\s*/).map(s => s.trim()).filter(Boolean);
              return (
                <div key={i} style={M.medCard}>
                  <div style={M.medHead}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <h3 style={M.medName}>{med.name}</h3>
                      {med.purpose && <p style={M.medPurpose}>{med.purpose}</p>}
                    </div>
                    {(med.dosage || med.frequency) && (
                      <div style={M.doseBox}>
                        {med.dosage && (
                          <div style={M.doseCol}>
                            <div style={M.doseLabel}>Dosage</div>
                            <div style={M.doseValue}>{med.dosage}</div>
                          </div>
                        )}
                        {med.frequency && (
                          <div style={{ ...M.doseCol, borderLeft: med.dosage ? `1px solid ${COLORS.line}` : 'none' }}>
                            <div style={M.doseLabel}>Frequency</div>
                            <div style={M.doseValue}>{med.frequency}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {(med.instructions || sideEffects.length > 0) && (
                    <div style={M.medBody}>
                      {med.instructions && (
                        <div style={M.medCol}>
                          <div style={{ ...M.medColHead, color: COLORS.ink }}><Clock size={16} color={COLORS.muted} /> Instructions</div>
                          <p style={M.medColText}>{med.instructions}</p>
                        </div>
                      )}
                      {sideEffects.length > 0 && (
                        <div style={M.medCol}>
                          <div style={{ ...M.medColHead, color: COLORS.red }}><AlertTriangle size={16} /> Side Effects / Warnings</div>
                          <ul style={{ ...M.medColText, paddingLeft: 18 }}>
                            {sideEffects.map((s, j) => <li key={j}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* 4. IMPORTANT WARNINGS — only when real warnings exist */}
      {result.important_warnings?.length > 0 && (
        <Section icon={AlertTriangle} label="Important Warnings" color={COLORS.red}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.important_warnings.map((w, i) => (
              <div key={i} style={M.warnItem}><AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} /> {w}</div>
            ))}
          </div>
        </Section>
      )}

      {/* 5. SAFETY CHECK */}
      {result.safety_checks?.length > 0 && (
        <Section icon={ShieldCheck} label="Safety Check" color={COLORS.green}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.safety_checks.map((c, i) => {
              const warn = c.status === 'warning';
              const Icon = warn ? AlertTriangle : CheckCircle2;
              return <div key={i} style={M.checkItem(warn)}><Icon size={17} style={{ flexShrink: 0, marginTop: 2 }} /> {c.message}</div>;
            })}
          </div>
        </Section>
      )}

      {/* 6. ADVICE / RECOMMENDATIONS */}
      {result.advice?.length > 0 && (
        <Section icon={Leaf} label="Advice & Recovery Tips" color={COLORS.green}>
          <ul style={M.list}>
            {result.advice.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </Section>
      )}

      {/* 7. KEY POINTS */}
      {result.key_points?.length > 0 && (
        <Section icon={CheckCircle2} label="Key Points" color={COLORS.purple}>
          {result.key_points.map((p, i) => (
            <div key={i} style={M.keyPoint}>
              <CheckCircle2 size={16} color={COLORS.green} style={{ flexShrink: 0, marginTop: 4 }} /> {p}
            </div>
          ))}
        </Section>
      )}

      {/* 8. FOOTER CTA */}
      <button style={M.cta} onClick={onReset}>{labels.scanAnother || 'Scan Another Document'}</button>
    </div>
  );
}

// Upload flow: drop Excel → AI ingests → matches → user reviews → bulk send.

function Upload() {
  const { go, claims: existing, lookups, pushToast, logBot } = useStore();
  const [step, setStep] = useState('idle'); // idle, parsing, matching, review, dispatching, done
  const [filename, setFilename] = useState('');
  const [progress, setProgress] = useState(0);
  const [matched, setMatched] = useState([]); // synthetic preview rows

  // Synthetic preview rows for the demo
  const previewRows = useMemo(() => ([
    { row: 2,  raw: { title: 'Festival',                 performer: 'Banda Local NN',         iswc: '—', usage: 'Live',     amount: 184500 }, match: { workId: 'w-1010', confidence: 0.94 } },
    { row: 3,  raw: { title: 'Cumbia s/título',          performer: 'Los Reyes del Barrio',   iswc: '—', usage: 'Bailable', amount: 67200  }, match: { workId: 'w-1004', confidence: 0.88 } },
    { row: 4,  raw: { title: 'Aire del Sur',             performer: 'Solista NN',             iswc: 'T-901.234.567-8', usage: 'Streaming', amount: 41200 }, match: { workId: 'w-1007', confidence: 0.99 } },
    { row: 5,  raw: { title: 'Instrumental jazz #3',     performer: 'Cuarteto Independiente', iswc: '—', usage: 'Radio',    amount: 12800  }, match: { workId: 'w-1006', confidence: 0.91 } },
    { row: 6,  raw: { title: 'Marcha del 25',            performer: 'Banda Militar',          iswc: 'T-555.111.222-3', usage: 'Acto', amount: 4200   }, match: null },
    { row: 7,  raw: { title: 'Ringtone #45',             performer: '—',                       iswc: '—', usage: 'Telco',    amount: 800    }, match: null },
    { row: 8,  raw: { title: 'Balada para Vos',          performer: 'Lila Ferreyra',          iswc: 'T-700.800.900-1', usage: 'Streaming', amount: 89400 }, match: { workId: 'w-1009', confidence: 0.92 } },
    { row: 9,  raw: { title: 'Carta a la Hermana',       performer: 'Tomás Belarde',          iswc: '—', usage: 'Radio',    amount: 22100  }, match: { workId: 'w-1003', confidence: 0.97 } },
    { row: 10, raw: { title: 'Madrugada Av Forest',      performer: 'Mariana Q.',             iswc: '—', usage: 'Live',     amount: 56800  }, match: { workId: 'w-1001', confidence: 0.96 } },
    { row: 11, raw: { title: 'Día de semana',            performer: 'Tomás Belarde',          iswc: '—', usage: 'Streaming', amount: 14300 }, match: { workId: 'w-1011', confidence: 0.93 } },
    { row: 12, raw: { title: 'Hotel Vacio',              performer: 'Mariana Quintero',       iswc: '—', usage: 'TV',       amount: 31900  }, match: { workId: 'w-1002', confidence: 0.95 } },
    { row: 13, raw: { title: 'Plaza San Martin',         performer: 'Bruno Pasqualini',       iswc: '—', usage: 'Sync',     amount: 142000 }, match: { workId: 'w-1008', confidence: 0.89 } },
    { row: 14, raw: { title: 'Bailable lunes',           performer: 'Los Reyes del Barrio',   iswc: '—', usage: 'Bailable', amount: 8400   }, match: { workId: 'w-1005', confidence: 0.87 } },
    { row: 15, raw: { title: 'Marzo en cinta',           performer: 'Mariana Q.',             iswc: '—', usage: 'Streaming', amount: 9200  }, match: { workId: 'w-1012', confidence: 0.95 } },
    { row: 16, raw: { title: 'Forever',                  performer: 'John',                    iswc: '—', usage: 'TV',       amount: 18500  }, match: null },
  ]), []);

  const onPick = (name = 'ejemplo_derechos_indeterminados_SADAIC.xlsx') => {
    setFilename(name);
    setStep('parsing');
    setProgress(0);
    let p = 0;
    const id = setInterval(() => {
      p += 5 + Math.random() * 8;
      if (p >= 100) {
        p = 100;
        clearInterval(id);
        setProgress(100);
        setTimeout(() => {
          setStep('matching');
          runMatching();
        }, 300);
      } else {
        setProgress(Math.floor(p));
      }
    }, 80);
  };

  const runMatching = () => {
    setMatched([]);
    let i = 0;
    const id = setInterval(() => {
      if (i >= previewRows.length) {
        clearInterval(id);
        setStep('review');
        return;
      }
      setMatched(m => [...m, previewRows[i]]);
      i++;
    }, 110);
  };

  const goReview = () => setStep('review');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Ingest unidentified-rights report"
        subtitle="Drop a SADAIC report → agent matches rows against your catalog → you approve & dispatch."
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 60px' }}>
        {/* Stepper */}
        <Stepper step={step} />

        {step === 'idle' && (
          <div style={{
            marginTop: 24, border: '2px dashed var(--border)', borderRadius: 10,
            padding: 60, textAlign: 'center', background: 'var(--bg)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
              background: 'oklch(96% 0.02 250)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)',
            }}>
              <Icon name="excel" size={26} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--fg)' }}>Drop SADAIC unidentified-rights report</div>
            <div style={{ fontSize: 13, color: 'var(--fg-mute)', marginTop: 6 }}>
              .xlsx exported from CIS-Net or sent by SADAIC. The agent will parse, fuzzy-match, and rank against your catalog.
            </div>
            <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Btn variant="primary" icon={<Icon name="upload" size={13} />} onClick={() => onPick()}>Select file</Btn>
              <Btn variant="secondary" onClick={() => onPick('q1-2024-derechos-indeterminados.xlsx')}>Use sample report</Btn>
            </div>
            <div style={{
              marginTop: 30, display: 'inline-flex', gap: 14, padding: '10px 18px',
              fontSize: 11.5, color: 'var(--fg-mute)', fontFamily: 'var(--mono)',
              background: 'var(--bg-mute)', borderRadius: 6,
            }}>
              <span>Expected columns: ID · ISWC · Título · Intérprete · Período · Monto</span>
            </div>
          </div>
        )}

        {step === 'parsing' && (
          <ProgressPanel
            title="Parsing spreadsheet"
            sub={filename}
            progress={progress}
            log={[
              { ok: progress > 5,  text: 'Reading workbook structure' },
              { ok: progress > 30, text: 'Detected sheet "Indeterminados Q1-2024"' },
              { ok: progress > 60, text: 'Normalizing 47 rows · 21 columns' },
              { ok: progress > 90, text: 'Building search index' },
            ]}
          />
        )}

        {step === 'matching' && (
          <MatchingStream rows={matched} total={previewRows.length} onSkip={goReview} lookups={lookups} />
        )}

        {step === 'review' && (
          <Review rows={previewRows} lookups={lookups} onDispatch={(rows) => {
            setStep('dispatching');
            setTimeout(() => {
              setStep('done');
              logBot({ kind: 'send', text: `Dispatched ${rows.length} new claims to SADAIC` });
            }, 1800);
          }} />
        )}

        {step === 'dispatching' && (
          <ProgressPanel
            title="Dispatching claims to SADAIC"
            sub="Drafting personalized emails with attachments…"
            progress={70}
            log={[
              { ok: true, text: 'Composing 13 emails with auto-attached evidence' },
              { ok: true, text: 'Connecting to reclamos@sadaic.org.ar' },
              { ok: false, text: 'Sending in queue (rate-limited 1 req/s)' },
            ]}
          />
        )}

        {step === 'done' && (
          <DoneCard onSeeInbox={() => go('inbox')} />
        )}
      </div>
    </div>
  );
}

function Stepper({ step }) {
  const steps = [
    { k: 'parsing',     label: 'Parse' },
    { k: 'matching',    label: 'Match against catalog' },
    { k: 'review',      label: 'Review' },
    { k: 'dispatching', label: 'Dispatch' },
    { k: 'done',        label: 'Done' },
  ];
  const order = ['idle', 'parsing', 'matching', 'review', 'dispatching', 'done'];
  const curIdx = order.indexOf(step);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {steps.map((s, i) => {
        const idxInOrder = order.indexOf(s.k);
        const past = curIdx > idxInOrder;
        const cur  = curIdx === idxInOrder;
        return (
          <React.Fragment key={s.k}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11,
                background: past ? 'oklch(58% 0.13 150)' : cur ? 'var(--accent)' : 'var(--bg-mute)',
                color: past || cur ? '#fff' : 'var(--fg-mute)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)',
              }}>{past ? <Icon name="check" size={11} /> : i + 1}</div>
              <span style={{
                fontSize: 13, fontWeight: cur ? 600 : 400,
                color: cur || past ? 'var(--fg)' : 'var(--fg-mute)',
              }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--border)', maxWidth: 60 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ProgressPanel({ title, sub, progress, log }) {
  return (
    <div style={{
      marginTop: 24, border: '1px solid var(--border)', borderRadius: 10,
      padding: 24, background: 'var(--bg)', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="sparkle" size={16} style={{ color: 'var(--accent)' }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{title}</div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{progress}%</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 4 }}>{sub}</div>

      <div style={{ marginTop: 16, height: 4, background: 'var(--bg-mute)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: progress + '%', height: '100%', background: 'var(--accent)', transition: 'width .12s' }} />
      </div>

      <div style={{ marginTop: 16 }}>
        {log.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12.5, color: l.ok ? 'var(--fg)' : 'var(--fg-mute)' }}>
            {l.ok ? <Icon name="check" size={12} style={{ color: 'oklch(58% 0.13 150)' }} /> : <span className="dot-pulse" />}
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchingStream({ rows, total, onSkip, lookups }) {
  const matched = rows.filter(r => r.match).length;
  const pct = Math.round((rows.length / total) * 100);
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Icon name="sparkle" size={14} style={{ color: 'var(--accent)' }} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>Matching against catalog…</div>
        <span style={{ fontSize: 12, color: 'var(--fg-mute)' }}>{rows.length}/{total} rows · {matched} matched · {rows.length - matched} unmatched</span>
        <div style={{ flex: 1 }} />
        <Btn size="sm" variant="ghost" onClick={onSkip}>Skip animation →</Btn>
      </div>
      <div style={{ height: 4, background: 'var(--bg-mute)', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ width: pct + '%', height: '100%', background: 'var(--accent)', transition: 'width .15s' }} />
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: 'var(--bg-mute)' }}>
              <th style={thStyle}>Row</th>
              <th style={thStyle}>Title (raw)</th>
              <th style={thStyle}>Performer (raw)</th>
              <th style={thStyle}>ISWC</th>
              <th style={thStyle}>Match</th>
              <th style={thStyle}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const w = r.match ? lookups.workById[r.match.workId] : null;
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', animation: 'slideUp .25s ease-out' }}>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', color: 'var(--fg-mute)', width: 50 }}>{r.row}</td>
                  <td style={tdStyle}>{r.raw.title}</td>
                  <td style={{ ...tdStyle, color: 'var(--fg-mute)' }}>{r.raw.performer}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-mute)' }}>{r.raw.iswc}</td>
                  <td style={tdStyle}>
                    {w ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="arrowRight" size={11} style={{ color: 'oklch(58% 0.13 150)' }} />
                        <span>{w.title}</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--fg-mute)', fontStyle: 'italic' }}>no match</span>
                    )}
                  </td>
                  <td style={tdStyle}>{r.match ? <ConfidenceBar value={r.match.confidence} /> : <span style={{ color: 'var(--fg-mute)' }}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Review({ rows, lookups, onDispatch }) {
  const [selected, setSelected] = useState(new Set(rows.filter(r => r.match && r.match.confidence >= 0.85).map(r => r.row)));
  const matched = rows.filter(r => r.match);
  const unmatched = rows.filter(r => !r.match);
  const totalAmount = rows.filter(r => selected.has(r.row)).reduce((s, r) => s + r.raw.amount, 0);

  const toggle = (row) => setSelected(s => {
    const n = new Set(s);
    if (n.has(row)) n.delete(row); else n.add(row);
    return n;
  });

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <Stat label="Total rows"        value={rows.length} mono />
        <Stat label="Matched"           value={matched.length} positive />
        <Stat label="Unmatched"         value={unmatched.length} muted />
        <Stat label="Selected to send"  value={selected.size}    sub={fmt.money(totalAmount)} />
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg)' }}>
        <div style={{
          padding: '10px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-mute)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Review matches before dispatch</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn size="sm" variant="ghost" onClick={() => setSelected(new Set(matched.map(r => r.row)))}>Select all matches</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Btn>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              <th style={{ ...thStyle, width: 30 }}></th>
              <th style={thStyle}>Row · Title</th>
              <th style={thStyle}>Performer</th>
              <th style={thStyle}>Matched work</th>
              <th style={thStyle}>Confidence</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const w = r.match ? lookups.workById[r.match.workId] : null;
              const ok = !!w;
              const isSel = selected.has(r.row);
              return (
                <tr key={r.row} style={{
                  borderBottom: '1px solid var(--border)',
                  background: isSel ? 'oklch(98% 0.01 250)' : 'transparent',
                  cursor: ok ? 'pointer' : 'default',
                  opacity: ok ? 1 : 0.6,
                }} onClick={() => ok && toggle(r.row)}>
                  <td style={tdStyle}>
                    <input type="checkbox" checked={isSel} onChange={() => {}} disabled={!ok} style={{ cursor: ok ? 'pointer' : 'not-allowed' }} />
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-mute)', marginRight: 8 }}>#{r.row}</span>
                    <span style={{ fontWeight: 500 }}>{r.raw.title}</span>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--fg-mute)' }}>{r.raw.performer}</td>
                  <td style={tdStyle}>
                    {w ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{w.title}</div>
                        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{w.iswc}</div>
                      </div>
                    ) : <span style={{ color: 'var(--fg-mute)' }}>—</span>}
                  </td>
                  <td style={tdStyle}>{r.match ? <ConfidenceBar value={r.match.confidence} /> : <span style={{ color: 'var(--fg-mute)' }}>—</span>}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', textAlign: 'right' }}>{fmt.money(r.raw.amount).replace('AR$ ', '$')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Btn variant="ghost">Cancel</Btn>
        <Btn variant="primary" icon={<Icon name="mail" size={13} />} disabled={selected.size === 0}
          onClick={() => onDispatch(rows.filter(r => selected.has(r.row)))}>
          Dispatch {selected.size} claim{selected.size === 1 ? '' : 's'}
        </Btn>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, positive, muted, mono }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, background: 'var(--bg)' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--fg-mute)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6, letterSpacing: -0.4,
        color: positive ? 'oklch(45% 0.13 150)' : muted ? 'var(--fg-mute)' : 'var(--fg)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--fg-mute)', marginTop: 4, fontFamily: mono === false ? 'inherit' : 'var(--mono)' }}>{sub}</div>}
    </div>
  );
}

function DoneCard({ onSeeInbox }) {
  return (
    <div style={{
      marginTop: 24, padding: 36, textAlign: 'center', maxWidth: 540, marginLeft: 'auto', marginRight: 'auto',
      border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 28, background: 'oklch(58% 0.13 150)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#fff',
      }}><Icon name="check" size={26} /></div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)' }}>13 claims dispatched</div>
      <div style={{ fontSize: 13, color: 'var(--fg-mute)', marginTop: 6 }}>
        SADAIC will respond within 10 business days. The agent will auto-handle confirmations and pull you in only if evidence is requested.
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Btn variant="primary" onClick={onSeeInbox} icon={<Icon name="inbox" size={13} />}>Open inbox</Btn>
      </div>
    </div>
  );
}

window.Upload = Upload;

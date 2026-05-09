// Dashboard view: KPIs, today's bot run, status pipeline, recent activity.
const { useMemo: useMemoD } = React;

function Dashboard() {
  const { claims, botLog, go, lookups, works } = useStore();

  const kpi = useMemo(() => {
    const recovered = claims.filter(c => c.status === 'resolved').reduce((s, c) => s + c.amount, 0);
    const pending   = claims.filter(c => ['detected', 'submitted', 'awaiting_evidence'].includes(c.status)).reduce((s, c) => s + c.amount, 0);
    const blocked   = claims.filter(c => c.status === 'awaiting_evidence').reduce((s, c) => s + c.amount, 0);
    const inflight  = claims.filter(c => c.status === 'submitted').length;
    const matched   = claims.filter(c => c.workId).length;
    const total     = claims.length;
    return { recovered, pending, blocked, inflight, matched, total };
  }, [claims]);

  const byStatus = useMemo(() => {
    const order = ['detected', 'submitted', 'awaiting_evidence', 'resolved', 'rejected'];
    return order.map(s => ({
      status: s,
      count: claims.filter(c => c.status === s).length,
      sum: claims.filter(c => c.status === s).reduce((a, c) => a + c.amount, 0),
    }));
  }, [claims]);

  // Mini sparkline (mock 8 weeks)
  const spark = [4, 6, 5, 8, 7, 11, 9, 13];
  const sparkMax = Math.max(...spark);

  const recent = [...claims].sort((a, b) => (b.matchedAt || '').localeCompare(a.matchedAt || '')).slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        eyebrow="Today · April 30, 2024"
        title="Overview"
        subtitle="Autonomous reclaim agent · Calma Ediciones SRL"
        actions={<>
          <Btn variant="secondary" icon={<Icon name="refresh" size={13} />}>Resync SADAIC</Btn>
          <Btn variant="primary" icon={<Icon name="upload" size={13} />} onClick={() => go('upload')}>Ingest report</Btn>
        </>}
      />

      <div style={{ overflowY: 'auto', padding: '20px 28px 60px', flex: 1 }}>

        {/* Bot today panel */}
        <div style={{
          border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)',
          padding: 18, marginBottom: 20, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 280, height: '100%',
            background: 'radial-gradient(circle at 80% 50%, oklch(96% 0.03 250), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Icon name="bot" size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fg-mute)' }}>Agent log · today</span>
            <span style={{ fontSize: 11, color: 'var(--fg-mute)' }}>·</span>
            <span style={{ fontSize: 11, color: 'oklch(58% 0.13 150)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: 'oklch(58% 0.13 150)' }} />
              Idle — last action 11:08
            </span>
          </div>
          <div style={{ fontSize: 19, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1.45, color: 'var(--fg)', maxWidth: 720 }}>
            I claimed <span style={{ color: 'var(--accent)' }}>4 works</span> against SADAIC today, recovered <span style={{ color: 'oklch(45% 0.13 150)' }}>AR$ 35.5k</span> in pending royalties, and flagged <span style={{ color: 'oklch(45% 0.16 55)' }}>2 cases</span> that need your evidence.
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 16, fontSize: 12, color: 'var(--fg-mute)' }}>
            <span><b style={{ color: 'var(--fg)' }}>47</b> rows ingested</span>
            <span><b style={{ color: 'var(--fg)' }}>31</b> matched</span>
            <span><b style={{ color: 'var(--fg)' }}>4</b> sent to SADAIC</span>
            <span><b style={{ color: 'var(--fg)' }}>10</b> out-of-roster · skipped</span>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <KpiCard label="Recovered (YTD)"  value={fmt.money(kpi.recovered)}  delta="+12.4%" deltaPos sub="paid out by SADAIC" />
          <KpiCard label="Pending royalties" value={fmt.money(kpi.pending)}    delta="+3.1%"  deltaPos sub={`${kpi.inflight} claims in flight`} />
          <KpiCard label="Blocked on evidence" value={fmt.money(kpi.blocked)}  delta="2 cases" sub="needs operator action" warn />
          <KpiCard label="Match rate"        value={Math.round(kpi.matched / kpi.total * 100) + '%'} delta={`${kpi.matched}/${kpi.total}`} sub="ingested → catalog" />
        </div>

        {/* Pipeline + activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* Pipeline */}
          <Panel
            title="Claim pipeline"
            right={<span style={{ fontSize: 11, color: 'var(--fg-mute)', fontFamily: 'var(--mono)' }}>{kpi.total} claims</span>}>
            <div style={{ padding: '4px 0' }}>
              {byStatus.map(b => {
                const m = STATUS_META[b.status];
                const pctW = (b.count / Math.max(...byStatus.map(x => x.count))) * 100;
                return (
                  <div key={b.status} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 90px 90px', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: m.dot }} />
                      <span style={{ fontSize: 12.5, color: 'var(--fg)' }}>{m.label}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-mute)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: pctW + '%', height: '100%', background: m.dot, opacity: 0.7 }} />
                    </div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--fg)', textAlign: 'right' }}>{b.count}</div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--fg-mute)', textAlign: 'right' }}>{fmt.money(b.sum).replace('AR$ ', '$')}</div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Recovered sparkline */}
          <Panel title="Recovered, last 8 weeks" right={<span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'oklch(45% 0.13 150)' }}>+38% MoM</span>}>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, color: 'var(--fg)' }}>{fmt.money(kpi.recovered)}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 2 }}>17 successful claims · avg 9.2 days</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60, marginTop: 16 }}>
                {spark.map((v, i) => (
                  <div key={i} style={{ flex: 1, height: (v / sparkMax * 100) + '%',
                    background: i === spark.length - 1 ? 'var(--accent)' : 'oklch(85% 0.04 250)',
                    borderRadius: 3, transition: 'height .3s' }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--fg-mute)', marginTop: 6 }}>
                <span>W09</span><span>W11</span><span>W13</span><span>W15</span><span>W17</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Recent + activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <Panel title="Recent claims" right={<a onClick={() => go('inbox')} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>View all →</a>}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: 'var(--bg-mute)' }}>
                  {['ID', 'Title', 'Match', 'Confidence', 'Amount', 'Status'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(c => {
                  const w = c.workId ? lookups.workById[c.workId] : null;
                  return (
                    <tr key={c.id} onClick={() => go('claim', c.id)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mute)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--fg-mute)' }}>{c.id.slice(-6)}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{c.cisacTitle}</td>
                      <td style={{ ...tdStyle, color: w ? 'var(--fg)' : 'var(--fg-mute)' }}>{w ? w.title : '—'}</td>
                      <td style={tdStyle}><ConfidenceBar value={c.confidence} /></td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--mono)', textAlign: 'right' }}>{fmt.money(c.amount).replace('AR$ ', '$')}</td>
                      <td style={tdStyle}><StatusBadge status={c.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          <Panel title="Agent activity">
            <div style={{ padding: '6px 0' }}>
              {botLog.slice(0, 8).map((e, i) => {
                const icon = { ingest: 'upload', match: 'sparkle', send: 'mail', inbound: 'inbox', review: 'eye', reject: 'x' }[e.kind] || 'clock';
                const color = { send: 'oklch(35% 0.13 250)', inbound: 'oklch(40% 0.13 55)', match: 'oklch(45% 0.13 150)', reject: 'oklch(50% 0.16 25)' }[e.kind] || 'var(--fg-mute)';
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--bg-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
                      <Icon name={icon} size={12} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--fg)', lineHeight: 1.4 }}>{e.text}</div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)', marginTop: 2 }}>{e.ts}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, delta, deltaPos, sub, warn }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)',
      padding: 14, position: 'relative',
    }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--fg-mute)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, marginTop: 8, color: 'var(--fg)' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--fg-mute)' }}>{sub}</span>
        {delta && (
          <span style={{
            fontSize: 11, fontFamily: 'var(--mono)',
            color: warn ? 'oklch(45% 0.13 55)' : (deltaPos ? 'oklch(45% 0.13 150)' : 'var(--fg-mute)'),
          }}>{delta}</span>
        )}
      </div>
    </div>
  );
}

function Panel({ title, right, children, style }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)',
      overflow: 'hidden', ...style,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{title}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

const thStyle = {
  textAlign: 'left', padding: '8px 14px', fontSize: 11, fontFamily: 'var(--mono)',
  textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--fg-mute)', fontWeight: 500,
  borderBottom: '1px solid var(--border)',
};
const tdStyle = { padding: '10px 14px', color: 'var(--fg)', verticalAlign: 'middle' };

window.Dashboard = Dashboard;
window.Panel = Panel;
window.thStyle = thStyle;
window.tdStyle = tdStyle;

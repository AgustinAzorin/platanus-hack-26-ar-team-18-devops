// Catalog views: Works, Artists, Evidence, Contracts. Plus Action-required inbox.

// =================================================================
// ACTIONS (subset of inbox = awaiting_evidence)
// =================================================================
function ActionsInbox() {
  const { claims, lookups, go } = useStore();
  const items = useMemo(() => claims.filter(c => c.status === 'awaiting_evidence'), [claims]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Action required"
        subtitle="SADAIC asked for additional evidence the agent doesn't have. Upload here so the agent can reply."
        eyebrow={`${items.length} CASE${items.length === 1 ? '' : 'S'} BLOCKED`}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 60px' }}>
        {items.length === 0 && (
          <div style={{ padding: 80, textAlign: 'center', color: 'var(--fg-mute)' }}>
            <Icon name="check" size={32} style={{ color: 'oklch(58% 0.13 150)' }} />
            <div style={{ fontSize: 15, fontWeight: 500, marginTop: 12, color: 'var(--fg)' }}>All caught up.</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>The agent has everything it needs.</div>
          </div>
        )}
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map(c => {
            const w = c.workId ? lookups.workById[c.workId] : null;
            const a = w ? lookups.artistById[w.artistId] : null;
            const due = c.requestedEvidence?.dueBy;
            const daysLeft = due ? Math.ceil((new Date(due) - new Date('2024-05-08')) / (1000 * 60 * 60 * 24)) : null;
            const urgent = daysLeft != null && daysLeft <= 7;
            return (
              <div key={c.id} onClick={() => go('claim', c.id)}
                style={{
                  border: '1px solid var(--border)', borderLeft: `3px solid ${urgent ? 'oklch(58% 0.18 25)' : 'oklch(70% 0.16 65)'}`,
                  borderRadius: 8, padding: 16, background: 'var(--bg)', cursor: 'pointer',
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mute)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{c.id}</span>
                    <StatusBadge status={c.status} />
                    {urgent && <Badge kind="danger" dot="oklch(58% 0.18 25)">Due in {daysLeft}d</Badge>}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)', marginBottom: 4 }}>
                    {w ? w.title : c.cisacTitle} <span style={{ color: 'var(--fg-mute)', fontWeight: 400, fontSize: 13 }}>· {a?.name || c.performer}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--fg-mute)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="flag" size={12} />
                    SADAIC requested: <span style={{ color: 'var(--fg)', fontWeight: 500 }}>{c.requestedEvidence?.label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--fg)' }}>{fmt.money(c.amount)}</div>
                  <Btn variant="primary" size="sm" icon={<Icon name="upload" size={11} />}>Upload &amp; reply</Btn>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =================================================================
// WORKS
// =================================================================
function Works() {
  const { works, lookups, go } = useStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return works;
    const q = search.toLowerCase();
    return works.filter(w =>
      w.title.toLowerCase().includes(q) ||
      w.iswc.toLowerCase().includes(q) ||
      lookups.artistById[w.artistId]?.name.toLowerCase().includes(q)
    );
  }, [works, search, lookups]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Works" subtitle={`${works.length} works · ${works.filter(w => w.iswc).length} with ISWC registered`}
        actions={<>
          <Btn variant="secondary" icon={<Icon name="download" size={13} />}>Export CSV</Btn>
          <Btn variant="primary" icon={<Icon name="plus" size={13} />} onClick={() => go('newwork')}>New work</Btn>
        </>}
      />
      <SearchBar value={search} onChange={setSearch} placeholder="Search title, ISWC, artist…" />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>ISWC</th>
              <th style={thStyle}>Artist</th>
              <th style={thStyle}>Genre</th>
              <th style={thStyle}>Splits</th>
              <th style={thStyle}>Recordings</th>
              <th style={thStyle}>Evidence</th>
              <th style={thStyle}>Registered</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(w => {
              const a = lookups.artistById[w.artistId];
              const recs = lookups.recordingsByWork[w.id]?.length || 0;
              const evs  = lookups.evidenceByWork[w.id]?.length || 0;
              return (
                <tr key={w.id} onClick={() => go('work', w.id)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mute)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{w.title}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--fg-mute)' }}>{w.iswc || '—'}</td>
                  <td style={tdStyle}>{a?.name}</td>
                  <td style={tdStyle}><Badge kind="neutral">{w.genre}</Badge></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {w.contributors.map((cb, i) => {
                        const ar = lookups.artistById[cb.artistId];
                        return (
                          <div key={i} title={`${ar?.name} — ${cb.split}%`} style={{
                            width: 22, height: 22, borderRadius: 11,
                            background: 'oklch(85% 0.05 ' + (40 + i * 60) + ')',
                            color: 'oklch(35% 0.13 ' + (40 + i * 60) + ')',
                            fontSize: 10, fontWeight: 600, fontFamily: 'var(--mono)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid var(--bg)', marginLeft: i > 0 ? -8 : 0,
                          }}>{ar?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                        );
                      })}
                      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)', marginLeft: 4, alignSelf: 'center' }}>
                        {w.contributors.map(c => c.split).join('/')}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{recs}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{evs}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--fg-mute)' }}>{fmt.date(w.registeredAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =================================================================
// WORK DETAIL
// =================================================================
function WorkDetail({ workId }) {
  const { lookups, go, claims } = useStore();
  const w = lookups.workById[workId];
  if (!w) return <div style={{ padding: 40 }}>Work not found.</div>;
  const a = lookups.artistById[w.artistId];
  const recs = lookups.recordingsByWork[w.id] || [];
  const evs  = lookups.evidenceByWork[w.id]   || [];
  const ctrs = lookups.contractsByWork[w.id]  || [];
  const relatedClaims = claims.filter(c => c.workId === w.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-mute)' }}>
          <a onClick={() => go('works')} style={{ cursor: 'pointer' }}>← Works</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>{w.title}</h1>
          <Badge kind="neutral">{w.genre}</Badge>
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-mute)', marginTop: 4 }}>
          By <a onClick={() => go('artist', a.id)} style={{ color: 'var(--accent)', cursor: 'pointer' }}>{a.name}</a> · ISWC <span style={{ fontFamily: 'var(--mono)' }}>{w.iswc}</span> · {fmt.duration(w.durationSec)}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Panel title="Splits">
            {w.contributors.map((cb, i) => {
              const ar = lookups.artistById[cb.artistId];
              return (
                <div key={i} style={{ padding: '10px 14px', borderBottom: i < w.contributors.length - 1 ? '1px solid var(--border)' : 'none', display: 'grid', gridTemplateColumns: '1fr 80px 80px', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{ar.name}</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>IPI {ar.ipi}</div>
                  </div>
                  <Badge kind="neutral">{cb.role}</Badge>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, textAlign: 'right' }}>{cb.split}%</div>
                </div>
              );
            })}
          </Panel>

          <Panel title="Recordings" right={<span style={{ fontSize: 11, color: 'var(--fg-mute)' }}>{recs.length} versions</span>}>
            {recs.length === 0 && <div style={{ padding: 16, color: 'var(--fg-mute)', fontSize: 12 }}>No recordings.</div>}
            {recs.map(r => (
              <div key={r.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--bg-mute)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--fg)' }}>
                  <Icon name="play" size={11} />
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{r.versionLabel}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>ISRC {r.isrc} · {fmt.date(r.recordedAt)}</div>
                </div>
                {r.dawUrl && <Badge kind="accent">DAW project</Badge>}
              </div>
            ))}
          </Panel>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <Panel title={`Evidence on file (${evs.length})`}>
            {evs.length === 0 && <div style={{ padding: 16, color: 'var(--fg-mute)', fontSize: 12 }}>No evidence yet.</div>}
            {evs.map(e => <EvidenceRow key={e.id} e={e} />)}
          </Panel>

          <Panel title={`Contracts (${ctrs.length})`}>
            {ctrs.length === 0 && <div style={{ padding: 16, color: 'var(--fg-mute)', fontSize: 12 }}>No contracts.</div>}
            {ctrs.map(c => (
              <div key={c.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 12, alignItems: 'center' }}>
                <Icon name="file" size={14} style={{ color: 'var(--fg-mute)' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.party}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{c.file}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge kind="neutral">{c.type}</Badge>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)', marginTop: 2 }}>{fmt.date(c.signedAt)}</div>
                </div>
              </div>
            ))}
          </Panel>
        </div>

        {relatedClaims.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Panel title={`Claims on this work (${relatedClaims.length})`}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <tbody>
                  {relatedClaims.map(c => (
                    <tr key={c.id} onClick={() => go('claim', c.id)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mute)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...tdStyle, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{c.id.slice(-6)}</td>
                      <td style={tdStyle}>{c.usage}</td>
                      <td style={{ ...tdStyle, color: 'var(--fg-mute)' }}>{c.venue}</td>
                      <td style={tdStyle}><StatusBadge status={c.status} /></td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--mono)', textAlign: 'right' }}>{fmt.money(c.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

function EvidenceRow({ e }) {
  const ICONS = {
    score: 'file', chords: 'file', audio_demo: 'music', daw_project: 'folder',
    mail: 'mail', chat: 'mail', prior_registration: 'file', metadata: 'file', original_file: 'file', other: 'file',
  };
  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 12, alignItems: 'center' }}>
      <Icon name={ICONS[e.type] || 'file'} size={14} style={{ color: 'var(--fg-mute)' }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-mute)' }}>{e.desc}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Badge kind="neutral">{e.type.replace('_', ' ')}</Badge>
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)', marginTop: 2 }}>{e.size}</div>
      </div>
    </div>
  );
}

// =================================================================
// ARTISTS
// =================================================================
function Artists() {
  const { artists, works, go } = useStore();
  const [search, setSearch] = useState('');
  const filtered = artists.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.ipi.includes(search));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Artists" subtitle={`${artists.length} authors and composers in the roster`} />
      <SearchBar value={search} onChange={setSearch} placeholder="Search artist or IPI…" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(a => {
            const wks = works.filter(w => w.artistId === a.id || w.contributors.some(c => c.artistId === a.id));
            const initials = a.name.split(' ').map(n => n[0]).join('').slice(0, 2);
            const hue = (a.id.charCodeAt(2) * 30) % 360;
            return (
              <div key={a.id} onClick={() => go('artist', a.id)}
                style={{
                  border: '1px solid var(--border)', borderRadius: 8, padding: 14, background: 'var(--bg)',
                  cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mute)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}>
                <div style={{
                  width: 44, height: 44, borderRadius: 22,
                  background: `oklch(85% 0.05 ${hue})`, color: `oklch(35% 0.13 ${hue})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, fontSize: 14, flexShrink: 0,
                }}>{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>IPI {a.ipi}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-mute)', marginTop: 6 }}>
                    {wks.length} work{wks.length === 1 ? '' : 's'} · joined {fmt.date(a.joined)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ArtistDetail({ artistId }) {
  const { lookups, works, go } = useStore();
  const a = lookups.artistById[artistId];
  if (!a) return <div style={{ padding: 40 }}>Not found.</div>;
  const wks = works.filter(w => w.artistId === a.id || w.contributors.some(c => c.artistId === a.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 28px', borderBottom: '1px solid var(--border)' }}>
        <a onClick={() => go('artists')} style={{ cursor: 'pointer', fontSize: 12, color: 'var(--fg-mute)' }}>← Artists</a>
        <h1 style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>{a.name}</h1>
        <div style={{ display: 'flex', gap: 18, marginTop: 6, fontSize: 12.5, color: 'var(--fg-mute)' }}>
          <span>IPI <span style={{ fontFamily: 'var(--mono)', color: 'var(--fg)' }}>{a.ipi}</span></span>
          <span>{a.email}</span>
          <span>{a.phone}</span>
          <span>Joined {fmt.date(a.joined)}</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <Panel title={`Works (${wks.length})`}>
          {wks.map(w => (
            <div key={w.id} onClick={() => go('work', w.id)}
              style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mute)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{w.title}</div>
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{w.iswc}</div>
              </div>
              <Badge kind="neutral">{w.genre}</Badge>
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{fmt.date(w.registeredAt)}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

// =================================================================
// EVIDENCE
// =================================================================
function Evidence() {
  const { evidence, lookups, go } = useStore();
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');

  const types = ['all', ...new Set(evidence.map(e => e.type))];
  const filtered = evidence.filter(e =>
    (type === 'all' || e.type === type) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.desc || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Evidence" subtitle={`${evidence.length} files across ${new Set(evidence.map(e => e.workId)).size} works`}
        actions={<Btn variant="primary" icon={<Icon name="upload" size={13} />}>Upload evidence</Btn>}
      />
      <div style={{ display: 'flex', gap: 8, padding: '10px 28px', borderBottom: '1px solid var(--border)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-mute)', borderRadius: 6 }}>
          {types.map(t => (
            <button key={t} onClick={() => setType(t)}
              style={{
                padding: '4px 10px', fontSize: 12, fontFamily: 'inherit', fontWeight: 500,
                background: type === t ? 'var(--bg)' : 'transparent', color: type === t ? 'var(--fg)' : 'var(--fg-mute)',
                border: 'none', borderRadius: 4, cursor: 'pointer', textTransform: 'capitalize',
              }}>{t.replace('_', ' ')}</button>
          ))}
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-mute)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search filename or description…"
            style={{ width: '100%', padding: '6px 10px 6px 30px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--fg)', outline: 'none' }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>File</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Work</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Size</th>
              <th style={thStyle}>Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const w = lookups.workById[e.workId];
              return (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg-mute)'}
                  onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="file" size={13} style={{ color: 'var(--fg-mute)' }} />
                      <span style={{ fontWeight: 500 }}>{e.name}</span>
                    </span>
                  </td>
                  <td style={tdStyle}><Badge kind="neutral">{e.type.replace('_', ' ')}</Badge></td>
                  <td style={tdStyle}><a onClick={() => go('work', w.id)} style={{ color: 'var(--accent)', cursor: 'pointer' }}>{w?.title}</a></td>
                  <td style={{ ...tdStyle, color: 'var(--fg-mute)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.desc}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{e.size}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--fg-mute)' }}>{fmt.date(e.uploadedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =================================================================
// CONTRACTS
// =================================================================
function Contracts() {
  const { contracts, lookups, go } = useStore();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Contracts" subtitle={`${contracts.length} active agreements`}
        actions={<Btn variant="primary" icon={<Icon name="plus" size={13} />}>Add contract</Btn>}
      />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={thStyle}>Party</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Work</th>
              <th style={thStyle}>File</th>
              <th style={thStyle}>Signed</th>
              <th style={thStyle}>Expires</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(c => {
              const w = lookups.workById[c.workId];
              const expired = c.expiresAt && new Date(c.expiresAt) < new Date('2024-05-08');
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{c.party}</td>
                  <td style={tdStyle}><Badge kind="neutral">{c.type}</Badge></td>
                  <td style={tdStyle}><a onClick={() => go('work', w.id)} style={{ color: 'var(--accent)', cursor: 'pointer' }}>{w?.title}</a></td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--fg-mute)' }}>{c.file}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 11.5 }}>{fmt.date(c.signedAt)}</td>
                  <td style={tdStyle}>
                    {c.expiresAt
                      ? expired
                        ? <Badge kind="danger" dot="oklch(58% 0.18 25)">Expired {fmt.date(c.expiresAt)}</Badge>
                        : <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--fg-mute)' }}>{fmt.date(c.expiresAt)}</span>
                      : <span style={{ color: 'var(--fg-mute)' }}>—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =================================================================
// NEW WORK FORM
// =================================================================
function NewWork() {
  const { artists, addWork, pushToast, go, lookups } = useStore();
  const [form, setForm] = useState({
    title: '', iswc: '', genre: 'Indie Rock', creationDate: '', durationSec: 0,
    artistId: artists[0]?.id || '',
    contributors: [{ artistId: artists[0]?.id || '', role: 'composer', split: 100 }],
    lyrics: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setContrib = (i, k, v) => setForm(f => ({ ...f, contributors: f.contributors.map((c, j) => j === i ? { ...c, [k]: v } : c) }));
  const addContrib = () => setForm(f => ({ ...f, contributors: [...f.contributors, { artistId: artists[0]?.id || '', role: 'lyricist', split: 0 }] }));
  const removeContrib = (i) => setForm(f => ({ ...f, contributors: f.contributors.filter((_, j) => j !== i) }));

  const totalSplit = form.contributors.reduce((s, c) => s + Number(c.split || 0), 0);
  const splitOk = totalSplit === 100;
  const titleOk = form.title.trim().length > 1;
  const iswcOk  = !form.iswc || /^T-?\d{3}\.?\d{3}\.?\d{3}-?\d$/.test(form.iswc.replace(/\s/g, ''));

  const submit = () => {
    if (!titleOk || !splitOk || !iswcOk) return;
    addWork({ ...form, registeredAt: new Date().toISOString().slice(0, 10) });
    pushToast(`"${form.title}" registered.`);
    go('works');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Register new work" subtitle="Add a song to the catalog. ISWC optional but strongly recommended for matching." />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 80px' }}>
        <div style={{ maxWidth: 720 }}>

          <FormSection title="Identity">
            <Field label="Title" required>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Madrugada en Av. Forest" style={inputStyle} />
            </Field>
            <Row>
              <Field label="ISWC" hint={!iswcOk ? 'Format: T-040.221.118-2' : null}>
                <input value={form.iswc} onChange={e => set('iswc', e.target.value)} placeholder="T-040.221.118-2" style={{ ...inputStyle, fontFamily: 'var(--mono)' }} />
              </Field>
              <Field label="Genre">
                <select value={form.genre} onChange={e => set('genre', e.target.value)} style={inputStyle}>
                  {['Indie Rock', 'Folk', 'Cumbia', 'Jazz', 'Folklore', 'Tango', 'Pop', 'Rock Nacional', 'Other'].map(g => <option key={g}>{g}</option>)}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="Creation date">
                <input type="date" value={form.creationDate} onChange={e => set('creationDate', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Duration (sec)">
                <input type="number" value={form.durationSec} onChange={e => set('durationSec', Number(e.target.value))} style={{ ...inputStyle, fontFamily: 'var(--mono)' }} />
              </Field>
            </Row>
          </FormSection>

          <FormSection title="Splits" sub={`Must sum to 100% (currently ${totalSplit}%)`} status={splitOk ? 'ok' : 'warn'}>
            {form.contributors.map((c, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 80px 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <select value={c.artistId} onChange={e => setContrib(i, 'artistId', e.target.value)} style={inputStyle}>
                  {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select value={c.role} onChange={e => setContrib(i, 'role', e.target.value)} style={inputStyle}>
                  {['composer', 'lyricist', 'arranger', 'producer'].map(r => <option key={r}>{r}</option>)}
                </select>
                <input type="number" value={c.split} onChange={e => setContrib(i, 'split', Number(e.target.value))} style={{ ...inputStyle, fontFamily: 'var(--mono)', textAlign: 'right' }} />
                <Btn variant="ghost" size="sm" disabled={form.contributors.length === 1} onClick={() => removeContrib(i)}><Icon name="x" size={12} /></Btn>
              </div>
            ))}
            <Btn variant="secondary" size="sm" icon={<Icon name="plus" size={11} />} onClick={addContrib}>Add contributor</Btn>
            {!splitOk && (
              <div style={{ marginTop: 10, padding: '6px 10px', background: 'oklch(96% 0.04 75)', border: '1px solid oklch(85% 0.06 65)', borderRadius: 5, fontSize: 12, color: 'oklch(40% 0.13 55)' }}>
                Splits sum to <b>{totalSplit}%</b>. Adjust to 100 before saving.
              </div>
            )}
          </FormSection>

          <FormSection title="Lyrics (optional)">
            <textarea value={form.lyrics} onChange={e => set('lyrics', e.target.value)} placeholder="Paste lyrics here. Stored as evidence."
              style={{ ...inputStyle, minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }} />
          </FormSection>

          <FormSection title="Initial evidence" sub="Drag files now or upload later from the Evidence tab.">
            <div style={{
              border: '2px dashed var(--border)', borderRadius: 8, padding: 24, textAlign: 'center',
              background: 'var(--bg-mute)', color: 'var(--fg-mute)', fontSize: 13,
            }}>
              <Icon name="upload" size={18} />
              <div style={{ marginTop: 6 }}>Drop scores, audio, mails, DAW projects…</div>
            </div>
          </FormSection>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <Btn variant="ghost" onClick={() => go('works')}>Cancel</Btn>
            <Btn variant="secondary">Save as draft</Btn>
            <Btn variant="primary" disabled={!titleOk || !splitOk || !iswcOk} onClick={submit}>Register work</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, sub, status, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{title}</h3>
        {sub && <span style={{ fontSize: 12, color: status === 'warn' ? 'oklch(45% 0.13 55)' : 'var(--fg-mute)' }}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}
function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: 12, flex: 1, minWidth: 0 }}>
      <label style={{ display: 'block', fontSize: 11.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--fg-mute)', marginBottom: 5 }}>
        {label}{required && <span style={{ color: 'oklch(58% 0.18 25)' }}> *</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'oklch(45% 0.13 55)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
function Row({ children }) {
  return <div style={{ display: 'flex', gap: 12 }}>{children}</div>;
}
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '7px 10px', fontSize: 13, fontFamily: 'inherit',
  border: '1px solid var(--border)', borderRadius: 5,
  background: 'var(--bg)', color: 'var(--fg)', outline: 'none',
};

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ padding: '10px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
      <div style={{ position: 'relative', maxWidth: 400 }}>
        <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-mute)' }} />
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', padding: '6px 10px 6px 30px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--fg)', outline: 'none', boxSizing: 'border-box' }} />
      </div>
    </div>
  );
}

Object.assign(window, {
  ActionsInbox, Works, WorkDetail, Artists, ArtistDetail, Evidence, Contracts, NewWork,
});

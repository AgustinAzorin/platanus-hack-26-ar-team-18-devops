// Inbox (claim list) + Claim Detail (centerpiece — email thread with SADAIC)

function Inbox({ filter = null }) {
  const { claims, lookups, go, pushToast, updateClaim, appendThread, logBot } = useStore();
  const [statusFilter, setStatusFilter] = useState(filter || 'all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'matchedAt', dir: 'desc' });
  const [selected, setSelected] = useState(new Set());
  const [pageSize, setPageSize] = useState(window.tweakState?.list_size || 20);

  // Sync with tweaks
  useEffect(() => {
    const handler = () => setPageSize(window.tweakState?.list_size || 20);
    window.addEventListener('tweak-change', handler);
    return () => window.removeEventListener('tweak-change', handler);
  }, []);

  const filtered = useMemo(() => {
    let out = claims;
    if (statusFilter !== 'all') out = out.filter(c => c.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.cisacTitle.toLowerCase().includes(q) ||
        c.performer.toLowerCase().includes(q) ||
        (c.workId && lookups.workById[c.workId]?.title.toLowerCase().includes(q))
      );
    }
    out = [...out].sort((a, b) => {
      const av = a[sort.key]; const bv = b[sort.key];
      if (av == null) return 1; if (bv == null) return -1;
      const r = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === 'asc' ? r : -r;
    });
    return out;
  }, [claims, statusFilter, search, sort, lookups, pageSize]);

  const limited = filtered.slice(0, pageSize);

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'detected', label: 'Detected' },
    { key: 'submitted', label: 'Sent' },
    { key: 'awaiting_evidence', label: 'Action required' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const toggleSelect = (id) => setSelected(s => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const toggleAll = () => setSelected(s => s.size === limited.length ? new Set() : new Set(limited.map(c => c.id)));

  const sendBulk = () => {
    let n = 0;
    selected.forEach(id => {
      const c = claims.find(x => x.id === id);
      if (c && c.status === 'detected') {
        updateClaim(id, { status: 'submitted' });
        appendThread(id, {
          dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar',
          subject: `Reclamo — ${c.id}`,
          sentAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
          body: `Reclamamos la obra ${c.cisacTitle} — match catálogo: ${c.workId || 'manual'}.`,
          attachments: [],
        });
        n++;
      }
    });
    if (n > 0) {
      logBot({ kind: 'send', text: `Bulk-sent ${n} claims to SADAIC` });
      pushToast(`${n} claims dispatched to SADAIC.`);
    } else {
      pushToast('No "Detected" claims in selection.');
    }
    setSelected(new Set());
  };

  const setSortKey = (k) => setSort(s => ({ key: k, dir: s.key === k && s.dir === 'desc' ? 'asc' : 'desc' }));
  const SortIcon = ({ k }) => sort.key === k ? <Icon name={sort.dir === 'asc' ? 'arrowUp' : 'arrowDown'} size={11} style={{ color: 'var(--fg)' }} /> : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Claims"
        subtitle="All works detected by the agent in SADAIC unidentified-rights reports"
        actions={<>
          <Btn variant="secondary" icon={<Icon name="filter" size={13} />}>Saved views</Btn>
          <Btn variant="secondary" icon={<Icon name="download" size={13} />}>Export</Btn>
          <Btn variant="primary" icon={<Icon name="upload" size={13} />} onClick={() => go('upload')}>Ingest report</Btn>
        </>}
      />

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-mute)', borderRadius: 6 }}>
          {FILTERS.map(f => {
            const cnt = f.key === 'all' ? claims.length : claims.filter(c => c.status === f.key).length;
            const active = statusFilter === f.key;
            return (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                style={{
                  padding: '4px 10px', fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
                  background: active ? 'var(--bg)' : 'transparent',
                  color: active ? 'var(--fg)' : 'var(--fg-mute)',
                  border: 'none', borderRadius: 4, cursor: 'pointer',
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {f.label}
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, opacity: 0.7 }}>{cnt}</span>
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-mute)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, performer, ID…"
            style={{
              width: '100%', padding: '6px 10px 6px 30px', fontSize: 13,
              border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'inherit',
              background: 'var(--bg)', color: 'var(--fg)', outline: 'none',
            }} />
        </div>

        {selected.size > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 10px', background: 'oklch(96% 0.02 250)', borderRadius: 6, fontSize: 12 }}>
            <span style={{ color: 'var(--fg)' }}>{selected.size} selected</span>
            <Btn size="sm" variant="primary" icon={<Icon name="mail" size={11} />} onClick={sendBulk}>Send to SADAIC</Btn>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ ...thStyle, width: 30, paddingRight: 0 }}>
                <input type="checkbox" checked={selected.size === limited.length && limited.length > 0} onChange={toggleAll} style={{ cursor: 'pointer' }} />
              </th>
              <Th label="ID" k="id" sort={sort} onClick={setSortKey} />
              <Th label="Performer · Title (as received)" k="cisacTitle" sort={sort} onClick={setSortKey} />
              <Th label="Matched work" k="workId" sort={sort} onClick={setSortKey} />
              <Th label="Confidence" k="confidence" sort={sort} onClick={setSortKey} align="left" />
              <Th label="Amount" k="amount" sort={sort} onClick={setSortKey} align="right" />
              <Th label="Usage" k="usage" sort={sort} onClick={setSortKey} />
              <Th label="Date" k="executionDate" sort={sort} onClick={setSortKey} />
              <Th label="Status" k="status" sort={sort} onClick={setSortKey} />
            </tr>
          </thead>
          <tbody>
            {limited.map(c => {
              const w = c.workId ? lookups.workById[c.workId] : null;
              const a = w ? lookups.artistById[w.artistId] : null;
              const isSel = selected.has(c.id);
              return (
                <tr key={c.id}
                  onClick={() => go('claim', c.id)}
                  style={{
                    cursor: 'pointer', borderBottom: '1px solid var(--border)',
                    background: isSel ? 'oklch(98% 0.01 250)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg-mute)'; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
                  <td style={{ ...tdStyle, paddingRight: 0 }} onClick={e => { e.stopPropagation(); toggleSelect(c.id); }}>
                    <input type="checkbox" checked={isSel} onChange={() => {}} style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--fg-mute)', whiteSpace: 'nowrap' }}>{c.id.slice(-6)}</td>
                  <td style={{ ...tdStyle, maxWidth: 260 }}>
                    <div style={{ fontWeight: 500, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.cisacTitle}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.performer}</div>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--fg)' }}>
                    {w ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{w.title}</div>
                        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{w.iswc}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--fg-mute)', fontStyle: 'italic' }}>no match</span>
                    )}
                  </td>
                  <td style={tdStyle}><ConfidenceBar value={c.confidence} /></td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', textAlign: 'right' }}>{fmt.money(c.amount).replace('AR$ ', '$')}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: 'var(--fg-mute)' }}>{c.usage}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--fg-mute)', whiteSpace: 'nowrap' }}>{fmt.date(c.executionDate)}</td>
                  <td style={tdStyle}><StatusBadge status={c.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length > pageSize && (
          <div style={{ padding: '14px 28px', fontSize: 12, color: 'var(--fg-mute)', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
            Showing {pageSize} of {filtered.length} · adjust list size in Tweaks panel
          </div>
        )}
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--fg-mute)' }}>
            No claims match your filter.
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ label, k, sort, onClick, align = 'left' }) {
  const isSort = sort.key === k;
  return (
    <th style={{ ...thStyle, textAlign: align, cursor: 'pointer', userSelect: 'none' }} onClick={() => onClick(k)}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {isSort && <Icon name={sort.dir === 'asc' ? 'arrowUp' : 'arrowDown'} size={11} />}
      </span>
    </th>
  );
}

// =================================================================
// CLAIM DETAIL
// =================================================================
function ClaimDetail({ claimId }) {
  const { claims, threads, lookups, go, updateClaim, appendThread, addEvidence, pushToast, logBot } = useStore();
  const claim = claims.find(c => c.id === claimId);
  if (!claim) {
    return <div style={{ padding: 40 }}>Claim not found. <a onClick={() => go('inbox')} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Back to inbox →</a></div>;
  }

  const work    = claim.workId ? lookups.workById[claim.workId] : null;
  const artist  = work ? lookups.artistById[work.artistId] : null;
  const evList  = work ? lookups.evidenceByWork[work.id] : [];
  const cList   = work ? lookups.contractsByWork[work.id] : [];
  const recList = work ? lookups.recordingsByWork[work.id] : [];
  const thread  = threads[claim.id] || [];
  const m       = STATUS_META[claim.status];

  const [composeOpen, setComposeOpen] = useState(false);
  const [draftBody, setDraftBody] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  // ---- Actions ----
  const sendInitialClaim = () => {
    const body = draftBody || `Estimados,\n\nAdjuntamos reclamo de la obra "${work?.title}" (ISWC ${work?.iswc}) registrada en nuestro repertorio. Ejecutada por ${claim.performer} en ${claim.venue} (${fmt.date(claim.executionDate)}).\n\nAdjuntamos contrato editorial, partitura y master.\n\nQuedamos a la espera.`;
    appendThread(claim.id, {
      dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar',
      subject: `Reclamo — ${claim.id} / ${work?.title || claim.cisacTitle}`,
      sentAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      body, attachments: cList.slice(0, 1).map(c => c.file).concat(evList.slice(0, 2).map(e => e.name)),
    });
    updateClaim(claim.id, { status: 'submitted' });
    logBot({ kind: 'send', text: `Sent claim ${claim.id} → SADAIC` });
    pushToast(`Claim ${claim.id} dispatched to SADAIC.`);
    setComposeOpen(false); setDraftBody('');
  };

  const sendEvidence = (evidenceItem) => {
    appendThread(claim.id, {
      dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar',
      subject: `RE: Reclamo — ${claim.id} (evidence attached)`,
      sentAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      body: `Estimados,\n\nAdjuntamos la documentación solicitada: ${evidenceItem.name}.\n\nQuedamos a la espera de la confirmación de identificación.`,
      attachments: [evidenceItem.name],
    });
    updateClaim(claim.id, { status: 'submitted' });
    logBot({ kind: 'send', text: `Replied with evidence on ${claim.id}` });
    pushToast('Evidence dispatched. Agent will follow up.');
  };

  const markResolved = () => {
    updateClaim(claim.id, { status: 'resolved', resolvedAt: new Date().toISOString() });
    appendThread(claim.id, {
      dir: 'inbound', channel: 'email', from: 'reclamos@sadaic.org.ar', to: 'bot@calma.ar',
      subject: `RE: Reclamo — ${claim.id}`,
      sentAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      body: `Confirmamos identificación. Liquidación incluida en próximo período.`, attachments: [],
    });
    pushToast(`Claim resolved. ${fmt.money(claim.amount)} queued for next payout.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 28px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-mute)', marginBottom: 4 }}>
            <a onClick={() => go('inbox')} style={{ cursor: 'pointer' }}>← Claims</a>
            <span>·</span>
            <span style={{ fontFamily: 'var(--mono)' }}>{claim.id}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.3, color: 'var(--fg)' }}>
              {work ? work.title : claim.cisacTitle}
            </h1>
            <StatusBadge status={claim.status} />
            <ConfidenceBar value={claim.confidence} w={80} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-mute)', marginTop: 4 }}>
            Reported as <span style={{ color: 'var(--fg)' }}>"{claim.cisacTitle}"</span> · {claim.performer} · {claim.venue}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {claim.status === 'detected' && (
            <Btn variant="primary" icon={<Icon name="mail" size={13} />} onClick={() => setComposeOpen(true)}>Send to SADAIC</Btn>
          )}
          {claim.status === 'awaiting_evidence' && (
            <Btn variant="primary" icon={<Icon name="upload" size={13} />} onClick={() => setUploadOpen(true)}>Upload requested evidence</Btn>
          )}
          {claim.status === 'submitted' && (
            <Btn variant="secondary" icon={<Icon name="check" size={13} />} onClick={markResolved}>Mark resolved</Btn>
          )}
          <Btn variant="ghost" icon={<Icon name="x" size={14} />} onClick={() => go('inbox')}>Close</Btn>
        </div>
      </div>

      {/* Body — two columns */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 360px' }}>
        {/* LEFT: thread + matching */}
        <div style={{ overflowY: 'auto', padding: '20px 28px 60px', borderRight: '1px solid var(--border)' }}>
          {/* AI match summary */}
          <div style={{
            border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 18,
            background: 'linear-gradient(180deg, oklch(98% 0.01 250), var(--bg))',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name="sparkle" size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fg-mute)' }}>Agent match</span>
              <span style={{ fontSize: 11, color: 'var(--fg-mute)' }}>· {fmt.time(claim.matchedAt)}</span>
            </div>
            {work ? (
              <>
                <div style={{ fontSize: 14, color: 'var(--fg)', lineHeight: 1.55 }}>
                  Linked to <a onClick={() => go('work', work.id)} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>{work.title}</a> (ISWC <span style={{ fontFamily: 'var(--mono)' }}>{work.iswc}</span>) by <span style={{ fontWeight: 500, color: 'var(--fg)' }}>{artist?.name}</span>.
                </div>
                <ul style={{ margin: '10px 0 0', padding: '0 0 0 16px', fontSize: 12.5, color: 'var(--fg-mute)', lineHeight: 1.7 }}>
                  {claim.matchSignals.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--fg-mute)', lineHeight: 1.5 }}>
                No catalog match. Agent flagged this row as <b>{claim.status === 'rejected' ? 'out-of-roster' : 'low confidence'}</b>.
              </div>
            )}
          </div>

          {/* Awaiting evidence callout */}
          {claim.status === 'awaiting_evidence' && claim.requestedEvidence && (
            <div style={{
              border: '1px solid oklch(85% 0.06 65)', borderRadius: 8, padding: 14, marginBottom: 18,
              background: 'oklch(98% 0.02 75)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="flag" size={14} style={{ color: 'oklch(50% 0.16 55)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'oklch(35% 0.16 55)' }}>SADAIC requested additional evidence</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg)', marginBottom: 6 }}>{claim.requestedEvidence.label}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>Type: <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{claim.requestedEvidence.type}</code></span>
                <span>·</span>
                <span>Due by <span style={{ color: 'var(--fg)' }}>{fmt.date(claim.requestedEvidence.dueBy)}</span></span>
              </div>
              <div style={{ marginTop: 12 }}>
                <Btn variant="primary" size="sm" icon={<Icon name="upload" size={11} />} onClick={() => setUploadOpen(true)}>Upload &amp; let agent reply</Btn>
              </div>
            </div>
          )}

          {/* Thread */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--fg-mute)', marginBottom: 12 }}>Communication thread · {thread.length} {thread.length === 1 ? 'message' : 'messages'}</div>

            {thread.length === 0 && (
              <div style={{ padding: 40, border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center', color: 'var(--fg-mute)' }}>
                No messages yet. {claim.status === 'detected' ? 'Send the initial claim to start the thread.' : ''}
              </div>
            )}

            {thread.map((msg, i) => <ThreadMessage key={i} msg={msg} claim={claim} />)}
          </div>

          {/* Compose drawer */}
          {composeOpen && (
            <ComposeDraft
              claim={claim} work={work} artist={artist}
              evidence={evList} contracts={cList}
              draftBody={draftBody} setDraftBody={setDraftBody}
              onSend={sendInitialClaim} onCancel={() => setComposeOpen(false)}
            />
          )}

          {uploadOpen && (
            <RequestedEvidenceUpload
              claim={claim} work={work}
              onClose={() => setUploadOpen(false)}
              onUploaded={(name, type) => {
                if (work) addEvidence({ workId: work.id, type, name, size: '2.4 MB', uploadedAt: new Date().toISOString().slice(0, 10), desc: 'Uploaded to satisfy SADAIC request' });
                sendEvidence({ name });
                setUploadOpen(false);
              }}
            />
          )}
        </div>

        {/* RIGHT: metadata sidebar */}
        <div style={{ overflowY: 'auto', padding: '20px 22px 60px', background: 'var(--sidebar)' }}>
          <SideSection title="Reclaim details">
            <KV label="Claim ID"   value={<span style={{ fontFamily: 'var(--mono)' }}>{claim.id}</span>} />
            <KV label="Source"     value="SADAIC · unidentified rights report" />
            <KV label="Received"   value={fmt.date(claim.receivedAt)} />
            <KV label="Period"     value={claim.period} />
            <KV label="Execution"  value={fmt.date(claim.executionDate)} />
            <KV label="Deadline"   value={fmt.date(claim.deadline)} />
            <KV label="Reason"     value={claim.reason} mono={false} />
            <KV label="Amount"     value={<span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{fmt.money(claim.amount)}</span>} />
          </SideSection>

          {work && (
            <SideSection title="Matched work">
              <KV label="Title"      value={<a onClick={() => go('work', work.id)} style={{ color: 'var(--accent)', cursor: 'pointer' }}>{work.title}</a>} />
              <KV label="ISWC"       value={<span style={{ fontFamily: 'var(--mono)' }}>{work.iswc}</span>} />
              <KV label="Artist"     value={artist?.name} />
              <KV label="IPI"        value={<span style={{ fontFamily: 'var(--mono)' }}>{artist?.ipi}</span>} />
              <KV label="Genre"      value={work.genre} />
              <KV label="Created"    value={fmt.date(work.creationDate)} />
              <KV label="Duration"   value={fmt.duration(work.durationSec)} />
            </SideSection>
          )}

          {work && work.contributors && (
            <SideSection title="Splits">
              {work.contributors.map((cb, i) => {
                const a = lookups.artistById[cb.artistId];
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < work.contributors.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 12.5, color: 'var(--fg)' }}>{a?.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--fg-mute)', textTransform: 'uppercase', fontFamily: 'var(--mono)', letterSpacing: 0.4 }}>{cb.role}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 13, color: 'var(--fg)' }}>{cb.split}%</div>
                  </div>
                );
              })}
            </SideSection>
          )}

          {work && (
            <SideSection title={`Evidence on file (${evList.length})`}>
              {evList.length === 0 && <div style={{ fontSize: 12, color: 'var(--fg-mute)' }}>None.</div>}
              {evList.slice(0, 5).map(e => (
                <div key={e.id} style={{ display: 'flex', gap: 8, padding: '6px 0', alignItems: 'flex-start', borderBottom: '1px solid var(--border)' }}>
                  <Icon name="file" size={13} style={{ color: 'var(--fg-mute)', marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{e.type} · {e.size}</div>
                  </div>
                </div>
              ))}
            </SideSection>
          )}

          {work && cList.length > 0 && (
            <SideSection title={`Contracts (${cList.length})`}>
              {cList.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8, padding: '6px 0', alignItems: 'flex-start', borderBottom: '1px solid var(--border)' }}>
                  <Icon name="file" size={13} style={{ color: 'var(--fg-mute)', marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--fg)' }}>{c.party}</div>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>{c.type} · signed {fmt.date(c.signedAt)}</div>
                  </div>
                </div>
              ))}
            </SideSection>
          )}
        </div>
      </div>
    </div>
  );
}

function ThreadMessage({ msg, claim }) {
  const isInbound = msg.dir === 'inbound';
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 8, marginBottom: 12,
      background: 'var(--bg)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: isInbound ? 'oklch(98% 0.01 75)' : 'oklch(98% 0.01 250)',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 12,
          background: isInbound ? 'oklch(85% 0.06 65)' : 'linear-gradient(135deg, var(--fg), oklch(35% 0.13 250))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isInbound ? 'oklch(35% 0.16 55)' : '#fff',
          fontSize: 10, fontWeight: 600, fontFamily: 'var(--mono)',
        }}>{isInbound ? 'SA' : '◐'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500 }}>{isInbound ? 'SADAIC — Reclamos' : 'Agent (Calma Bot)'}</span>
            <Badge kind={isInbound ? 'warn' : 'accent'} style={{ padding: '1px 6px', fontSize: 10 }}>
              {isInbound ? 'inbound' : 'outbound · auto'}
            </Badge>
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-mute)', fontFamily: 'var(--mono)' }}>{msg.from} → {msg.to}</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-mute)', fontFamily: 'var(--mono)' }}>{msg.sentAt}</div>
      </div>

      <div style={{ padding: '14px 14px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', marginBottom: 8 }}>{msg.subject}</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--fg)', whiteSpace: 'pre-wrap' }}>{msg.body}</div>
        {msg.attachments && msg.attachments.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {msg.attachments.map((a, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 8px', borderRadius: 5,
                background: 'var(--bg-mute)', border: '1px solid var(--border)',
                fontSize: 11.5, color: 'var(--fg)',
              }}>
                <Icon name="paperclip" size={11} style={{ color: 'var(--fg-mute)' }} />
                {a}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ComposeDraft({ claim, work, artist, evidence, contracts, draftBody, setDraftBody, onSend, onCancel }) {
  const [thinking, setThinking] = useState(true);
  const defaultBody = work
    ? `Estimados,\n\nReclamamos los derechos de la obra "${work.title}" (ISWC ${work.iswc}) registrada en nuestro repertorio bajo Calma Ediciones SRL, autoría de ${artist?.name}.\n\nLa misma fue ejecutada por ${claim.performer} en ${claim.venue} el ${fmt.date(claim.executionDate)} (período ${claim.period}). Adjuntamos documentación respaldatoria: contrato editorial vigente, partitura registrada y master.\n\nQuedamos a la espera de la confirmación para incluir en próxima liquidación.\n\nSaludos cordiales,\nAgente automático — Calma Ediciones SRL`
    : '';

  useEffect(() => {
    setThinking(true);
    setDraftBody('');
    let i = 0;
    const id = setInterval(() => {
      i += Math.max(1, Math.floor(defaultBody.length / 80));
      if (i >= defaultBody.length) { clearInterval(id); setDraftBody(defaultBody); setThinking(false); }
      else setDraftBody(defaultBody.slice(0, i));
    }, 30);
    return () => clearInterval(id);
  }, []);

  const attachments = [...contracts.slice(0, 1).map(c => c.file), ...evidence.slice(0, 2).map(e => e.name)];

  return (
    <div style={{
      border: '1px solid var(--accent)', borderRadius: 8, background: 'var(--bg)',
      boxShadow: '0 4px 14px oklch(80% 0.05 250 / 0.3)',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="sparkle" size={14} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>Drafted by agent</span>
        {thinking && (
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="dot-pulse" /> generating
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>To: reclamos@sadaic.org.ar</span>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Reclamo — {claim.id} / {work?.title || claim.cisacTitle}</div>
        <textarea value={draftBody} onChange={e => setDraftBody(e.target.value)}
          style={{
            width: '100%', minHeight: 220, fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6,
            border: '1px solid var(--border)', borderRadius: 6, padding: 12,
            background: 'var(--bg)', color: 'var(--fg)', resize: 'vertical', outline: 'none',
            boxSizing: 'border-box',
          }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {attachments.map((a, i) => (
            <div key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', borderRadius: 5,
              background: 'var(--bg-mute)', border: '1px solid var(--border)',
              fontSize: 11.5,
            }}>
              <Icon name="paperclip" size={11} style={{ color: 'var(--fg-mute)' }} />
              {a}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-mute)' }}>
        <span style={{ fontSize: 11, color: 'var(--fg-mute)' }}>Will auto-attach 1 contract + {evidence.slice(0, 2).length} evidence files from catalog</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={onCancel}>Cancel</Btn>
          <Btn variant="primary" size="sm" icon={<Icon name="mail" size={11} />} onClick={onSend} disabled={thinking}>Send to SADAIC</Btn>
        </div>
      </div>
    </div>
  );
}

function RequestedEvidenceUpload({ claim, work, onClose, onUploaded }) {
  const [step, setStep] = useState('drop'); // drop | uploading | analyzing | done
  const [filename, setFilename] = useState('');

  const startUpload = (name) => {
    setFilename(name);
    setStep('uploading');
    setTimeout(() => setStep('analyzing'), 1200);
    setTimeout(() => setStep('done'), 2600);
  };
  const reqType = claim.requestedEvidence?.type || 'evidence';

  return (
    <div style={{
      border: '1px solid var(--accent)', borderRadius: 8, background: 'var(--bg)',
      boxShadow: '0 4px 14px oklch(80% 0.05 250 / 0.3)', marginTop: 16,
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="upload" size={14} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>Upload evidence — {claim.requestedEvidence?.label}</span>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
      </div>
      <div style={{ padding: 18 }}>
        {step === 'drop' && (
          <>
            <div style={{
              border: '2px dashed var(--border)', borderRadius: 8, padding: 28, textAlign: 'center',
              background: 'var(--bg-mute)',
            }}>
              <Icon name="upload" size={22} style={{ color: 'var(--fg-mute)' }} />
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 8, color: 'var(--fg)' }}>Drop file here or pick from disk</div>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 4 }}>PDF, WAV, MP3, JPG · up to 50 MB</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <Btn size="sm" variant="primary" onClick={() => startUpload(reqType + '-' + claim.id.slice(-6) + '.pdf')}>Select file</Btn>
                <Btn size="sm" variant="secondary" onClick={() => startUpload('split-agreement-signed.pdf')}>Use sample</Btn>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 12, lineHeight: 1.5 }}>
              Once uploaded, the agent will <b style={{ color: 'var(--fg)' }}>auto-reply to SADAIC's last message</b> attaching this file. You don't need to draft anything.
            </div>
          </>
        )}
        {step !== 'drop' && (
          <UploadProgress step={step} filename={filename} onDone={() => onUploaded(filename, reqType)} />
        )}
      </div>
    </div>
  );
}

function UploadProgress({ step, filename, onDone }) {
  useEffect(() => {
    if (step === 'done') {
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
  }, [step]);

  const stages = [
    { key: 'uploading', label: 'Uploading file', icon: 'upload' },
    { key: 'analyzing', label: 'Agent analyzing & drafting reply', icon: 'sparkle' },
    { key: 'done',      label: 'Replying to SADAIC', icon: 'mail' },
  ];
  const idx = stages.findIndex(s => s.key === step);

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>{filename}</div>
      <div>
        {stages.map((s, i) => {
          const done = i < idx;
          const cur  = i === idx;
          return (
            <div key={s.key} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              borderBottom: i < stages.length - 1 ? '1px solid var(--border)' : 'none',
              opacity: i > idx ? 0.4 : 1,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11,
                background: done ? 'oklch(58% 0.13 150)' : cur ? 'var(--accent)' : 'var(--bg-mute)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done ? <Icon name="check" size={11} /> : cur ? <span className="dot-pulse" /> : <Icon name={s.icon} size={11} />}
              </div>
              <span style={{ fontSize: 13, color: 'var(--fg)', flex: 1 }}>{s.label}</span>
              {done && <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SideSection({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.5,
        color: 'var(--fg-mute)', marginBottom: 8,
      }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 10, padding: '5px 0', alignItems: 'baseline' }}>
      <div style={{ fontSize: 11, color: 'var(--fg-mute)' }}>{label}</div>
      <div style={{ fontSize: 12.5, color: 'var(--fg)', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

window.Inbox = Inbox;
window.ClaimDetail = ClaimDetail;

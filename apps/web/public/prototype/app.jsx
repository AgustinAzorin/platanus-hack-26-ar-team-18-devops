// Main App: routes by current page, mounts shell + tweaks panel.

function App() {
  const { route } = useStore();
  const { page, id } = route;

  let view;
  switch (page) {
    case 'dashboard': view = <Dashboard />; break;
    case 'inbox':     view = <Inbox />; break;
    case 'actions':   view = <ActionsInbox />; break;
    case 'upload':    view = <Upload />; break;
    case 'claim':     view = <ClaimDetail claimId={id} />; break;
    case 'works':     view = <Works />; break;
    case 'work':      view = <WorkDetail workId={id} />; break;
    case 'artists':   view = <Artists />; break;
    case 'artist':    view = <ArtistDetail artistId={id} />; break;
    case 'evidence':  view = <Evidence />; break;
    case 'contracts': view = <Contracts />; break;
    case 'newwork':   view = <NewWork />; break;
    default:          view = <Dashboard />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }} data-screen-label={page}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />
        <div style={{ flex: 1, overflow: 'hidden' }}>{view}</div>
      </div>
      <Toasts />
      <TweaksRoot />
    </div>
  );
}

// ====== TWEAKS ======
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "list_size": 20,
  "accent_hue": 250,
  "compact": false
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = [
  { value: 250, label: 'Slate blue', swatch: 'oklch(55% 0.13 250)' },
  { value: 150, label: 'Forest',     swatch: 'oklch(55% 0.13 150)' },
  { value: 25,  label: 'Crimson',    swatch: 'oklch(55% 0.13 25)'  },
  { value: 75,  label: 'Amber',      swatch: 'oklch(55% 0.13 75)'  },
];

function TweaksRoot() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', `oklch(55% 0.13 ${t.accent_hue})`);
    document.documentElement.style.setProperty('--accent-soft', `oklch(96% 0.02 ${t.accent_hue})`);
  }, [t.accent_hue]);

  useEffect(() => {
    document.documentElement.style.setProperty('--density', t.compact ? '0.85' : '1');
  }, [t.compact]);

  useEffect(() => {
    window.tweakState = { list_size: t.list_size };
    window.dispatchEvent(new Event('tweak-change'));
  }, [t.list_size]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="List density">
        <TweakSelect
          label="Claims per page"
          value={t.list_size}
          options={[
            { value: 5,   label: '5 (compact)' },
            { value: 20,  label: '20 (default)' },
            { value: 100, label: '100 (full)' },
          ]}
          onChange={(v) => setTweak('list_size', Number(v))}
        />
        <TweakToggle label="Compact rows" value={t.compact} onChange={(v) => setTweak('compact', v)} />
      </TweakSection>
      <TweakSection label="Accent">
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {ACCENT_OPTIONS.map(o => (
            <button key={o.value} type="button"
              onClick={() => setTweak('accent_hue', o.value)}
              title={o.label}
              style={{
                flex: 1, height: 32, borderRadius: 8,
                border: t.accent_hue === o.value ? '2px solid #1B1A17' : '1.5px solid rgba(0,0,0,.12)',
                background: o.swatch, cursor: 'pointer', transition: 'all .12s', outline: 'none',
              }}
            />
          ))}
        </div>
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StoreProvider><App /></StoreProvider>
);

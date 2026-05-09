// Seed data for the Indeterminate Rights / SADAIC bot prototype.
// Models a small music publisher's catalog, plus claims the AI is working on.

const SEED = (() => {
  // -----------------------------
  // Artists (publisher's roster)
  // -----------------------------
  const artists = [
    { id: 'a-001', name: 'Mariana Quintero',     ipi: '00455123887', email: 'mariana@calma.ar',   phone: '+54 9 11 5123 8821', joined: '2019-04-12' },
    { id: 'a-002', name: 'Tomás Belarde',        ipi: '00781204451', email: 'tomas@calma.ar',     phone: '+54 9 11 4188 2014', joined: '2020-09-03' },
    { id: 'a-003', name: 'Los Reyes del Barrio', ipi: '00229834612', email: 'mgmt@reyesb.com',    phone: '+54 9 11 6601 7720', joined: '2018-01-22' },
    { id: 'a-004', name: 'Cuarteto Independiente', ipi: '00903441120', email: 'cuarteto@cind.ar', phone: '+54 9 351 244 8870', joined: '2021-07-18' },
    { id: 'a-005', name: 'Solista NN (Aire del Sur)', ipi: '00112558044', email: 'aire@delsur.ar',phone: '+54 9 387 401 2299', joined: '2022-03-14' },
    { id: 'a-006', name: 'Bruno Pasqualini',     ipi: '00667812330', email: 'bruno@pasq.ar',      phone: '+54 9 11 5044 1130', joined: '2017-11-08' },
    { id: 'a-007', name: 'Lila Ferreyra',        ipi: '00554120998', email: 'lila@ferreyra.ar',   phone: '+54 9 11 6712 0044', joined: '2023-02-19' },
    { id: 'a-008', name: 'Banda Local NN',       ipi: '00892017765', email: 'contacto@blnn.ar',   phone: '+54 9 351 800 1102', joined: '2020-05-30' },
  ];

  // -----------------------------
  // Works (registered catalog)
  // -----------------------------
  const works = [
    { id: 'w-1001', artistId: 'a-001', title: 'Madrugada en Av. Forest', iswc: 'T-040.221.118-2', genre: 'Indie Rock',     creationDate: '2022-08-14', registeredAt: '2022-09-03', durationSec: 224,
      contributors: [{ artistId: 'a-001', role: 'composer', split: 70 }, { artistId: 'a-006', role: 'lyricist', split: 30 }] },
    { id: 'w-1002', artistId: 'a-001', title: 'Hotel Vacío',             iswc: 'T-040.998.213-0', genre: 'Indie Rock',     creationDate: '2023-01-22', registeredAt: '2023-02-10', durationSec: 198,
      contributors: [{ artistId: 'a-001', role: 'composer', split: 100 }] },
    { id: 'w-1003', artistId: 'a-002', title: 'Carta a la Hermana',      iswc: 'T-041.554.001-9', genre: 'Folk',           creationDate: '2021-11-02', registeredAt: '2021-12-15', durationSec: 247,
      contributors: [{ artistId: 'a-002', role: 'composer', split: 100 }] },
    { id: 'w-1004', artistId: 'a-003', title: 'Cumbia del Trébol',       iswc: 'T-042.119.876-4', genre: 'Cumbia',         creationDate: '2020-06-18', registeredAt: '2020-07-02', durationSec: 250,
      contributors: [{ artistId: 'a-003', role: 'composer', split: 50 }, { artistId: 'a-006', role: 'arranger', split: 50 }] },
    { id: 'w-1005', artistId: 'a-003', title: 'Bailable de los lunes',   iswc: 'T-042.221.005-1', genre: 'Cumbia',         creationDate: '2019-10-30', registeredAt: '2019-11-12', durationSec: 232,
      contributors: [{ artistId: 'a-003', role: 'composer', split: 100 }] },
    { id: 'w-1006', artistId: 'a-004', title: 'Trance #3',               iswc: 'T-043.901.555-7', genre: 'Jazz',           creationDate: '2023-03-04', registeredAt: '2023-04-12', durationSec: 374,
      contributors: [{ artistId: 'a-004', role: 'composer', split: 100 }] },
    { id: 'w-1007', artistId: 'a-005', title: 'Aire del Sur',            iswc: 'T-901.234.567-8', genre: 'Folklore',       creationDate: '2022-05-10', registeredAt: '2022-05-25', durationSec: 178,
      contributors: [{ artistId: 'a-005', role: 'composer', split: 50 }, { artistId: 'a-007', role: 'lyricist', split: 50 }] },
    { id: 'w-1008', artistId: 'a-006', title: 'Plaza San Martín',        iswc: 'T-044.110.882-3', genre: 'Tango',          creationDate: '2018-04-20', registeredAt: '2018-05-04', durationSec: 263,
      contributors: [{ artistId: 'a-006', role: 'composer', split: 100 }] },
    { id: 'w-1009', artistId: 'a-007', title: 'Balada para Vos',         iswc: 'T-700.800.900-1', genre: 'Pop',            creationDate: '2024-01-08', registeredAt: '2024-01-30', durationSec: 215,
      contributors: [{ artistId: 'a-007', role: 'composer', split: 100 }] },
    { id: 'w-1010', artistId: 'a-008', title: 'Festival',                iswc: 'T-034.524.680-1', genre: 'Rock Nacional',  creationDate: '2023-09-02', registeredAt: '2023-10-01', durationSec: 222,
      contributors: [{ artistId: 'a-008', role: 'composer', split: 60 }, { artistId: 'a-002', role: 'lyricist', split: 40 }] },
    { id: 'w-1011', artistId: 'a-002', title: 'Día de semana',           iswc: 'T-041.660.003-2', genre: 'Folk',           creationDate: '2022-02-14', registeredAt: '2022-03-01', durationSec: 192,
      contributors: [{ artistId: 'a-002', role: 'composer', split: 100 }] },
    { id: 'w-1012', artistId: 'a-001', title: 'Marzo en cinta',          iswc: 'T-040.555.111-8', genre: 'Indie Rock',     creationDate: '2021-03-03', registeredAt: '2021-03-22', durationSec: 240,
      contributors: [{ artistId: 'a-001', role: 'composer', split: 100 }] },
  ];

  // -----------------------------
  // Recordings
  // -----------------------------
  const recordings = [
    { id: 'r-2001', workId: 'w-1001', isrc: 'ARABC2208001', versionLabel: 'master',    audioUrl: 'cdn://aud/2001.wav', dawUrl: 'cdn://daw/2001.logicx', recordedAt: '2022-08-30' },
    { id: 'r-2002', workId: 'w-1001', isrc: 'ARABC2208002', versionLabel: 'demo',      audioUrl: 'cdn://aud/2002.wav', dawUrl: null,                   recordedAt: '2022-07-04' },
    { id: 'r-2003', workId: 'w-1003', isrc: 'ARABC2111003', versionLabel: 'master',    audioUrl: 'cdn://aud/2003.wav', dawUrl: 'cdn://daw/2003.ptx',   recordedAt: '2021-11-22' },
    { id: 'r-2004', workId: 'w-1004', isrc: 'ARABC2006004', versionLabel: 'master',    audioUrl: 'cdn://aud/2004.wav', dawUrl: null,                   recordedAt: '2020-06-30' },
    { id: 'r-2005', workId: 'w-1006', isrc: 'ARABC2303005', versionLabel: 'live',      audioUrl: 'cdn://aud/2005.wav', dawUrl: null,                   recordedAt: '2023-03-15' },
    { id: 'r-2006', workId: 'w-1007', isrc: 'ARABC2205006', versionLabel: 'master',    audioUrl: 'cdn://aud/2006.wav', dawUrl: 'cdn://daw/2006.logicx',recordedAt: '2022-05-22' },
    { id: 'r-2007', workId: 'w-1009', isrc: 'ARABC2401007', versionLabel: 'master',    audioUrl: 'cdn://aud/2007.wav', dawUrl: 'cdn://daw/2007.logicx',recordedAt: '2024-01-18' },
    { id: 'r-2008', workId: 'w-1010', isrc: 'ARABC2309008', versionLabel: 'master',    audioUrl: 'cdn://aud/2008.wav', dawUrl: null,                   recordedAt: '2023-09-30' },
  ];

  // -----------------------------
  // Evidence files
  // -----------------------------
  const evidence = [
    { id: 'e-3001', workId: 'w-1001', type: 'score',              name: 'Madrugada — full score.pdf',       size: '1.2 MB',  uploadedAt: '2022-09-03', desc: 'Partitura completa (piano + voz + guitarra)' },
    { id: 'e-3002', workId: 'w-1001', type: 'audio_demo',         name: 'demo-jul04-2022.wav',              size: '34.1 MB', uploadedAt: '2022-07-04', desc: 'Demo home studio, voz + guitarra acústica' },
    { id: 'e-3003', workId: 'w-1001', type: 'daw_project',        name: 'Madrugada-master.logicx.zip',      size: '212 MB',  uploadedAt: '2022-08-30', desc: 'Proyecto Logic Pro X, sesión final' },
    { id: 'e-3004', workId: 'w-1001', type: 'mail',               name: 'cesion-letra-bruno.eml',           size: '14 KB',   uploadedAt: '2022-08-12', desc: 'Mail con cesión 30% de letra a B. Pasqualini' },
    { id: 'e-3005', workId: 'w-1003', type: 'score',              name: 'Carta — chord chart.pdf',          size: '380 KB',  uploadedAt: '2021-12-15', desc: 'Cifrado para guitarra' },
    { id: 'e-3006', workId: 'w-1003', type: 'prior_registration', name: 'sadaic-receipt-2021-12.pdf',       size: '120 KB',  uploadedAt: '2021-12-15', desc: 'Constancia de registro previo SADAIC' },
    { id: 'e-3007', workId: 'w-1004', type: 'audio_demo',         name: 'cumbia-trebol-master.wav',         size: '52 MB',   uploadedAt: '2020-07-02', desc: 'Master final 24/96' },
    { id: 'e-3008', workId: 'w-1006', type: 'audio_demo',         name: 'trance3-live-rosario.wav',         size: '88 MB',   uploadedAt: '2023-04-12', desc: 'Captura en vivo FM Universidad' },
    { id: 'e-3009', workId: 'w-1007', type: 'score',              name: 'aire-del-sur-letra-acordes.pdf',   size: '210 KB',  uploadedAt: '2022-05-25', desc: 'Letra y acordes' },
    { id: 'e-3010', workId: 'w-1007', type: 'mail',               name: 'split-50-50-acuerdo.eml',          size: '22 KB',   uploadedAt: '2022-05-20', desc: 'Acuerdo escrito 50/50 con Lila Ferreyra' },
    { id: 'e-3011', workId: 'w-1009', type: 'audio_demo',         name: 'balada-vos-master.wav',            size: '41 MB',   uploadedAt: '2024-01-30', desc: 'Master comercial' },
    { id: 'e-3012', workId: 'w-1010', type: 'metadata',           name: 'festival-metadata.json',           size: '4 KB',    uploadedAt: '2023-10-01', desc: 'Metadata DDEX completa' },
    { id: 'e-3013', workId: 'w-1004', type: 'daw_project',        name: 'cumbia-trebol.ptx.zip',            size: '180 MB',  uploadedAt: '2020-07-02', desc: 'Pro Tools session' },
  ];

  // -----------------------------
  // Contracts
  // -----------------------------
  const contracts = [
    { id: 'c-4001', workId: 'w-1001', party: 'Calma Ediciones SRL',    type: 'publishing',    file: 'pub-mariana-2022.pdf',   signedAt: '2022-09-01', expiresAt: '2032-09-01' },
    { id: 'c-4002', workId: 'w-1001', party: 'Bruno Pasqualini',       type: 'split',         file: 'cesion-30-letra.pdf',    signedAt: '2022-08-12', expiresAt: null },
    { id: 'c-4003', workId: 'w-1003', party: 'Calma Ediciones SRL',    type: 'publishing',    file: 'pub-tomas-2021.pdf',     signedAt: '2021-12-01', expiresAt: '2031-12-01' },
    { id: 'c-4004', workId: 'w-1004', party: 'Calma Ediciones SRL',    type: 'publishing',    file: 'pub-reyes-2020.pdf',     signedAt: '2020-07-01', expiresAt: '2030-07-01' },
    { id: 'c-4005', workId: 'w-1006', party: 'FM Universidad',         type: 'sync',          file: 'sync-fm-uni-2023.pdf',   signedAt: '2023-03-10', expiresAt: '2024-03-10' },
    { id: 'c-4006', workId: 'w-1007', party: 'Calma Ediciones SRL',    type: 'publishing',    file: 'pub-aire-2022.pdf',      signedAt: '2022-05-15', expiresAt: '2032-05-15' },
    { id: 'c-4007', workId: 'w-1010', party: 'Calma Ediciones SRL',    type: 'publishing',    file: 'pub-blnn-2023.pdf',      signedAt: '2023-10-01', expiresAt: '2033-10-01' },
  ];

  // -----------------------------
  // Claims (one per Excel row that the AI is processing)
  // Status: 'detected' (matched, awaiting bot send), 'submitted' (mail sent, waiting),
  //         'awaiting_evidence' (SADAIC asked for X — human action required),
  //         'resolved' (cobrado), 'rejected'
  // -----------------------------
  const claims = [
    {
      id: 'IND-2024-000001', workId: 'w-1010',
      cisacTitle: 'Obra sin identificar #1', performer: 'Banda Local NN',
      source: 'Festival Provincial 2024', usage: 'Live public performance',
      venue: 'Anfiteatro Municipal — Córdoba',
      executionDate: '2024-02-15', period: '1° cuatrimestre 2024',
      amount: 184500, status: 'submitted',
      reason: 'Performed work not declared in SADAIC nor sister society',
      receivedAt: '2024-04-02', deadline: '2027-02-15',
      confidence: 0.94, matchedAt: '2024-04-02T09:14:00',
      matchSignals: ['Title token "Festival" matches w-1010', 'Performer = registered artist a-008', 'Period overlaps work registration'],
    },
    {
      id: 'IND-2024-000002', workId: 'w-1004',
      cisacTitle: 'Cumbia s/título', performer: 'Los Reyes del Barrio',
      source: 'Compilado bailable vol. 12', usage: 'Locales bailables',
      venue: 'Bailable El Trébol — GBA Sur',
      executionDate: '2024-03-22', period: '1° cuatrimestre 2024',
      amount: 67200, status: 'awaiting_evidence',
      reason: 'No ISWC; incomplete fonogram metadata',
      receivedAt: '2024-04-02', deadline: '2027-03-22',
      confidence: 0.88, matchedAt: '2024-04-02T09:14:11',
      matchSignals: ['Performer exact match → a-003', 'Genre "Cumbia" + venue token "Trébol" → w-1004'],
      requestedEvidence: { type: 'master_recording_isrc_proof', label: 'ISRC certificate for master recording', dueBy: '2024-05-12' },
    },
    {
      id: 'IND-2024-000003', workId: 'w-1007',
      cisacTitle: 'Aire del Sur', performer: 'Solista NN',
      source: 'EP Indie 2023', usage: 'Streaming digital',
      venue: 'DSP — reporte mensual',
      executionDate: '2024-01-31', period: '1° cuatrimestre 2024',
      amount: 41200, status: 'detected',
      reason: 'Author declared without active mandate',
      receivedAt: '2024-04-02', deadline: '2027-01-31',
      confidence: 0.99, matchedAt: '2024-04-02T09:14:22',
      matchSignals: ['ISWC exact match T-901.234.567-8', 'Title exact match', 'Artist a-005 in roster'],
    },
    {
      id: 'IND-2024-000004', workId: 'w-1006',
      cisacTitle: 'Instrumental jazz #3', performer: 'Cuarteto Independiente',
      source: 'Demo en vivo', usage: 'Radio AM/FM',
      venue: 'FM Universidad — Rosario',
      executionDate: '2024-04-08', period: '2° cuatrimestre 2024',
      amount: 12800, status: 'submitted',
      reason: 'Work not in declared repertoire',
      receivedAt: '2024-04-15', deadline: '2027-04-08',
      confidence: 0.91, matchedAt: '2024-04-15T11:02:14',
      matchSignals: ['Performer match a-004', 'Title token "jazz" + genre match w-1006', 'Sync contract c-4005 with venue'],
    },
    {
      id: 'IND-2024-000005', workId: null,
      cisacTitle: 'Marcha del 25', performer: 'Banda Militar',
      source: 'Acto patrio', usage: 'Acto escolar',
      venue: 'Plaza Central',
      executionDate: '2024-05-25', period: '2° cuatrimestre 2024',
      amount: 4200, status: 'rejected',
      reason: 'Possible public domain; verify author death date',
      receivedAt: '2024-06-01', deadline: '2027-05-25',
      confidence: 0.04, matchedAt: '2024-06-01T08:00:00',
      matchSignals: ['No catalog match', 'Likely public domain — flagged out'],
    },
    {
      id: 'IND-2024-000006', workId: null,
      cisacTitle: 'Ringtone #45', performer: '—',
      source: 'Aplicación móvil XYZ', usage: 'Ringtones / tonos de espera',
      venue: 'Empresa Telco SA',
      executionDate: '2024-02-01', period: '1° cuatrimestre 2024',
      amount: 800, status: 'detected',
      reason: 'Fragment not identified by automatic matching',
      receivedAt: '2024-04-02', deadline: '2027-02-01',
      confidence: 0.32, matchedAt: '2024-04-02T09:15:01',
      matchSignals: ['Low-confidence fingerprint match', 'Manual review suggested'],
    },
    {
      id: 'IND-2024-000007', workId: 'w-1009',
      cisacTitle: 'Balada para Vos', performer: 'Lila Ferreyra',
      source: 'EP Solo 2024', usage: 'Streaming digital',
      venue: 'DSP — reporte mensual',
      executionDate: '2024-03-15', period: '1° cuatrimestre 2024',
      amount: 89400, status: 'awaiting_evidence',
      reason: 'Splits in conflict with co-author claim from third party',
      receivedAt: '2024-04-18', deadline: '2027-03-15',
      confidence: 0.92, matchedAt: '2024-04-18T10:33:44',
      matchSignals: ['ISWC exact T-700.800.900-1', 'Artist a-007 in roster'],
      requestedEvidence: { type: 'split_agreement', label: 'Signed split agreement (PDF + parties\' IDs)', dueBy: '2024-05-18' },
    },
    {
      id: 'IND-2024-000008', workId: 'w-1003',
      cisacTitle: 'Carta a la Hermana', performer: 'Tomás Belarde',
      source: 'Reposición LP 2023', usage: 'Radio AM/FM',
      venue: 'Radio Nacional — AM 870',
      executionDate: '2024-02-22', period: '1° cuatrimestre 2024',
      amount: 22100, status: 'resolved',
      reason: 'Work registered but missing in SADAIC active repertoire',
      receivedAt: '2024-03-10', deadline: '2027-02-22',
      confidence: 0.97, matchedAt: '2024-03-10T08:44:02',
      resolvedAt: '2024-04-22T15:10:00',
      matchSignals: ['ISWC match', 'Author a-002 ✓', 'Prior registration evidence on file'],
    },
    {
      id: 'IND-2024-000009', workId: 'w-1001',
      cisacTitle: 'Madrugada Av Forest', performer: 'Mariana Q.',
      source: 'Set en vivo Niceto', usage: 'Live public performance',
      venue: 'Niceto Club — CABA',
      executionDate: '2024-03-30', period: '1° cuatrimestre 2024',
      amount: 56800, status: 'detected',
      reason: 'Title spelling mismatch + missing ISWC',
      receivedAt: '2024-04-19', deadline: '2027-03-30',
      confidence: 0.96, matchedAt: '2024-04-19T11:00:21',
      matchSignals: ['Title fuzzy match (95%)', 'Performer a-001 ✓', 'Venue + period coincide'],
    },
    {
      id: 'IND-2024-000010', workId: 'w-1011',
      cisacTitle: 'Día de semana', performer: 'Tomás Belarde',
      source: 'Spotify reporte', usage: 'Streaming digital',
      venue: 'DSP — reporte mensual',
      executionDate: '2024-02-28', period: '1° cuatrimestre 2024',
      amount: 14300, status: 'resolved',
      reason: 'No ISWC declared by DSP',
      receivedAt: '2024-03-08', deadline: '2027-02-28',
      confidence: 0.93, matchedAt: '2024-03-08T07:55:10',
      resolvedAt: '2024-04-12T11:01:00',
      matchSignals: ['Title + author exact'],
    },
    {
      id: 'IND-2024-000011', workId: 'w-1002',
      cisacTitle: 'Hotel Vacio', performer: 'Mariana Quintero',
      source: 'TV cue sheet — Canal 9', usage: 'TV broadcast',
      venue: 'Canal 9 — programa "Sobremesa"',
      executionDate: '2024-04-12', period: '2° cuatrimestre 2024',
      amount: 31900, status: 'submitted',
      reason: 'Cue sheet typo (missing accent), no ISWC',
      receivedAt: '2024-04-30', deadline: '2027-04-12',
      confidence: 0.95, matchedAt: '2024-04-30T13:40:00',
      matchSignals: ['Title fuzzy 92%', 'Author exact'],
    },
    {
      id: 'IND-2024-000012', workId: 'w-1008',
      cisacTitle: 'Plaza San Martin (instrumental)', performer: 'Bruno Pasqualini',
      source: 'Documental indep.', usage: 'Sync — film',
      venue: 'Festival Mar del Plata',
      executionDate: '2024-04-22', period: '2° cuatrimestre 2024',
      amount: 142000, status: 'awaiting_evidence',
      reason: 'Sync use without licensing record',
      receivedAt: '2024-05-01', deadline: '2027-04-22',
      confidence: 0.89, matchedAt: '2024-05-01T16:20:14',
      matchSignals: ['Title fuzzy', 'Author a-006 ✓'],
      requestedEvidence: { type: 'sync_license', label: 'Sync license signed with film producer', dueBy: '2024-05-25' },
    },
    {
      id: 'IND-2024-000013', workId: 'w-1005',
      cisacTitle: 'Bailable lunes', performer: 'Los Reyes del Barrio',
      source: 'Reporte agente recaudador', usage: 'Locales bailables',
      venue: 'La Esquina — Quilmes',
      executionDate: '2024-04-05', period: '2° cuatrimestre 2024',
      amount: 8400, status: 'submitted',
      reason: 'Title shorthand, missing ISWC',
      receivedAt: '2024-04-25', deadline: '2027-04-05',
      confidence: 0.87, matchedAt: '2024-04-25T10:11:00',
      matchSignals: ['Title fuzzy 88%', 'Author exact'],
    },
    {
      id: 'IND-2024-000014', workId: 'w-1012',
      cisacTitle: 'Marzo en cinta', performer: 'Mariana Q.',
      source: 'Spotify reporte', usage: 'Streaming digital',
      venue: 'DSP — reporte mensual',
      executionDate: '2024-01-15', period: '1° cuatrimestre 2024',
      amount: 9200, status: 'resolved',
      reason: 'No ISWC',
      receivedAt: '2024-03-04', deadline: '2027-01-15',
      confidence: 0.95, matchedAt: '2024-03-04T09:00:00',
      resolvedAt: '2024-04-04T10:00:00',
      matchSignals: ['Title + author exact'],
    },
    {
      id: 'IND-2024-000015', workId: null,
      cisacTitle: 'Forever', performer: 'John',
      source: 'TV cue sheet', usage: 'TV broadcast',
      venue: 'Canal 13 — novela',
      executionDate: '2024-03-18', period: '1° cuatrimestre 2024',
      amount: 18500, status: 'rejected',
      reason: '200+ works named "Forever"; no further metadata',
      receivedAt: '2024-04-05', deadline: '2027-03-18',
      confidence: 0.08, matchedAt: '2024-04-05T08:00:00',
      matchSignals: ['Ambiguous: too many candidates globally', 'Marked out-of-roster'],
    },
  ];

  // -----------------------------
  // Mail threads (per claim)
  // -----------------------------
  const threads = {
    'IND-2024-000001': [
      { dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar', subject: 'Reclamo de derechos — IND-2024-000001 / Festival', sentAt: '2024-04-02 09:21', body: `Estimados,\n\nAdjuntamos reclamo de la obra registrada en nuestro repertorio "Festival" (ISWC T-034.524.680-1), interpretada por Banda Local NN en Anfiteatro Municipal de Córdoba el 2024-02-15. La obra figura como ítem #7 del setlist levantado por inspector.\n\nAdjuntamos: registro SADAIC, contrato editorial, partitura y demo audio.\n\nQuedamos a la espera.`, attachments: ['pub-blnn-2023.pdf','festival-metadata.json'] },
    ],
    'IND-2024-000002': [
      { dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar', subject: 'Reclamo — IND-2024-000002 / Cumbia del Trébol', sentAt: '2024-04-02 09:25', body: `Estimados,\n\nReclamamos la obra "Cumbia del Trébol" (ISWC T-042.119.876-4) de Los Reyes del Barrio, ejecutada en Bailable El Trébol — GBA Sur el 2024-03-22. Adjuntamos contrato editorial y master.`, attachments: ['pub-reyes-2020.pdf','cumbia-trebol-master.wav'] },
      { dir: 'inbound',  channel: 'email', from: 'reclamos@sadaic.org.ar', to: 'bot@calma.ar', subject: 'RE: Reclamo — IND-2024-000002', sentAt: '2024-04-19 14:02', body: `Buenas tardes,\n\nPara avanzar con el reclamo necesitamos certificado ISRC del fonograma master del registro adjunto. Por favor remitir antes del 2024-05-12.\n\nSaludos.`, attachments: [] },
    ],
    'IND-2024-000003': [],
    'IND-2024-000004': [
      { dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar', subject: 'Reclamo — IND-2024-000004 / Trance #3', sentAt: '2024-04-15 11:08', body: `Estimados,\n\nReclamamos la obra "Trance #3" (ISWC T-043.901.555-7), del Cuarteto Independiente, ejecutada en FM Universidad de Rosario el 2024-04-08. Existe contrato sync vigente con la emisora (c-4005). Adjuntamos.`, attachments: ['sync-fm-uni-2023.pdf','trance3-live-rosario.wav'] },
    ],
    'IND-2024-000005': [],
    'IND-2024-000006': [],
    'IND-2024-000007': [
      { dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar', subject: 'Reclamo — IND-2024-000007 / Balada para Vos', sentAt: '2024-04-18 10:39', body: `Estimados,\n\nReclamamos "Balada para Vos" (ISWC T-700.800.900-1) de Lila Ferreyra (a-007). Adjunto registro y master.`, attachments: ['pub-aire-2022.pdf','balada-vos-master.wav'] },
      { dir: 'inbound',  channel: 'email', from: 'reclamos@sadaic.org.ar', to: 'bot@calma.ar', subject: 'RE: Reclamo — IND-2024-000007', sentAt: '2024-05-02 09:18', body: `Buenas,\n\nRecibimos un reclamo paralelo de un tercero declarando coautoría 50/50. Por favor adjuntar acuerdo de splits firmado y documento identidad de las partes para resolver el conflicto. Plazo 2024-05-18.\n\nSaludos.`, attachments: [] },
    ],
    'IND-2024-000008': [
      { dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar', subject: 'Reclamo — IND-2024-000008 / Carta a la Hermana', sentAt: '2024-03-10 08:51', body: `Estimados, reclamamos "Carta a la Hermana" (ISWC T-041.554.001-9) de Tomás Belarde. Adjunto registro previo y demo.`, attachments: ['sadaic-receipt-2021-12.pdf'] },
      { dir: 'inbound',  channel: 'email', from: 'reclamos@sadaic.org.ar', to: 'bot@calma.ar', subject: 'RE: Reclamo — IND-2024-000008', sentAt: '2024-04-22 15:10', body: `Confirmamos identificación. Liquidación incluida en próximo período.`, attachments: [] },
    ],
    'IND-2024-000009': [],
    'IND-2024-000010': [
      { dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar', subject: 'Reclamo — IND-2024-000010 / Día de semana', sentAt: '2024-03-08 08:02', body: `Reclamamos "Día de semana" (ISWC T-041.660.003-2) de Tomás Belarde.`, attachments: ['pub-tomas-2021.pdf'] },
      { dir: 'inbound',  channel: 'email', from: 'reclamos@sadaic.org.ar', to: 'bot@calma.ar', subject: 'RE: Reclamo — IND-2024-000010', sentAt: '2024-04-12 11:01', body: `Identificación confirmada. Liquidado.`, attachments: [] },
    ],
    'IND-2024-000011': [
      { dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar', subject: 'Reclamo — IND-2024-000011 / Hotel Vacío', sentAt: '2024-04-30 13:46', body: `Reclamamos "Hotel Vacío" (ISWC T-040.998.213-0) de Mariana Quintero. Cue sheet recibido sin acento.`, attachments: ['pub-mariana-2022.pdf'] },
    ],
    'IND-2024-000012': [
      { dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar', subject: 'Reclamo — IND-2024-000012 / Plaza San Martín', sentAt: '2024-05-01 16:25', body: `Reclamamos "Plaza San Martín" (ISWC T-044.110.882-3) de Bruno Pasqualini, usada en documental.`, attachments: [] },
      { dir: 'inbound',  channel: 'email', from: 'reclamos@sadaic.org.ar', to: 'bot@calma.ar', subject: 'RE: Reclamo — IND-2024-000012', sentAt: '2024-05-08 11:00', body: `Para validar el uso sync requerimos contrato firmado con la productora del filme. Plazo 2024-05-25.`, attachments: [] },
    ],
    'IND-2024-000013': [
      { dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar', subject: 'Reclamo — IND-2024-000013', sentAt: '2024-04-25 10:14', body: `Reclamamos "Bailable de los lunes" (ISWC T-042.221.005-1).`, attachments: [] },
    ],
    'IND-2024-000014': [
      { dir: 'outbound', channel: 'email', from: 'bot@calma.ar', to: 'reclamos@sadaic.org.ar', subject: 'Reclamo — IND-2024-000014 / Marzo en cinta', sentAt: '2024-03-04 09:04', body: `Reclamamos "Marzo en cinta" (ISWC T-040.555.111-8).`, attachments: [] },
      { dir: 'inbound',  channel: 'email', from: 'reclamos@sadaic.org.ar', to: 'bot@calma.ar', subject: 'RE: Reclamo — IND-2024-000014', sentAt: '2024-04-04 10:00', body: `Liquidado.`, attachments: [] },
    ],
    'IND-2024-000015': [],
  };

  // -----------------------------
  // Bot activity log (Today)
  // -----------------------------
  const botLog = [
    { ts: '09:14:00', kind: 'ingest',   text: 'Ingested 47 rows from "ejemplo_derechos_indeterminados_SADAIC.xlsx"' },
    { ts: '09:14:08', kind: 'match',    text: 'Matched 31 rows against catalog (≥0.85 confidence)' },
    { ts: '09:14:14', kind: 'review',   text: 'Flagged 6 rows for manual review (low confidence)' },
    { ts: '09:14:14', kind: 'reject',   text: '10 rows out of roster — no claim possible' },
    { ts: '09:21:02', kind: 'send',     text: 'Sent claim IND-2024-000001 → SADAIC' },
    { ts: '09:25:11', kind: 'send',     text: 'Sent claim IND-2024-000002 → SADAIC' },
    { ts: '11:08:33', kind: 'send',     text: 'Sent claim IND-2024-000004 → SADAIC' },
    { ts: '14:02:20', kind: 'inbound',  text: 'SADAIC requested ISRC certificate on IND-2024-000002' },
  ];

  return { artists, works, recordings, evidence, contracts, claims, threads, botLog };
})();

window.SEED = SEED;

/* Inspire Pilates Studio — moteur de données partagé (site + back-office).
   MAQUETTE : les données vivent dans le navigateur (localStorage).
   En production, ce module est remplacé par des appels à l'API serveur,
   avec la même structure de données et les mêmes règles. */
(function (global) {
  'use strict';

  const KEY = 'ips-demo-v1';
  const ME_KEY = 'ips-demo-me';
  const DAY = 864e5;

  const uid = (p) => p + Math.random().toString(36).slice(2, 9);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

  /* ---------- Contenu réel du studio (CGV 06/08/2026, site actuel) ---------- */
  const OFFERS = [
    { id: 'o-unite', cat: 'unite', name: "Séance à l'unité", price: 35, credits: 1, validity: 1, kind: 'pack' },
    { id: 'o-decouverte', cat: 'decouverte', name: 'Séance découverte', price: 30, credits: 1, validity: 1, kind: 'pack', newOnly: true },
    { id: 'o-decouverte3', cat: 'decouverte', name: 'Pack découverte 3 séances', price: 75, credits: 3, validity: 2, kind: 'pack', newOnly: true },
    { id: 'o-sans4', cat: 'sans', name: 'Abonnement 4 séances par mois sans engagement', price: 105, credits: 4, kind: 'abo', engagement: 0 },
    { id: 'o-sans8', cat: 'sans', name: 'Abonnement 8 séances par mois sans engagement', price: 195, credits: 8, kind: 'abo', engagement: 0 },
    { id: 'o-sans12', cat: 'sans', name: 'Abonnement 12 séances par mois sans engagement', price: 280, credits: 12, kind: 'abo', engagement: 0 },
    { id: 'o-avec4', cat: 'avec', name: 'Abonnement 4 séances par mois avec engagement', price: 90, credits: 4, kind: 'abo', engagement: 12 },
    { id: 'o-avec8', cat: 'avec', name: 'Abonnement 8 séances par mois avec engagement', price: 170, credits: 8, kind: 'abo', engagement: 12 },
    { id: 'o-avec12', cat: 'avec', name: 'Abonnement 12 séances par mois avec engagement', price: 250, credits: 12, kind: 'abo', engagement: 12 },
    { id: 'o-pack3', cat: 'pack', name: 'Pack 3 séances', price: 100, credits: 3, validity: 2, kind: 'pack' },
    { id: 'o-pack5', cat: 'pack', name: 'Pack 5 séances', price: 160, credits: 5, validity: 3, kind: 'pack' },
    { id: 'o-pack10', cat: 'pack', name: 'Pack 10 séances', price: 300, credits: 10, validity: 6, kind: 'pack' },
    { id: 'o-pack20', cat: 'pack', name: 'Pack 20 séances', price: 560, credits: 20, validity: 12, kind: 'pack' },
    { id: 'o-pack50', cat: 'pack', name: 'Pack 50 séances', price: 1200, credits: 50, validity: 12, kind: 'pack' },
    { id: 'o-cad3', cat: 'cadeau', name: 'Carte cadeau 3 séances', price: 100, credits: 3, validity: 2, kind: 'pack' },
    { id: 'o-cad5', cat: 'cadeau', name: 'Carte cadeau 5 séances', price: 160, credits: 5, validity: 3, kind: 'pack' },
    { id: 'o-cad10', cat: 'cadeau', name: 'Carte cadeau 10 séances', price: 300, credits: 10, validity: 6, kind: 'pack' }
  ].map((o) => Object.assign({ active: true }, o));

  const COACHES = [
    { id: 'c-marine', name: 'Marine', photo: 'coach-marine.webp', bio: '' },
    { id: 'c-camille', name: 'Camille', photo: 'coach-camille.webp', bio: "Passionnée de Pilates depuis de nombreuses années, je me forme continuellement pour offrir des cours à la fois doux, intenses et exigeants.\nJ’aime transmettre, encourager et accompagner chacun à développer sa force, sa confiance et sa conscience du mouvement." },
    { id: 'c-emma', name: 'Emma', photo: 'coach-emma.webp', bio: "Ancienne danseuse, j’ai découvert le Pilates après une blessure, à un moment où je cherchais une manière douce mais efficace de retrouver force et mobilité. Très vite, je suis tombée amoureuse de cette discipline qui allie précision, contrôle et bien-être.\nPassionnée par ses bienfaits, j’ai décidé de me former pour approfondir mes connaissances et partager cette approche avec d’autres. J’ai commencé à enseigner le Pilates à l’étranger avant de revenir en France, où je continue aujourd’hui à transmettre cette passion avec enthousiasme, énergie et bienveillance.\nPétillante et souriante, j’aime créer une ambiance positive et motivante dans chacun de mes cours, pour que mes élèves se sentent à la fois soutenus et inspirés." },
    { id: 'c-armelle', name: 'Armelle', photo: 'coach-armelle.webp', bio: "Le mouvement et la performance ont toujours fait partie de ma vie, et le Pilates est devenu pour moi un véritable espace de bien être et d’équilibre.\nLe Pilates, sous toutes ses formes, invite à écouter son corps, à le renforcer en douceur et à retrouver de la fluidité dans chaque geste. J’aime créer des séances comme des parenthèses hors du temps, où l’on bouge avec attention, intention et plaisir.\nIl me tient à cœur que chacun se sente accueilli avec douceur dans mon univers, vous aurez tous votre place ici. Je mettrai toute ma bienveillance et mon expérience de coaching au service de mon enseignement pour que vous puissiez passer le meilleur moment de votre journée." },
    { id: 'c-laura', name: 'Laura', photo: 'coach-laura.webp', bio: "Après une première vie dans le marketing, j'ai ressenti le besoin de revenir à quelque chose de plus essentiel. Me reconnecter au mouvement, au corps, à l'humain. C'est ce chemin qui m'a conduite à une reconversion guidée par l'envie de partager ce qui m'a profondément transformée.\nAujourd'hui, j'accompagne celles et ceux qui souhaitent retrouver confiance, force et énergie à travers une pratique accessible et respectueuse du corps.\nJ'enseigne avec bienveillance, dans l'idée de faire de chaque séance un espace où l'on progresse à son rythme, en toute sécurité et avec le sourire." },
    { id: 'c-elisabeth', name: 'Elisabeth', photo: 'coach-elisabeth.webp', bio: '' }
  ].map((c) => Object.assign({ active: true }, c));

  const ACTIVITIES = [
    { id: 'a-reformer', name: 'Pilates Reformer', duration: 50 },
    { id: 'a-burn', name: 'Reformer – Burn / cardio jumpboard', duration: 50 },
    { id: 'a-prive', name: 'Cours privé', duration: 50, private: true }
  ];

  const SETTINGS = {
    bookingWindowDays: 30,     // CGV : jusqu'à 30 jours à l'avance
    minBeforeMinutes: 15,      // CGV : jusqu'à 15 minutes avant
    freeCancelHours: 12,       // CGV : annulation gratuite 12 h avant
    defaultCapacity: 8,        // à confirmer avec le studio (nombre de reformers)
    hours: [],                 // horaires d'ouverture : vides sur le site actuel, à renseigner
    announcement: { on: true, text: 'Retraite Inspire à Marrakech, 4 jours d’immersion du 5 au 8 novembre', link: 'retraite-marrakech.html' }
  };

  /* ---------- Jeu de démonstration (clients et planning fictifs) ---------- */
  function seed() {
    const db = {
      version: 1, offers: clone(OFFERS), coaches: clone(COACHES), activities: clone(ACTIVITIES),
      settings: clone(SETTINGS), clients: [], memberships: [], payments: [], sessions: [], notifications: [], log: []
    };
    const people = [
      ['Chloé', 'Martin'], ['Léa', 'Bernard'], ['Manon', 'Dubois'], ['Inès', 'Thomas'], ['Camille', 'Robert'],
      ['Sarah', 'Richard'], ['Julie', 'Petit'], ['Clara', 'Durand'], ['Lucie', 'Leroy'], ['Emma', 'Moreau'],
      ['Alice', 'Simon'], ['Louise', 'Laurent'], ['Hugo', 'Lefebvre'], ['Margaux', 'Michel'], ['Anaïs', 'Garcia'],
      ['Pauline', 'David'], ['Nina', 'Bertrand'], ['Zoé', 'Roux']
    ];
    const now = new Date();
    people.forEach(([f, l], i) => {
      db.clients.push({
        id: 'u' + (i + 1), firstName: f, lastName: l,
        email: (f + '.' + l).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '@exemple.fr',
        phone: '06 ' + String(10 + i).padStart(2, '0') + ' 4' + (i % 10) + ' 2' + ((i * 3) % 10) + ' ' + String(30 + i),
        createdAt: new Date(now - (200 - i * 9) * DAY).toISOString(), marketing: i % 3 === 0, notes: ''
      });
    });
    const plan = ['o-sans8', 'o-avec4', 'o-pack10', 'o-sans4', 'o-avec12', 'o-pack5', 'o-avec8', 'o-pack20', 'o-sans12',
      'o-pack10', 'o-avec4', 'o-decouverte3', 'o-pack3', 'o-sans4', 'o-unite', 'o-avec8', 'o-pack5', 'o-decouverte'];
    db.clients.forEach((c, i) => {
      const methods = ['CB', 'SEPA', 'CB', 'Espèces', 'Chèque'];
      const off = db.offers.find((o) => o.id === plan[i]);
      const start = new Date(now - (2 + (i * 7) % 40) * DAY);
      sellInto(db, c.id, off.id, off.kind === 'abo' ? 'SEPA' : methods[i % 5], i !== 14, start);
    });

    // Modèle de semaine (démonstration) : à remplacer par le vrai planning du studio.
    const week = {
      1: [['07:15', 'a-reformer'], ['12:15', 'a-reformer'], ['18:30', 'a-burn'], ['19:30', 'a-reformer']],
      2: [['07:15', 'a-reformer'], ['12:15', 'a-burn'], ['18:30', 'a-reformer'], ['19:30', 'a-reformer']],
      3: [['09:30', 'a-reformer'], ['12:15', 'a-reformer'], ['18:30', 'a-reformer'], ['19:30', 'a-burn']],
      4: [['07:15', 'a-burn'], ['12:15', 'a-reformer'], ['18:30', 'a-reformer'], ['19:30', 'a-reformer']],
      5: [['07:15', 'a-reformer'], ['12:15', 'a-reformer'], ['18:00', 'a-reformer']],
      6: [['09:30', 'a-reformer'], ['10:30', 'a-burn'], ['11:30', 'a-reformer']]
    };
    const coachIds = db.coaches.map((c) => c.id);
    let k = 0;
    for (let d = -21; d <= 35; d++) {
      const day = startOfDay(new Date(now.getTime() + d * DAY));
      (week[day.getDay()] || []).forEach(([t, a]) => {
        const [h, m] = t.split(':').map(Number);
        const s = new Date(day); s.setHours(h, m);
        db.sessions.push({
          id: 's' + (++k), activityId: a, coachId: coachIds[(k * 5 + day.getDay()) % coachIds.length],
          start: s.toISOString(), duration: 50, capacity: db.settings.defaultCapacity,
          bookings: [], waitlist: [], attendance: {}, cancelled: false, note: ''
        });
      });
    }
    // Réservations fictives : passé pointé, futur partiellement rempli.
    db.sessions.forEach((s, i) => {
      const t = new Date(s.start);
      const future = t > now;
      const horizon = (t - now) / DAY;
      let n = future ? Math.max(0, Math.round(8 - horizon * 0.9 + ((i * 7) % 5) - 2)) : 3 + ((i * 5) % 6);
      n = Math.min(n, s.capacity);
      for (let j = 0; j < n; j++) {
        const c = db.clients[(i * 3 + j * 5) % db.clients.length];
        if (s.bookings.some((b) => b.clientId === c.id)) continue;
        if (future && c.id === 'u1') continue; // compte de démonstration : garde ses crédits
        let m = pickMembership(db, c.id, t);
        if (!m && future) m = sellInto(db, c.id, 'o-pack10', 'CB', true, new Date(now - (1 + j) * DAY));
        if (m) m.creditsLeft--;
        s.bookings.push({ clientId: c.id, membershipId: m ? m.id : null, at: new Date(t - 3 * DAY).toISOString() });
        if (!future) s.attendance[c.id] = (i + j) % 9 === 0 ? 'absent' : 'present';
      }
      if (future && s.bookings.length >= s.capacity && i % 2) {
        const c = db.clients[(i + 11) % db.clients.length];
        if (!s.bookings.some((b) => b.clientId === c.id)) s.waitlist.push({ clientId: c.id, at: now.toISOString() });
      }
    });
    db.log.push({ at: now.toISOString(), text: 'Jeu de démonstration créé' });
    return db;
  }

  /* ---------- Persistance et abonnements ---------- */
  let db = null;
  const listeners = new Set();

  function load() {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || db.version !== 1) { db = seed(); persist(); }
    renewSubscriptions();
    return db;
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* navigation privée : données en mémoire */ }
  }
  function commit(text) {
    if (text) db.log.unshift({ at: new Date().toISOString(), text });
    db.log = db.log.slice(0, 300);
    persist();
    listeners.forEach((fn) => fn(db));
  }
  global.addEventListener('storage', (e) => {
    if (e.key === KEY) { load(); listeners.forEach((fn) => fn(db)); }
  });

  /* ---------- Règles métier ---------- */
  function sellInto(d, clientId, offerId, method, paid, start) {
    const off = d.offers.find((o) => o.id === offerId);
    const begin = start ? new Date(start) : new Date();
    const m = {
      id: uid('m'), clientId, offerId, name: off.name, kind: off.kind, start: begin.toISOString(),
      credits: off.credits, creditsLeft: off.credits, status: 'actif'
    };
    if (off.kind === 'abo') {
      m.cycleEnd = addMonths(begin, 1).toISOString();
      m.engagementEnd = off.engagement ? addMonths(begin, off.engagement).toISOString() : null;
      m.end = null;
    } else {
      m.end = addMonths(begin, off.validity || 1).toISOString();
    }
    d.memberships.push(m);
    d.payments.push({
      id: uid('p'), clientId, membershipId: m.id, label: off.name, amount: off.price, method,
      date: begin.toISOString(), status: paid ? 'payé' : 'à régler'
    });
    return m;
  }

  function pickMembership(d, clientId, when) {
    const t = new Date(when);
    return d.memberships
      .filter((m) => m.clientId === clientId && m.status === 'actif' && m.creditsLeft > 0 &&
        new Date(m.start) <= t && (m.kind === 'abo' ? t < new Date(m.cycleEnd) : t < new Date(m.end)))
      .sort((a, b) => new Date(a.end || a.cycleEnd) - new Date(b.end || b.cycleEnd))[0] || null;
  }

  // Automatisation : renouvellement mensuel des abonnements et expiration des packs.
  function renewSubscriptions() {
    const now = new Date();
    let changed = false;
    db.memberships.forEach((m) => {
      if (m.status !== 'actif') return;
      if (m.kind === 'abo') {
        while (new Date(m.cycleEnd) <= now) {
          const off = db.offers.find((o) => o.id === m.offerId);
          const cycleStart = new Date(m.cycleEnd);
          m.cycleEnd = addMonths(cycleStart, 1).toISOString();
          m.creditsLeft = m.credits;
          db.payments.push({ id: uid('p'), clientId: m.clientId, membershipId: m.id, label: m.name + ' (mensualité)',
            amount: off ? off.price : 0, method: 'SEPA', date: cycleStart.toISOString(), status: 'payé' });
          changed = true;
        }
      } else if (new Date(m.end) <= now) { m.status = 'expiré'; changed = true; }
    });
    if (changed) persist();
  }

  function notify(clientId, subject, body) {
    const c = byId('clients', clientId);
    db.notifications.unshift({ id: uid('n'), at: new Date().toISOString(), clientId,
      to: c ? c.email : '', subject, body, channel: 'e-mail' });
    db.notifications = db.notifications.slice(0, 400);
  }

  function byId(col, id) { return db[col].find((x) => x.id === id) || null; }
  const sessionLabel = (s) => {
    const a = byId('activities', s.activityId);
    return (a ? a.name : 'Cours') + ', ' + new Date(s.start).toLocaleString('fr-FR',
      { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  function canBook(s, when) {
    const now = when || new Date();
    const t = new Date(s.start);
    if (s.cancelled) return { ok: false, reason: 'Cette séance est annulée.' };
    if (t - now < db.settings.minBeforeMinutes * 6e4) return { ok: false, reason: 'Les réservations ferment ' + db.settings.minBeforeMinutes + ' minutes avant le cours.' };
    if (t - now > db.settings.bookingWindowDays * DAY) return { ok: false, reason: 'Les réservations ouvrent ' + db.settings.bookingWindowDays + ' jours avant le cours.' };
    return { ok: true };
  }

  function placesLeft(s) { return Math.max(0, s.capacity - s.bookings.length); }

  /* option : 'credit' (forfait) | 'unite' | 'decouverte' — les deux dernières sont réglées au studio en démo */
  function book(sessionId, clientId, option, by) {
    const s = byId('sessions', sessionId);
    const c = byId('clients', clientId);
    if (!s || !c) return { ok: false, msg: 'Séance ou client introuvable.' };
    if (by !== 'admin') { const chk = canBook(s); if (!chk.ok) return { ok: false, msg: chk.reason }; }
    if (s.bookings.some((b) => b.clientId === clientId)) return { ok: false, msg: 'Vous êtes déjà inscrit·e à cette séance.' };
    if (placesLeft(s) === 0) {
      if (s.waitlist.some((w) => w.clientId === clientId)) return { ok: false, msg: 'Vous êtes déjà sur la liste d’attente.' };
      s.waitlist.push({ clientId, at: new Date().toISOString(), option: option || 'credit' });
      notify(clientId, 'Liste d’attente : ' + sessionLabel(s),
        'Vous êtes en position ' + s.waitlist.length + '. Si une place se libère, vous serez inscrit·e automatiquement et prévenu·e par e-mail.');
      commit(c.firstName + ' ' + c.lastName + ' rejoint la liste d’attente (' + sessionLabel(s) + ')');
      return { ok: true, status: 'waitlist', position: s.waitlist.length };
    }
    const res = placeBooking(s, c, option);
    commit(c.firstName + ' ' + c.lastName + ' réserve ' + sessionLabel(s) + (by === 'admin' ? ' (ajout par le studio)' : ''));
    return res;
  }

  function placeBooking(s, c, option) {
    let membershipId = null;
    let paymentId = null;
    const m = pickMembership(db, c.id, s.start);
    if (m && option !== 'unite' && option !== 'decouverte') { m.creditsLeft--; membershipId = m.id; }
    else {
      const offId = option === 'decouverte' && isNewClient(c.id) ? 'o-decouverte' : 'o-unite';
      const nm = sellInto(db, c.id, offId, 'Au studio', false, new Date());
      nm.creditsLeft--; membershipId = nm.id;
      paymentId = db.payments[db.payments.length - 1].id;
    }
    s.bookings.push({ clientId: c.id, membershipId, paymentId, at: new Date().toISOString() });
    const left = m && membershipId === m.id ? '\nIl vous reste ' + m.creditsLeft + ' séance(s) sur « ' + m.name + ' ».' : '\nRèglement de la séance au studio.';
    notify(c.id, 'Réservation confirmée : ' + sessionLabel(s),
      'À bientôt au studio, 15 rue Sully, Lyon 6e.' + left +
      '\nAnnulation gratuite jusqu’à ' + db.settings.freeCancelHours + ' h avant le cours. Pensez à vos chaussettes antidérapantes.');
    return { ok: true, status: 'booked', membership: m && membershipId === m.id ? m : null };
  }

  function isNewClient(clientId) {
    return !db.payments.some((p) => p.clientId === clientId && p.status !== 'annulé');
  }

  function cancelBooking(sessionId, clientId, by) {
    const s = byId('sessions', sessionId);
    if (!s) return { ok: false, msg: 'Séance introuvable.' };
    const wi = s.waitlist.findIndex((w) => w.clientId === clientId);
    if (wi > -1) { s.waitlist.splice(wi, 1); commit('Sortie de liste d’attente'); return { ok: true, waitlist: true }; }
    const i = s.bookings.findIndex((b) => b.clientId === clientId);
    if (i < 0) return { ok: false, msg: 'Aucune réservation à annuler.' };
    const b = s.bookings[i];
    const late = by !== 'admin-free' && (new Date(s.start) - new Date()) < db.settings.freeCancelHours * 36e5;
    s.bookings.splice(i, 1);
    delete s.attendance[clientId];
    if (!late) refund(b);
    const c = byId('clients', clientId);
    notify(clientId, 'Annulation : ' + sessionLabel(s), late
      ? 'Votre annulation intervient moins de ' + db.settings.freeCancelHours + ' h avant le cours : la séance est décomptée, conformément aux conditions de vente.'
      : 'Votre séance a été annulée sans frais. Le crédit vous est rendu.');
    const promoted = promote(s);
    commit((c ? c.firstName + ' ' + c.lastName : 'Client') + ' annule ' + sessionLabel(s) + (late ? ' (annulation tardive)' : ''));
    return { ok: true, late, promoted };
  }

  function refund(b) {
    const m = b.membershipId && byId('memberships', b.membershipId);
    if (b.paymentId) {
      const p = byId('payments', b.paymentId);
      if (p && p.status === 'à régler') p.status = 'annulé';
      if (m) m.status = 'annulé';
    } else if (m) m.creditsLeft = Math.min(m.credits, m.creditsLeft + 1);
  }

  function promote(s) {
    const out = [];
    while (placesLeft(s) > 0 && s.waitlist.length) {
      const w = s.waitlist.shift();
      const c = byId('clients', w.clientId);
      if (!c) continue;
      placeBooking(s, c, w.option);
      notify(c.id, 'Une place s’est libérée : ' + sessionLabel(s), 'Vous quittez la liste d’attente et êtes inscrit·e à la séance.');
      out.push(c.id);
    }
    return out;
  }

  /* ---------- API publique ---------- */
  const api = {
    get db() { return db || load(); },
    load, uid, DAY, startOfDay,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset() { db = seed(); persist(); renewSubscriptions(); try { localStorage.removeItem(ME_KEY); } catch (e) {} listeners.forEach((fn) => fn(db)); },
    byId, sessionLabel, canBook, placesLeft, isNewClient,
    activity: (id) => byId('activities', id), coach: (id) => byId('coaches', id),
    offer: (id) => byId('offers', id), client: (id) => byId('clients', id),

    sessionsBetween(from, to, withCancelled) {
      return db.sessions.filter((s) => { const t = new Date(s.start); return t >= from && t < to && (withCancelled || !s.cancelled); })
        .sort((a, b) => new Date(a.start) - new Date(b.start));
    },
    clientByEmail: (email) => db.clients.find((c) => c.email.toLowerCase() === String(email).trim().toLowerCase()) || null,
    memberships: (clientId) => db.memberships.filter((m) => m.clientId === clientId),
    activeMemberships(clientId) {
      const now = new Date();
      return db.memberships.filter((m) => m.clientId === clientId && m.status === 'actif' && (m.kind === 'abo' || new Date(m.end) > now));
    },
    creditsFor(clientId, when) { const m = pickMembership(db, clientId, when || new Date()); return m ? m.creditsLeft : 0; },
    membershipFor: (clientId, when) => pickMembership(db, clientId, when || new Date()),
    bookingsOf(clientId) {
      return db.sessions.filter((s) => s.bookings.some((b) => b.clientId === clientId) || s.waitlist.some((w) => w.clientId === clientId))
        .sort((a, b) => new Date(a.start) - new Date(b.start));
    },
    book, cancelBooking,

    /* Espace client (démo : identification par e-mail, sans mot de passe) */
    me() { try { return byId('clients', localStorage.getItem(ME_KEY)); } catch (e) { return null; } },
    signIn(clientId) { try { localStorage.setItem(ME_KEY, clientId); } catch (e) {} },
    signOut() { try { localStorage.removeItem(ME_KEY); } catch (e) {} },

    upsertClient(data) {
      const email = String(data.email || '').trim().toLowerCase();
      if (!data.firstName || !data.lastName || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, msg: 'Renseignez prénom, nom et une adresse e-mail valide.' };
      const dup = db.clients.find((c) => c.email === email && c.id !== data.id);
      if (dup) return { ok: false, msg: 'Un compte existe déjà avec cette adresse e-mail.' };
      let c = data.id && byId('clients', data.id);
      if (c) Object.assign(c, data, { email });
      else {
        c = Object.assign({ id: uid('u'), createdAt: new Date().toISOString(), notes: '', marketing: false }, data, { email });
        db.clients.push(c);
        notify(c.id, 'Bienvenue chez Inspire Pilates Studio', 'Votre compte est créé. Vous pouvez réserver vos séances jusqu’à 30 jours à l’avance.');
      }
      commit((data.id ? 'Fiche modifiée : ' : 'Nouveau compte : ') + c.firstName + ' ' + c.lastName);
      return { ok: true, client: c };
    },
    // RGPD : anonymise le client, conserve les écritures comptables.
    eraseClient(id) {
      const c = byId('clients', id);
      if (!c) return;
      const now = new Date();
      db.sessions.forEach((s) => {
        if (new Date(s.start) > now) { s.bookings = s.bookings.filter((b) => b.clientId !== id); s.waitlist = s.waitlist.filter((w) => w.clientId !== id); }
      });
      Object.assign(c, { firstName: 'Client', lastName: 'anonymisé', email: 'anonyme-' + id + '@supprime.invalid', phone: '', notes: '', marketing: false, erased: true });
      db.notifications = db.notifications.filter((n) => n.clientId !== id);
      commit('Données personnelles effacées (RGPD) : ' + id);
    },
    exportClient(id) {
      return {
        client: byId('clients', id), forfaits: api.memberships(id), paiements: db.payments.filter((p) => p.clientId === id),
        seances: api.bookingsOf(id).map((s) => ({ seance: sessionLabel(s), presence: s.attendance[id] || null }))
      };
    },

    upsertSession(data) {
      let s = data.id && byId('sessions', data.id);
      if (s) {
        const changedTime = s.start !== data.start;
        Object.assign(s, data);
        s.capacity = Math.max(1, Number(s.capacity) || 1);
        if (changedTime) s.bookings.forEach((b) => notify(b.clientId, 'Changement d’horaire : ' + sessionLabel(s), 'Votre séance a été déplacée par le studio. Votre réservation est conservée.'));
        promote(s);
        commit('Séance modifiée : ' + sessionLabel(s));
      } else {
        s = Object.assign({ id: uid('s'), bookings: [], waitlist: [], attendance: {}, cancelled: false, note: '', duration: 50, capacity: db.settings.defaultCapacity }, data);
        db.sessions.push(s);
        commit('Séance créée : ' + sessionLabel(s));
      }
      return s;
    },
    cancelSession(id) {
      const s = byId('sessions', id);
      if (!s) return;
      s.bookings.forEach((b) => { refund(b); notify(b.clientId, 'Séance annulée par le studio : ' + sessionLabel(s), 'Nous sommes désolés. Votre crédit vous est rendu.'); });
      s.waitlist.forEach((w) => notify(w.clientId, 'Séance annulée par le studio : ' + sessionLabel(s), 'La liste d’attente est close.'));
      s.bookings = []; s.waitlist = []; s.cancelled = true;
      commit('Séance annulée : ' + sessionLabel(s));
    },
    deleteSession(id) {
      const s = byId('sessions', id);
      if (!s) return;
      if (s.bookings.length || s.waitlist.length) api.cancelSession(id);
      db.sessions = db.sessions.filter((x) => x.id !== id);
      commit('Séance supprimée');
    },
    setAttendance(sessionId, clientId, value) {
      const s = byId('sessions', sessionId);
      if (!s) return;
      if (value) s.attendance[clientId] = value; else delete s.attendance[clientId];
      commit();
    },

    sell(clientId, offerId, method, paid) {
      const m = sellInto(db, clientId, offerId, method, paid);
      const c = byId('clients', clientId);
      notify(clientId, 'Votre formule : ' + m.name, paid ? 'Paiement reçu. Merci !' : 'Formule enregistrée. Règlement à effectuer au studio.');
      commit('Vente : ' + m.name + ' à ' + c.firstName + ' ' + c.lastName);
      return m;
    },
    setPayment(id, status, method) {
      const p = byId('payments', id);
      if (!p) return;
      p.status = status; if (method) p.method = method;
      commit('Paiement ' + status + ' : ' + p.label);
    },
    stopMembership(id) {
      const m = byId('memberships', id);
      if (!m) return;
      m.status = 'résilié'; m.stoppedAt = new Date().toISOString();
      commit('Formule résiliée : ' + m.name);
    },
    adjustCredits(id, delta) {
      const m = byId('memberships', id);
      if (!m) return;
      m.creditsLeft = Math.max(0, m.creditsLeft + delta);
      commit('Crédits ajustés (' + (delta > 0 ? '+' : '') + delta + ') : ' + m.name);
    },
    updateOffer(id, patch) { Object.assign(byId('offers', id), patch); commit('Tarif modifié'); },
    upsertCoach(data) {
      let c = data.id && byId('coaches', data.id);
      if (c) Object.assign(c, data); else { c = Object.assign({ id: uid('c'), active: true, photo: '', bio: '' }, data); db.coaches.push(c); }
      commit('Coach enregistré : ' + c.name);
      return c;
    },
    saveSettings(patch) { Object.assign(db.settings, patch); commit('Réglages enregistrés'); }
  };

  load();
  global.IPS = api;
})(window);

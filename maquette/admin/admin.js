/* Back-office Inspire Pilates Studio (maquette fonctionnelle) */
(function () {
  'use strict';
  const S = window.IPS;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const euro = (n) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €';
  const hhmm = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateC = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const jour = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const nom = (c) => c ? c.firstName + ' ' + c.lastName : 'Client supprimé';
  const AUTH = 'ips-demo-admin';
  const vue = $('#vue');

  function toast(msg) {
    const t = $('[data-toast]'); t.textContent = msg; t.classList.add('visible');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('visible'), 3200);
  }

  /* ---------- thème clair / sombre (partagé avec le site) ---------- */
  const racine = document.documentElement;
  const boutonTheme = $('[data-theme-bouton]');
  function majTheme() {
    const sombre = racine.dataset.theme === 'dark';
    boutonTheme.textContent = sombre ? 'Mode clair' : 'Mode sombre';
    boutonTheme.setAttribute('aria-pressed', sombre);
  }
  boutonTheme.addEventListener('click', () => {
    racine.dataset.theme = racine.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('ips-theme', racine.dataset.theme); } catch (e) {}
    majTheme();
  });
  addEventListener('storage', (e) => { if (e.key === 'ips-theme' && e.newValue) { racine.dataset.theme = e.newValue; majTheme(); } });
  majTheme();

  /* ---------- accès ---------- */
  function connecte() { try { return sessionStorage.getItem(AUTH) === '1'; } catch (e) { return false; } }
  function afficherAcces() {
    $('[data-connexion]').hidden = connecte();
    $('[data-app]').hidden = !connecte();
    if (connecte()) route(); else $('#code').focus();
  }
  $('[data-login]').addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('#code').value.trim().toLowerCase() !== 'inspire') { $('[data-err]').textContent = 'Code incorrect. Vérifiez la saisie.'; return; }
    try { sessionStorage.setItem(AUTH, '1'); } catch (er) {}
    afficherAcces();
  });
  $('[data-logout]').addEventListener('click', () => { try { sessionStorage.removeItem(AUTH); } catch (e) {} afficherAcces(); });

  /* ---------- routeur ---------- */
  const VUES = { accueil, planning, clients, paiements, tarifs, coachs, notifications, reglages };
  let vueCourante = 'accueil';
  function route() {
    vueCourante = (location.hash || '#accueil').slice(1);
    if (!VUES[vueCourante]) vueCourante = 'accueil';
    $$('[data-vue]').forEach((a) => { if (a.dataset.vue === vueCourante) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    VUES[vueCourante]();
  }
  addEventListener('hashchange', () => { route(); vue.focus(); });
  S.subscribe(() => { if (connecte()) { VUES[vueCourante](); if (tiroirRefresh) tiroirRefresh(); } });

  /* ---------- tiroir ---------- */
  let tiroirRefresh = null;
  let dernierFocus = null;
  function tiroir(render) {
    const t = $('[data-tiroir]');
    if (t.hidden) dernierFocus = document.activeElement;
    tiroirRefresh = () => { const sc = $('.tiroir__panneau').scrollTop; render($('[data-tiroir-corps]')); $('.tiroir__panneau').scrollTop = sc; };
    render($('[data-tiroir-corps]'));
    t.hidden = false;
    $('.tiroir__fermer').focus();
  }
  function fermerTiroir() {
    $('[data-tiroir]').hidden = true; tiroirRefresh = null;
    if (dernierFocus) dernierFocus.focus();
  }
  $$('[data-fermer-tiroir]').forEach((b) => b.addEventListener('click', fermerTiroir));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('[data-tiroir]').hidden) fermerTiroir(); });

  /* ---------- statistiques ---------- */
  function stats() {
    const db = S.db; const now = new Date();
    const d0 = S.startOfDay(now); const d1 = new Date(d0.getTime() + S.DAY);
    const auj = S.sessionsBetween(d0, d1);
    const sem = S.sessionsBetween(d0, new Date(d0.getTime() + 7 * S.DAY));
    const cap = sem.reduce((a, s) => a + s.capacity, 0);
    const pris = sem.reduce((a, s) => a + s.bookings.length, 0);
    const m0 = new Date(now.getFullYear(), now.getMonth(), 1);
    const ca = db.payments.filter((p) => p.status === 'payé' && new Date(p.date) >= m0).reduce((a, p) => a + p.amount, 0);
    const aRegler = db.payments.filter((p) => p.status === 'à régler');
    const attente = S.sessionsBetween(now, new Date(now.getTime() + 30 * S.DAY)).reduce((a, s) => a + s.waitlist.length, 0);
    return { auj, remplissage: cap ? Math.round(pris / cap * 100) : 0, ca, aRegler, attente, resaAuj: auj.reduce((a, s) => a + s.bookings.length, 0) };
  }

  /* ---------- vue : aujourd'hui ---------- */
  function accueil() {
    const st = stats();
    const now = new Date();
    vue.innerHTML = `<div class="tete"><div><h1>Aujourd’hui</h1><p>${jour(now)}</p></div>
      <div class="outils"><a class="btn btn--clair" href="#planning">Ouvrir le planning</a><button class="btn" type="button" data-nouveau-client>Nouveau client</button></div></div>
      <div class="chiffres">
        <div class="chiffre"><b>${st.auj.length}</b><span>séances aujourd’hui</span></div>
        <div class="chiffre"><b>${st.resaAuj}</b><span>participants attendus</span></div>
        <div class="chiffre"><b>${st.remplissage} %</b><span>de remplissage sur 7 jours</span></div>
        <div class="chiffre"><b>${st.attente}</b><span>personnes en liste d’attente</span></div>
        <div class="chiffre"><b>${euro(st.ca)}</b><span>encaissés ce mois-ci</span></div>
        <div class="chiffre ${st.aRegler.length ? 'chiffre--alerte' : ''}"><b>${st.aRegler.length}</b><span>paiements à régler</span></div>
      </div>
      <div class="grille grille--2">
        <section class="panneau"><h2>Séances du jour</h2>
          ${st.auj.length ? `<ul class="liste">${st.auj.map((s) => `<li><span><span class="heure">${hhmm(s.start)}</span> ${esc(S.activity(s.activityId).name)}<br><small class="doux">${esc((S.coach(s.coachId) || {}).name || '')}, ${s.bookings.length}/${s.capacity} inscrits${s.waitlist.length ? ', ' + s.waitlist.length + ' en attente' : ''}</small></span>
            <button class="btn btn--clair btn--mini" type="button" data-seance="${s.id}">${new Date(s.start) < now ? 'Pointer' : 'Ouvrir'}</button></li>`).join('')}</ul>` : '<p class="vide">Aucune séance aujourd’hui.</p>'}
        </section>
        <section class="panneau"><h2>Dernières actions</h2>
          <ul class="liste journal">${S.db.log.slice(0, 12).map((l) => `<li><time>${new Date(l.at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time>${esc(l.text)}</li>`).join('')}</ul>
        </section>
      </div>`;
    $$('[data-seance]', vue).forEach((b) => b.addEventListener('click', () => ficheSeance(b.dataset.seance)));
    $('[data-nouveau-client]', vue).addEventListener('click', () => ficheClient(null));
  }

  /* ---------- vue : planning ---------- */
  let semaineDebut = (() => { const d = S.startOfDay(new Date()); const k = (d.getDay() + 6) % 7; return new Date(d.getTime() - k * S.DAY); })();
  function planning() {
    const now = new Date();
    const cols = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(semaineDebut.getTime() + i * S.DAY);
      const list = S.sessionsBetween(d, new Date(d.getTime() + S.DAY), true);
      const isAuj = S.startOfDay(now).getTime() === d.getTime();
      cols.push(`<div class="col-jour ${isAuj ? 'auj' : ''}"><header><span class="doux">${d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span><b>${d.getDate()}</b></header>
        <div class="blocs">${list.map((s) => {
          const a = S.activity(s.activityId) || {};
          const pct = Math.round(s.bookings.length / s.capacity * 100);
          return `<button type="button" class="bloc ${s.activityId === 'a-burn' ? 'bloc--burn' : ''} ${s.bookings.length >= s.capacity ? 'bloc--complet' : ''} ${s.cancelled ? 'bloc--annule' : ''} ${new Date(s.start) < now ? 'bloc--passe' : ''}" data-seance="${s.id}">
            <strong>${hhmm(s.start)}</strong>${esc(a.name)}<br><span class="doux">${esc((S.coach(s.coachId) || {}).name || '')}, ${s.cancelled ? 'annulée' : s.bookings.length + '/' + s.capacity}${s.waitlist.length ? ' +' + s.waitlist.length : ''}</span>
            <span class="remplissage"><i style="width:${pct}%"></i></span></button>`;
        }).join('')}</div>
        <button class="ajout" type="button" data-ajout="${d.toISOString()}">Ajouter</button></div>`);
    }
    const fin = new Date(semaineDebut.getTime() + 6 * S.DAY);
    vue.innerHTML = `<div class="tete"><div><h1>Planning</h1><p>Semaine du ${semaineDebut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${fin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
      <div class="outils">
        <button class="btn btn--clair" type="button" data-sem="-1" aria-label="Semaine précédente">‹ Précédente</button>
        <button class="btn btn--clair" type="button" data-sem="0">Cette semaine</button>
        <button class="btn btn--clair" type="button" data-sem="1" aria-label="Semaine suivante">Suivante ›</button>
        <button class="btn btn--clair" type="button" data-dupliquer>Copier sur la semaine suivante</button>
        <button class="btn" type="button" data-ajout="${new Date(Math.max(semaineDebut, S.startOfDay(now))).toISOString()}">Nouvelle séance</button>
      </div></div>
      <div class="semaine">${cols.join('')}</div>
      <p class="petit doux" style="margin-top:1rem">Cliquez sur une séance pour modifier l’horaire, le coach ou la capacité, voir les participants, pointer les présences et gérer la liste d’attente.</p>`;
    $$('[data-sem]', vue).forEach((b) => b.addEventListener('click', () => {
      const v = Number(b.dataset.sem);
      if (v === 0) { const d = S.startOfDay(new Date()); semaineDebut = new Date(d.getTime() - ((d.getDay() + 6) % 7) * S.DAY); }
      else semaineDebut = new Date(semaineDebut.getTime() + v * 7 * S.DAY);
      planning();
    }));
    $$('[data-seance]', vue).forEach((b) => b.addEventListener('click', () => ficheSeance(b.dataset.seance)));
    $$('[data-ajout]', vue).forEach((b) => b.addEventListener('click', () => ficheSeance(null, new Date(b.dataset.ajout))));
    $('[data-dupliquer]', vue).addEventListener('click', () => {
      const src = S.sessionsBetween(semaineDebut, new Date(semaineDebut.getTime() + 7 * S.DAY));
      const dst0 = new Date(semaineDebut.getTime() + 7 * S.DAY);
      const deja = S.sessionsBetween(dst0, new Date(dst0.getTime() + 7 * S.DAY), true).map((s) => s.start + s.activityId);
      let n = 0;
      src.forEach((s) => {
        const start = new Date(new Date(s.start).getTime() + 7 * S.DAY).toISOString();
        if (deja.includes(start + s.activityId)) return;
        S.upsertSession({ activityId: s.activityId, coachId: s.coachId, start, duration: s.duration, capacity: s.capacity }); n++;
      });
      toast(n ? n + ' séances copiées sur la semaine suivante.' : 'La semaine suivante contient déjà ces séances.');
    });
  }

  function optionsClients(exclure) {
    return S.db.clients.filter((c) => !c.erased && !exclure.includes(c.id)).sort((a, b) => a.lastName.localeCompare(b.lastName))
      .map((c) => `<option value="${c.id}">${esc(c.lastName + ' ' + c.firstName)}</option>`).join('');
  }

  function ficheSeance(id, jourDefaut) {
    tiroir((root) => {
      const s = id && S.byId('sessions', id);
      const now = new Date();
      if (id && !s) { root.innerHTML = '<p class="vide">Cette séance a été supprimée.</p>'; return; }
      const d = s ? new Date(s.start) : (() => { const x = new Date(jourDefaut || now); x.setHours(18, 30, 0, 0); return x; })();
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString();
      const passe = s && d < now;
      root.innerHTML = `<h2 id="tiroir-titre">${s ? esc(S.activity(s.activityId).name) : 'Nouvelle séance'}</h2>
        <p class="doux">${s ? jour(s.start) + ', ' + hhmm(s.start) + (s.cancelled ? ' (annulée)' : '') : 'Elle apparaîtra immédiatement sur le planning du site.'}</p>
        <form data-f="seance" class="bloc-tiroir">
          <div class="ligne">
            <div class="champ"><label for="s-act">Cours</label><select id="s-act">${S.db.activities.map((a) => `<option value="${a.id}" ${s && s.activityId === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
            <div class="champ"><label for="s-coach">Coach</label><select id="s-coach">${S.db.coaches.filter((c) => c.active || (s && s.coachId === c.id)).map((c) => `<option value="${c.id}" ${s && s.coachId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
          </div>
          <div class="ligne">
            <div class="champ"><label for="s-date">Date</label><input id="s-date" type="date" value="${local.slice(0, 10)}" required></div>
            <div class="champ"><label for="s-heure">Heure</label><input id="s-heure" type="time" value="${local.slice(11, 16)}" required></div>
            <div class="champ"><label for="s-duree">Durée (min)</label><input id="s-duree" type="number" min="15" step="5" value="${s ? s.duration : 50}"></div>
            <div class="champ"><label for="s-cap">Places</label><input id="s-cap" type="number" min="1" max="30" value="${s ? s.capacity : S.db.settings.defaultCapacity}"></div>
          </div>
          <div class="champ"><label for="s-note">Note interne</label><input id="s-note" value="${esc(s ? s.note : '')}" placeholder="Visible uniquement par l’équipe"></div>
          <p class="erreur" data-err></p>
          <div class="actions"><button class="btn" type="submit">${s ? 'Enregistrer' : 'Créer la séance'}</button>
          ${s && !s.cancelled && !passe ? '<button class="btn btn--danger" type="button" data-annuler-seance>Annuler la séance</button>' : ''}
          ${s ? '<button class="btn btn--danger" type="button" data-supprimer>Supprimer</button>' : ''}</div>
        </form>
        ${s ? `<div class="bloc-tiroir"><h3><span>Participants (${s.bookings.length}/${s.capacity})</span></h3>
          ${s.bookings.length ? `<ul class="liste">${s.bookings.map((b) => {
            const c = S.client(b.clientId); const m = b.membershipId && S.byId('memberships', b.membershipId);
            const p = b.paymentId && S.byId('payments', b.paymentId); const v = s.attendance[b.clientId];
            return `<li><span><button type="button" class="lienbtn" data-client="${b.clientId}" style="background:none;border:0;padding:0;cursor:pointer;text-decoration:underline">${esc(nom(c))}</button><br>
              <small class="doux">${m ? esc(m.name) : 'Sans formule'}${p && p.status === 'à régler' ? ', <span class="pastille pastille--non">' + euro(p.amount) + ' à régler</span>' : ''}</small></span>
              <span class="outils"><span class="pointage" role="group" aria-label="Présence de ${esc(nom(c))}">
                <button type="button" data-pointer="${b.clientId}" data-v="present" aria-pressed="${v === 'present'}">Présent</button>
                <button type="button" data-pointer="${b.clientId}" data-v="absent" aria-pressed="${v === 'absent'}">Absent</button></span>
                ${!passe ? `<button class="btn btn--clair btn--mini" type="button" data-retirer="${b.clientId}">Retirer</button>` : ''}</span></li>`;
          }).join('')}</ul>` : '<p class="doux">Aucun inscrit pour le moment.</p>'}
          ${!s.cancelled ? `<div class="actions" style="margin-top:1rem"><select class="mini" data-ajout-client aria-label="Client à inscrire"><option value="">Inscrire un client…</option>${optionsClients(s.bookings.map((b) => b.clientId).concat(s.waitlist.map((w) => w.clientId)))}</select>
            <button class="btn btn--clair btn--mini" type="button" data-inscrire>Inscrire</button></div>
            <p class="petit doux">Si le client n’a plus de crédit, une séance à l’unité « à régler » est créée. Si le cours est complet, il passe en liste d’attente.</p>` : ''}
        </div>
        <div class="bloc-tiroir"><h3>Liste d’attente (${s.waitlist.length})</h3>
          ${s.waitlist.length ? `<ul class="liste">${s.waitlist.map((w, i) => `<li><span>${i + 1}. ${esc(nom(S.client(w.clientId)))}<br><small class="doux">depuis le ${dateC(w.at)}</small></span>
            <span class="outils"><button class="btn btn--clair btn--mini" type="button" data-sortir="${w.clientId}">Retirer</button></span></li>`).join('')}</ul>
            <p class="petit doux">Dès qu’une place se libère, la première personne est inscrite automatiquement et prévenue par e-mail. Pour inscrire quelqu’un en plus, augmentez le nombre de places.</p>` : '<p class="doux">Personne en attente.</p>'}
        </div>` : ''}`;

      $('[data-f="seance"]', root).addEventListener('submit', (e) => {
        e.preventDefault();
        const date = $('#s-date', root).value; const heure = $('#s-heure', root).value;
        if (!date || !heure) { $('[data-err]', root).textContent = 'Indiquez une date et une heure.'; return; }
        const start = new Date(date + 'T' + heure).toISOString();
        const cap = Number($('#s-cap', root).value);
        if (s && cap < s.bookings.length) { $('[data-err]', root).textContent = `Il y a déjà ${s.bookings.length} inscrits : indiquez au moins ${s.bookings.length} places, ou retirez des participants.`; return; }
        const r = S.upsertSession({ id: s ? s.id : undefined, activityId: $('#s-act', root).value, coachId: $('#s-coach', root).value, start,
          duration: Number($('#s-duree', root).value) || 50, capacity: cap, note: $('#s-note', root).value });
        toast(s ? 'Séance enregistrée. Le site est à jour.' : 'Séance créée. Elle est visible sur le site.');
        if (!s) { id = r.id; tiroirRefresh(); }
      });
      if (!s) return;
      const ann = $('[data-annuler-seance]', root);
      if (ann) ann.addEventListener('click', () => {
        if (!confirm(`Annuler cette séance ? Les ${s.bookings.length} participants et ${s.waitlist.length} personnes en attente seront prévenus par e-mail et recréditées.`)) return;
        S.cancelSession(s.id); toast('Séance annulée. Participants prévenus et recrédités.');
      });
      $('[data-supprimer]', root).addEventListener('click', () => {
        if (!confirm('Supprimer définitivement cette séance du planning ?' + (s.bookings.length ? ' Les participants seront prévenus et recrédités.' : ''))) return;
        S.deleteSession(s.id); fermerTiroir(); toast('Séance supprimée.');
      });
      $$('[data-pointer]', root).forEach((b) => b.addEventListener('click', () => {
        const cur = s.attendance[b.dataset.pointer];
        S.setAttendance(s.id, b.dataset.pointer, cur === b.dataset.v ? null : b.dataset.v);
      }));
      $$('[data-retirer]', root).forEach((b) => b.addEventListener('click', () => {
        const late = (new Date(s.start) - new Date()) < S.db.settings.freeCancelHours * 36e5;
        let mode = 'admin-free';
        if (late && !confirm('Moins de ' + S.db.settings.freeCancelHours + ' h avant le cours. Rendre quand même la séance au client ?\nOK : séance rendue. Annuler : séance décomptée.')) mode = 'admin';
        S.cancelBooking(s.id, b.dataset.retirer, mode);
        toast('Participant retiré.');
      }));
      $$('[data-sortir]', root).forEach((b) => b.addEventListener('click', () => S.cancelBooking(s.id, b.dataset.sortir, 'admin-free')));
      $$('[data-client]', root).forEach((b) => b.addEventListener('click', () => ficheClient(b.dataset.client)));
      const ins = $('[data-inscrire]', root);
      if (ins) ins.addEventListener('click', () => {
        const cid = $('[data-ajout-client]', root).value;
        if (!cid) { toast('Choisissez un client à inscrire.'); return; }
        const r = S.book(s.id, cid, 'credit', 'admin');
        toast(r.ok ? (r.status === 'waitlist' ? 'Cours complet : client ajouté en liste d’attente.' : 'Client inscrit.') : r.msg);
      });
    });
  }

  /* ---------- vue : clients ---------- */
  let filtreClient = '';
  function clients() {
    const now = new Date();
    const q = filtreClient.trim().toLowerCase();
    const list = S.db.clients.filter((c) => !c.erased && (!q || (c.firstName + ' ' + c.lastName + ' ' + c.email + ' ' + c.phone).toLowerCase().includes(q)))
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
    const rows = list.map((c) => {
      const act = S.activeMemberships(c.id);
      const hist = S.bookingsOf(c.id).filter((s) => new Date(s.start) <= now && s.attendance[c.id] === 'present');
      const derniere = hist[hist.length - 1];
      const mois = hist.filter((s) => now - new Date(s.start) < 30 * S.DAY).length;
      const regler = S.db.payments.some((p) => p.clientId === c.id && p.status === 'à régler');
      return `<tr class="cliquable" data-client="${c.id}" tabindex="0"><td><strong style="font-weight:500">${esc(c.lastName)}</strong> ${esc(c.firstName)}</td>
        <td>${esc(c.email)}<br><small class="doux">${esc(c.phone)}</small></td>
        <td>${act.length ? act.map((m) => esc(m.name)).join('<br>') : '<span class="doux">Aucune</span>'}</td>
        <td class="num">${act.reduce((a, m) => a + m.creditsLeft, 0)}</td>
        <td class="num">${mois}</td>
        <td>${derniere ? dateC(derniere.start) : '<span class="doux">Jamais</span>'}</td>
        <td>${regler ? '<span class="pastille pastille--non">À régler</span>' : ''}</td></tr>`;
    }).join('');
    vue.innerHTML = `<div class="tete"><div><h1>Clients</h1><p>${list.length} client${list.length > 1 ? 's' : ''}</p></div>
      <div class="outils"><input class="recherche" type="search" placeholder="Rechercher un nom, un e-mail, un téléphone" value="${esc(filtreClient)}" data-recherche aria-label="Rechercher un client">
      <button class="btn btn--clair" type="button" data-export-csv>Exporter (CSV)</button>
      <button class="btn" type="button" data-nouveau>Nouveau client</button></div></div>
      <div class="table-wrap"><table><thead><tr><th>Nom</th><th>Contact</th><th>Formule active</th><th class="num">Crédits</th><th class="num">Venues 30 j</th><th>Dernière venue</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" class="vide">Aucun client ne correspond. Vérifiez l’orthographe ou créez la fiche.</td></tr>'}</tbody></table></div>`;
    const r = $('[data-recherche]', vue);
    r.addEventListener('input', () => { filtreClient = r.value; const pos = r.selectionStart; clients(); const n = $('[data-recherche]', vue); n.focus(); n.setSelectionRange(pos, pos); });
    $$('[data-client]', vue).forEach((tr) => {
      tr.addEventListener('click', () => ficheClient(tr.dataset.client));
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') ficheClient(tr.dataset.client); });
    });
    $('[data-nouveau]', vue).addEventListener('click', () => ficheClient(null));
    $('[data-export-csv]', vue).addEventListener('click', () => {
      const lignes = [['Nom', 'Prénom', 'E-mail', 'Téléphone', 'Inscrit le', 'Accepte les offres']].concat(list.map((c) => [c.lastName, c.firstName, c.email, c.phone, dateC(c.createdAt), c.marketing ? 'oui' : 'non']));
      telecharger('clients-inspire.csv', lignes.map((l) => l.map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(';')).join('\n'), 'text/csv');
    });
  }

  function telecharger(nomFichier, contenu, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + contenu], { type: type + ';charset=utf-8' }));
    a.download = nomFichier; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function ficheClient(id) {
    tiroir((root) => {
      const c = id && S.client(id);
      const now = new Date();
      const seances = c ? S.bookingsOf(c.id) : [];
      const futur = seances.filter((s) => new Date(s.start) > now && !s.cancelled);
      const passe = seances.filter((s) => new Date(s.start) <= now && s.bookings.some((b) => b.clientId === c.id)).reverse();
      const presents = passe.filter((s) => s.attendance[c.id] === 'present').length;
      const absents = passe.filter((s) => s.attendance[c.id] === 'absent').length;
      const forfaits = c ? S.memberships(c.id).sort((a, b) => new Date(b.start) - new Date(a.start)) : [];
      const pay = c ? S.db.payments.filter((p) => p.clientId === c.id).sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
      root.innerHTML = `<h2 id="tiroir-titre">${c ? esc(nom(c)) : 'Nouveau client'}</h2>
        <p class="doux">${c ? 'Client depuis le ' + dateC(c.createdAt) + (passe.length ? `, ${presents} présence${presents > 1 ? 's' : ''}, ${absents} absence${absents > 1 ? 's' : ''}` : '') : 'Le client pourra ensuite réserver depuis le site avec son e-mail.'}</p>
        <form data-f="client" class="bloc-tiroir">
          <div class="ligne"><div class="champ"><label for="k-prenom">Prénom</label><input id="k-prenom" value="${esc(c ? c.firstName : '')}" required></div>
          <div class="champ"><label for="k-nom">Nom</label><input id="k-nom" value="${esc(c ? c.lastName : '')}" required></div></div>
          <div class="ligne"><div class="champ"><label for="k-email">E-mail</label><input id="k-email" type="email" value="${esc(c ? c.email : '')}" required></div>
          <div class="champ"><label for="k-tel">Téléphone</label><input id="k-tel" type="tel" value="${esc(c ? c.phone : '')}"></div></div>
          <div class="champ"><label for="k-notes">Notes (santé signalée, préférences…)</label><textarea id="k-notes">${esc(c ? c.notes : '')}</textarea></div>
          <label class="case"><input type="checkbox" id="k-mkt" ${c && c.marketing ? 'checked' : ''}> Accepte de recevoir les offres et évènements</label>
          <p class="erreur" data-err></p>
          <button class="btn" type="submit">${c ? 'Enregistrer' : 'Créer la fiche'}</button>
        </form>
        ${c ? `<div class="bloc-tiroir"><h3>Formules</h3>
          ${forfaits.length ? forfaits.map((m) => `<div class="forfait"><span>${m.status === 'actif' ? `<b>${m.creditsLeft}</b>` : ''}${esc(m.name)}<br>
            <small class="doux">Depuis le ${dateC(m.start)}, ${m.kind === 'abo' ? (m.status === 'actif' ? 'prochain renouvellement le ' + dateC(m.cycleEnd) : m.status) + (m.engagementEnd ? ', engagement jusqu’au ' + dateC(m.engagementEnd) : '') : 'valable jusqu’au ' + dateC(m.end)}</small></span>
            <span class="outils">${m.status === 'actif' ? `<button class="btn btn--clair btn--mini" type="button" data-credit="${m.id}" data-d="-1" aria-label="Retirer un crédit">−1</button><button class="btn btn--clair btn--mini" type="button" data-credit="${m.id}" data-d="1" aria-label="Ajouter un crédit">+1</button>
            ${m.kind === 'abo' ? `<button class="btn btn--danger btn--mini" type="button" data-resilier="${m.id}">Résilier</button>` : ''}` : `<span class="pastille">${esc(m.status)}</span>`}</span></div>`).join('') : '<p class="doux">Aucune formule.</p>'}
          <div class="actions"><select class="mini" data-vente-offre aria-label="Formule à vendre">${S.db.offers.filter((o) => o.active).map((o) => `<option value="${o.id}">${esc(o.name)} (${euro(o.price)})</option>`).join('')}</select>
            <select class="mini" data-vente-moyen aria-label="Moyen de paiement"><option>CB</option><option>Sans contact</option><option>SEPA</option><option>Espèces</option><option>Chèque</option></select>
            <label class="case" style="margin:0"><input type="checkbox" data-vente-paye checked> Payé</label>
            <button class="btn btn--mini" type="button" data-vendre>Vendre</button></div>
        </div>
        <div class="bloc-tiroir"><h3>Séances à venir (${futur.length})</h3>
          ${futur.length ? `<ul class="liste">${futur.map((s) => { const w = s.waitlist.findIndex((x) => x.clientId === c.id);
            return `<li><span>${jour(s.start)}, ${hhmm(s.start)}<br><small class="doux">${esc(S.activity(s.activityId).name)}</small></span>
            <span class="outils">${w > -1 ? `<span class="pastille">Attente n°${w + 1}</span>` : '<span class="pastille pastille--ok">Inscrit</span>'}<button class="btn btn--clair btn--mini" type="button" data-seance="${s.id}">Ouvrir</button></span></li>`; }).join('')}</ul>` : '<p class="doux">Aucune réservation à venir.</p>'}
        </div>
        <div class="bloc-tiroir"><h3>Historique de fréquentation</h3>
          ${passe.length ? `<ul class="liste">${passe.slice(0, 20).map((s) => { const v = s.attendance[c.id];
            return `<li><span>${dateC(s.start)}, ${hhmm(s.start)}<br><small class="doux">${esc(S.activity(s.activityId).name)}, ${esc((S.coach(s.coachId) || {}).name || '')}</small></span>
            <span class="pastille ${v === 'present' ? 'pastille--ok' : v === 'absent' ? 'pastille--non' : ''}">${v === 'present' ? 'Présent' : v === 'absent' ? 'Absent' : 'Non pointé'}</span></li>`; }).join('')}</ul>` : '<p class="doux">Aucune séance passée.</p>'}
        </div>
        <div class="bloc-tiroir"><h3>Paiements</h3>
          ${pay.length ? `<ul class="liste">${pay.map((p) => `<li><span>${esc(p.label)}<br><small class="doux">${dateC(p.date)}, ${esc(p.method)}</small></span>
            <span class="outils">${euro(p.amount)} <span class="pastille ${p.status === 'payé' ? 'pastille--ok' : p.status === 'à régler' ? 'pastille--non' : ''}">${esc(p.status)}</span>
            ${p.status === 'à régler' ? `<button class="btn btn--mini" type="button" data-encaisser="${p.id}">Encaisser</button>` : ''}</span></li>`).join('')}</ul>` : '<p class="doux">Aucun paiement.</p>'}
        </div>
        <div class="bloc-tiroir"><h3>Données personnelles (RGPD)</h3>
          <div class="actions"><button class="btn btn--clair btn--mini" type="button" data-export>Exporter ses données</button>
          <button class="btn btn--danger btn--mini" type="button" data-effacer>Effacer ses données</button></div>
          <p class="petit doux">L’effacement anonymise la fiche et annule les réservations à venir. Les paiements restent conservés pour la comptabilité.</p>
        </div>` : ''}`;

      $('[data-f="client"]', root).addEventListener('submit', (e) => {
        e.preventDefault();
        const r = S.upsertClient({ id: c ? c.id : undefined, firstName: $('#k-prenom', root).value.trim(), lastName: $('#k-nom', root).value.trim(),
          email: $('#k-email', root).value, phone: $('#k-tel', root).value.trim(), notes: $('#k-notes', root).value, marketing: $('#k-mkt', root).checked });
        if (!r.ok) { $('[data-err]', root).textContent = r.msg; return; }
        toast(c ? 'Fiche enregistrée.' : 'Fiche créée.');
        if (!c) { id = r.client.id; tiroirRefresh(); }
      });
      if (!c) return;
      $$('[data-credit]', root).forEach((b) => b.addEventListener('click', () => S.adjustCredits(b.dataset.credit, Number(b.dataset.d))));
      $$('[data-resilier]', root).forEach((b) => b.addEventListener('click', () => {
        const m = S.byId('memberships', b.dataset.resilier);
        const eng = m.engagementEnd && new Date(m.engagementEnd) > new Date();
        if (!confirm((eng ? 'Attention : engagement en cours jusqu’au ' + dateC(m.engagementEnd) + '. Résiliation anticipée uniquement sur justificatif.\n\n' : '') + 'Résilier « ' + m.name + ' » ? Plus aucun prélèvement ne sera effectué.')) return;
        S.stopMembership(m.id); toast('Formule résiliée.');
      }));
      $('[data-vendre]', root).addEventListener('click', () => {
        const off = S.offer($('[data-vente-offre]', root).value);
        if (off.newOnly && !S.isNewClient(c.id) && !confirm('Cette offre est réservée aux nouveaux clients. Vendre quand même ?')) return;
        S.sell(c.id, off.id, $('[data-vente-moyen]', root).value, $('[data-vente-paye]', root).checked);
        toast('Vente enregistrée : ' + off.name + '.');
      });
      $$('[data-seance]', root).forEach((b) => b.addEventListener('click', () => ficheSeance(b.dataset.seance)));
      $$('[data-encaisser]', root).forEach((b) => b.addEventListener('click', () => { S.setPayment(b.dataset.encaisser, 'payé', 'Au studio'); toast('Paiement encaissé.'); }));
      $('[data-export]', root).addEventListener('click', () => telecharger('donnees-' + c.lastName.toLowerCase() + '.json', JSON.stringify(S.exportClient(c.id), null, 2), 'application/json'));
      $('[data-effacer]', root).addEventListener('click', () => {
        if (!confirm('Effacer définitivement les données personnelles de ' + nom(c) + ' ? Cette action est irréversible.')) return;
        S.eraseClient(c.id); fermerTiroir(); toast('Données effacées.');
      });
    });
  }

  /* ---------- vue : paiements ---------- */
  let filtrePay = 'tous';
  function paiements() {
    const db = S.db; const now = new Date();
    const m0 = new Date(now.getFullYear(), now.getMonth(), 1);
    const list = db.payments.filter((p) => filtrePay === 'tous' || p.status === filtrePay).sort((a, b) => new Date(b.date) - new Date(a.date));
    const mois = db.payments.filter((p) => new Date(p.date) >= m0 && p.status === 'payé');
    const parMoyen = {};
    mois.forEach((p) => { parMoyen[p.method] = (parMoyen[p.method] || 0) + p.amount; });
    const aRegler = db.payments.filter((p) => p.status === 'à régler');
    const abos = db.memberships.filter((m) => m.kind === 'abo' && m.status === 'actif');
    vue.innerHTML = `<div class="tete"><div><h1>Ventes et paiements</h1><p>${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p></div>
      <div class="outils"><select class="mini" data-filtre aria-label="Filtrer par statut">
        ${['tous', 'payé', 'à régler', 'annulé'].map((v) => `<option value="${v}" ${v === filtrePay ? 'selected' : ''}>${v === 'tous' ? 'Tous les paiements' : v[0].toUpperCase() + v.slice(1)}</option>`).join('')}</select>
        <button class="btn btn--clair" type="button" data-csv>Exporter pour la comptabilité (CSV)</button></div></div>
      <div class="chiffres">
        <div class="chiffre"><b>${euro(mois.reduce((a, p) => a + p.amount, 0))}</b><span>encaissés ce mois-ci</span></div>
        <div class="chiffre ${aRegler.length ? 'chiffre--alerte' : ''}"><b>${euro(aRegler.reduce((a, p) => a + p.amount, 0))}</b><span>à régler (${aRegler.length})</span></div>
        <div class="chiffre"><b>${abos.length}</b><span>abonnements actifs</span></div>
        <div class="chiffre"><b>${euro(abos.reduce((a, m) => a + ((S.offer(m.offerId) || {}).price || 0), 0))}</b><span>de prélèvements mensuels prévus</span></div>
      </div>
      <p class="petit doux">Ce mois-ci : ${Object.keys(parMoyen).map((k) => esc(k) + ' ' + euro(parMoyen[k])).join(', ') || 'aucun encaissement'}.</p>
      <div class="table-wrap"><table><thead><tr><th>Date</th><th>Client</th><th>Libellé</th><th>Moyen</th><th class="num">Montant</th><th>Statut</th><th></th></tr></thead>
      <tbody>${list.slice(0, 200).map((p) => `<tr><td>${dateC(p.date)}</td><td><button type="button" data-client="${p.clientId}" style="background:none;border:0;padding:0;cursor:pointer;text-decoration:underline">${esc(nom(S.client(p.clientId)))}</button></td>
        <td>${esc(p.label)}</td><td>${esc(p.method)}</td><td class="num">${euro(p.amount)}</td>
        <td><span class="pastille ${p.status === 'payé' ? 'pastille--ok' : p.status === 'à régler' ? 'pastille--non' : ''}">${esc(p.status)}</span></td>
        <td>${p.status === 'à régler' ? `<select class="mini" data-moyen="${p.id}" aria-label="Moyen"><option>CB</option><option>Sans contact</option><option>Espèces</option><option>Chèque</option></select> <button class="btn btn--mini" type="button" data-encaisser="${p.id}">Encaisser</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="7" class="vide">Aucun paiement pour ce filtre.</td></tr>'}</tbody></table></div>
      <p class="petit doux" style="margin-top:1rem">En production : paiement en ligne par carte et mandats SEPA via un prestataire sécurisé (Stripe), factures envoyées automatiquement. Aucune donnée bancaire n’est stockée sur le site.</p>`;
    $('[data-filtre]', vue).addEventListener('change', (e) => { filtrePay = e.target.value; paiements(); });
    $$('[data-encaisser]', vue).forEach((b) => b.addEventListener('click', () => { S.setPayment(b.dataset.encaisser, 'payé', $(`[data-moyen="${b.dataset.encaisser}"]`, vue).value); toast('Paiement encaissé.'); }));
    $$('[data-client]', vue).forEach((b) => b.addEventListener('click', () => ficheClient(b.dataset.client)));
    $('[data-csv]', vue).addEventListener('click', () => {
      const lignes = [['Date', 'Client', 'Libellé', 'Moyen', 'Montant', 'Statut']].concat(list.map((p) => [dateC(p.date), nom(S.client(p.clientId)), p.label, p.method, String(p.amount).replace('.', ','), p.status]));
      telecharger('paiements-inspire.csv', lignes.map((l) => l.map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(';')).join('\n'), 'text/csv');
    });
  }

  /* ---------- vue : tarifs ---------- */
  function tarifs() {
    const cats = { unite: 'Séance à l’unité', decouverte: 'Découverte (nouveaux clients)', sans: 'Abonnements sans engagement', avec: 'Abonnements avec engagement 12 mois', pack: 'Packs', cadeau: 'Cartes cadeaux' };
    vue.innerHTML = `<div class="tete"><div><h1>Tarifs</h1><p>Les prix modifiés ici s’affichent aussitôt sur le site (accueil, tarifs, conditions de vente).</p></div></div>
      ${Object.keys(cats).map((k) => `<h2 style="margin:1.6rem 0 .6rem">${cats[k]}</h2><div class="table-wrap"><table><thead><tr><th>Formule</th><th class="num">Séances</th><th class="num">Validité</th><th class="num">Prix</th><th>En vente</th></tr></thead><tbody>
        ${S.db.offers.filter((o) => o.cat === k).map((o) => `<tr><td>${esc(o.name)}</td><td class="num">${o.credits}${o.kind === 'abo' ? ' / mois' : ''}</td><td class="num">${o.kind === 'abo' ? (o.engagement ? '12 mois ferme' : 'mensuel') : o.validity + ' mois'}</td>
          <td class="num"><input class="prix" type="number" min="0" step="1" value="${o.price}" data-prix="${o.id}" aria-label="Prix de ${esc(o.name)}"> €</td>
          <td><label class="case" style="margin:0"><input type="checkbox" data-actif="${o.id}" ${o.active ? 'checked' : ''}> ${o.active ? 'Oui' : 'Non'}</label></td></tr>`).join('')}</tbody></table></div>`).join('')}`;
    $$('[data-prix]', vue).forEach((i) => i.addEventListener('change', () => {
      const v = Number(i.value);
      if (!(v >= 0)) { toast('Saisissez un prix positif.'); return; }
      S.updateOffer(i.dataset.prix, { price: v }); toast('Prix enregistré. Le site est à jour.');
    }));
    $$('[data-actif]', vue).forEach((i) => i.addEventListener('change', () => { S.updateOffer(i.dataset.actif, { active: i.checked }); toast(i.checked ? 'Formule remise en vente.' : 'Formule retirée de la vente.'); }));
  }

  /* ---------- vue : coachs ---------- */
  function coachs() {
    const now = new Date();
    vue.innerHTML = `<div class="tete"><div><h1>Coachs</h1><p>Présentations affichées sur la page « Le studio ».</p></div><button class="btn" type="button" data-nouveau>Ajouter un coach</button></div>
      <div class="table-wrap"><table><thead><tr><th>Coach</th><th class="num">Cours sur 30 jours</th><th>Présentation</th><th>Actif</th><th></th></tr></thead><tbody>
      ${S.db.coaches.map((c) => `<tr><td><strong style="font-weight:500">${esc(c.name)}</strong></td>
        <td class="num">${S.sessionsBetween(now, new Date(now.getTime() + 30 * S.DAY)).filter((s) => s.coachId === c.id).length}</td>
        <td>${c.bio ? '<span class="pastille pastille--ok">Rédigée</span>' : '<span class="pastille">À rédiger</span>'}</td>
        <td>${c.active ? 'Oui' : 'Non'}</td><td><button class="btn btn--clair btn--mini" type="button" data-coach="${c.id}">Modifier</button></td></tr>`).join('')}</tbody></table></div>`;
    $$('[data-coach]', vue).forEach((b) => b.addEventListener('click', () => ficheCoach(b.dataset.coach)));
    $('[data-nouveau]', vue).addEventListener('click', () => ficheCoach(null));
  }
  function ficheCoach(id) {
    tiroir((root) => {
      const c = id && S.coach(id);
      root.innerHTML = `<h2 id="tiroir-titre">${c ? esc(c.name) : 'Nouveau coach'}</h2>
        <form data-f="coach" class="bloc-tiroir">
          <div class="champ"><label for="co-nom">Prénom</label><input id="co-nom" value="${esc(c ? c.name : '')}" required></div>
          <div class="champ"><label for="co-photo">Photo (nom du fichier)</label><input id="co-photo" value="${esc(c ? c.photo : '')}" placeholder="coach-prenom.webp"></div>
          <div class="champ"><label for="co-bio">Présentation (un paragraphe par ligne)</label><textarea id="co-bio" rows="10">${esc(c ? c.bio : '')}</textarea></div>
          <label class="case"><input type="checkbox" id="co-actif" ${!c || c.active ? 'checked' : ''}> Affiché sur le site et disponible au planning</label>
          <p class="erreur" data-err></p>
          <button class="btn" type="submit">Enregistrer</button>
        </form>`;
      $('[data-f="coach"]', root).addEventListener('submit', (e) => {
        e.preventDefault();
        const n = $('#co-nom', root).value.trim();
        if (!n) { $('[data-err]', root).textContent = 'Indiquez le prénom du coach.'; return; }
        S.upsertCoach({ id: c ? c.id : undefined, name: n, photo: $('#co-photo', root).value.trim(), bio: $('#co-bio', root).value, active: $('#co-actif', root).checked });
        fermerTiroir(); toast('Coach enregistré. Le site est à jour.');
      });
    });
  }

  /* ---------- vue : e-mails ---------- */
  function notifications() {
    const list = S.db.notifications.slice(0, 80);
    vue.innerHTML = `<div class="tete"><div><h1>E-mails envoyés</h1><p>Confirmations, annulations, listes d’attente et changements d’horaire, déclenchés automatiquement.</p></div></div>
      <p class="petit doux">Démo : les e-mails sont enregistrés ici sans être envoyés. En production, ils partent via un service d’envoi (Brevo ou SMTP de l’hébergeur), avec un rappel la veille du cours.</p>
      ${list.length ? list.map((n) => `<div class="mail"><div class="outils" style="justify-content:space-between"><strong style="font-weight:500">${esc(n.subject)}</strong><small class="doux">${new Date(n.at).toLocaleString('fr-FR')}</small></div>
        <small class="doux">À : ${esc(n.to)}</small><p>${esc(n.body)}</p></div>`).join('') : '<p class="vide">Aucun e-mail pour le moment. Faites une réservation sur le site pour voir la confirmation apparaître ici.</p>'}`;
  }

  /* ---------- vue : réglages ---------- */
  function reglages() {
    const st = S.db.settings;
    const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const h = jours.map((d) => (st.hours.find((x) => x.day === d) || { day: d, text: '' }));
    vue.innerHTML = `<div class="tete"><div><h1>Réglages</h1><p>Règles de réservation, horaires et annonce du site.</p></div></div>
      <form data-f="reglages" class="grille grille--2">
        <section class="panneau"><h2>Réservations</h2><p class="petit doux">Valeurs issues des conditions générales de vente.</p>
          <div class="ligne">
            <div class="champ"><label for="g-fen">Réservation ouverte (jours avant)</label><input id="g-fen" type="number" min="1" value="${st.bookingWindowDays}"></div>
            <div class="champ"><label for="g-min">Fermeture (minutes avant)</label><input id="g-min" type="number" min="0" value="${st.minBeforeMinutes}"></div>
            <div class="champ"><label for="g-ann">Annulation gratuite (heures avant)</label><input id="g-ann" type="number" min="0" value="${st.freeCancelHours}"></div>
            <div class="champ"><label for="g-cap">Places par défaut</label><input id="g-cap" type="number" min="1" value="${st.defaultCapacity}"></div>
          </div>
          <h2 style="margin-top:1rem">Annonce en haut du site</h2>
          <label class="case"><input type="checkbox" id="g-on" ${st.announcement.on ? 'checked' : ''}> Afficher l’annonce (et le bloc retraite de l’accueil)</label>
          <div class="champ"><label for="g-txt">Texte</label><input id="g-txt" value="${esc(st.announcement.text)}"></div>
          <div class="champ"><label for="g-lien">Lien</label><input id="g-lien" value="${esc(st.announcement.link)}"></div>
        </section>
        <section class="panneau"><h2>Horaires d’ouverture</h2><p class="petit doux">Laissez vide pour afficher « ouvert aux horaires des cours ».</p>
          ${h.map((x, i) => `<div class="champ"><label for="g-h${i}">${x.day}</label><input id="g-h${i}" data-jour="${x.day}" value="${esc(x.text)}" placeholder="ex. 7h - 21h"></div>`).join('')}
        </section>
        <div><button class="btn" type="submit">Enregistrer les réglages</button></div>
      </form>
      <section class="panneau" style="margin-top:2rem"><h2>Données de démonstration</h2>
        <p class="doux">Remet le planning, les clients et les paiements fictifs à zéro, dans ce navigateur.</p>
        <button class="btn btn--danger" type="button" data-reset>Réinitialiser la démo</button></section>`;
    $('[data-f="reglages"]', vue).addEventListener('submit', (e) => {
      e.preventDefault();
      S.saveSettings({
        bookingWindowDays: Number($('#g-fen').value), minBeforeMinutes: Number($('#g-min').value), freeCancelHours: Number($('#g-ann').value),
        defaultCapacity: Number($('#g-cap').value),
        announcement: { on: $('#g-on').checked, text: $('#g-txt').value.trim(), link: $('#g-lien').value.trim() },
        hours: $$('[data-jour]', vue).map((i) => ({ day: i.dataset.jour, text: i.value.trim() }))
      });
      toast('Réglages enregistrés. Le site est à jour.');
    });
    $('[data-reset]', vue).addEventListener('click', () => { if (confirm('Réinitialiser toutes les données de démonstration ?')) { S.reset(); toast('Démo réinitialisée.'); } });
  }

  afficherAcces();
})();

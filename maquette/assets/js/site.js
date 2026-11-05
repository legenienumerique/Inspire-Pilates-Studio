/* Inspire Pilates Studio — interactions du site public */
(function () {
  'use strict';
  const S = window.IPS;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const euro = (n) => (Number(n) % 1 ? Number(n).toFixed(2).replace('.', ',') : Number(n)) + ' €';
  const hhmm = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const jourLong = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const params = new URLSearchParams(location.search);

  /* ---------- thème clair / sombre (partagé avec le back-office) ---------- */
  const racine = document.documentElement;
  function majTheme() {
    const sombre = racine.dataset.theme === 'dark';
    $$('[data-theme-bouton]').forEach((b) => {
      b.setAttribute('aria-label', sombre ? 'Activer le mode clair' : 'Activer le mode sombre');
      b.setAttribute('aria-pressed', sombre);
    });
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = sombre ? '#1b1815' : '#ece7e1';
  }
  $$('[data-theme-bouton]').forEach((b) => b.addEventListener('click', () => {
    racine.dataset.theme = racine.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('ips-theme', racine.dataset.theme); } catch (e) {}
    majTheme();
  }));
  addEventListener('storage', (e) => { if (e.key === 'ips-theme' && e.newValue) { racine.dataset.theme = e.newValue; majTheme(); } });
  majTheme();

  /* ---------- en-tête ---------- */
  const burger = $('.burger');
  const nav = $('#nav');
  if (burger) burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    nav.classList.toggle('ouvert', open);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav && nav.classList.contains('ouvert')) burger.click(); });
  const entete = $('.entete');
  addEventListener('scroll', () => entete && entete.classList.toggle('defile', scrollY > 10), { passive: true });

  function toast(msg) {
    const t = $('[data-toast]');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('visible');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('visible'), 3800);
  }

  /* ---------- contenus pilotés par le back-office ---------- */
  function renderShared() {
    const db = S.db;
    const a = db.settings.announcement;
    const band = $('[data-bandeau]');
    if (band) {
      band.hidden = !(a && a.on && a.text);
      if (!band.hidden) band.innerHTML = a.link ? `<a href="${esc(a.link)}">${esc(a.text)}</a>` : esc(a.text);
    }
    $$('[data-retraite]').forEach((el) => { el.hidden = !(a && a.on); });
    $$('[data-prix]').forEach((el) => { const o = S.offer(el.dataset.prix); if (o) el.textContent = euro(o.price); });
    const me = S.me();
    $$('[data-compte-lien]').forEach((el) => { el.textContent = me ? me.firstName : 'Mon espace'; });
    const h = $('[data-horaires]');
    if (h && db.settings.hours && db.settings.hours.some((x) => x.text)) {
      h.innerHTML = db.settings.hours.filter((x) => x.text).map((x) => `${esc(x.day)} : ${esc(x.text)}`).join('<br>');
    }
  }

  /* ---------- planning ---------- */
  const filtres = { cours: params.get('cours') || '', coach: params.get('coach') || '' };

  function initFiltres() {
    const fc = $('[data-filtre="cours"]');
    const fk = $('[data-filtre="coach"]');
    if (!fc) return;
    S.db.activities.filter((a) => !a.private).forEach((a) => fc.add(new Option(a.name, a.id)));
    S.db.coaches.filter((c) => c.active).forEach((c) => fk.add(new Option(c.name, c.id)));
    fc.value = filtres.cours; fk.value = filtres.coach;
    [fc, fk].forEach((el) => el.addEventListener('change', () => { filtres[el.dataset.filtre] = el.value; renderPlanning(); }));
  }

  const planState = new WeakMap();

  function renderPlanning() {
    $$('[data-planning]').forEach((root) => {
      const nbJours = Number(root.dataset.jours) || 7;
      const max = Number(root.dataset.max) || 0;
      const today = S.startOfDay(new Date());
      let sel = planState.get(root);
      if (sel == null) {
        // premier jour qui a encore des séances réservables
        sel = 0;
        for (let i = 0; i < nbJours; i++) {
          const d0 = new Date(today.getTime() + i * S.DAY);
          if (S.sessionsBetween(d0, new Date(d0.getTime() + S.DAY)).some((s) => new Date(s.start) > new Date())) { sel = i; break; }
        }
        planState.set(root, sel);
      }
      const jours = [];
      for (let i = 0; i < nbJours; i++) {
        const d = new Date(today.getTime() + i * S.DAY);
        jours.push(`<button type="button" class="jour" data-i="${i}" aria-pressed="${i === sel}" aria-label="${jourLong(d)}">
          <small>${i === 0 ? 'Auj.' : d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</small>
          <b>${d.getDate()}</b><small>${d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</small></button>`);
      }
      const d0 = new Date(today.getTime() + sel * S.DAY);
      let list = S.sessionsBetween(d0, new Date(d0.getTime() + S.DAY))
        .filter((s) => !S.activity(s.activityId) || !S.activity(s.activityId).private)
        .filter((s) => (!filtres.cours || s.activityId === filtres.cours) && (!filtres.coach || s.coachId === filtres.coach));
      if (sel === 0) list = list.filter((s) => new Date(s.start) > new Date());
      if (max) list = list.slice(0, max);
      const me = S.me();
      const rows = list.map((s) => {
        const a = S.activity(s.activityId) || { name: 'Cours' };
        const c = S.coach(s.coachId);
        const left = S.placesLeft(s);
        const mine = me && s.bookings.some((b) => b.clientId === me.id);
        const waiting = me && s.waitlist.some((w) => w.clientId === me.id);
        const chk = S.canBook(s);
        const jauge = Array.from({ length: s.capacity }, (_, i) => `<i class="${i < s.bookings.length ? '' : 'libre'}"></i>`).join('');
        let label = left ? 'Réserver' : 'Liste d’attente';
        if (mine) label = 'Réservé';
        if (waiting) label = 'En attente';
        const txt = left ? `${left} place${left > 1 ? 's' : ''}` : 'Complet' + (s.waitlist.length ? `, ${s.waitlist.length} en attente` : '');
        return `<li class="seance${left ? '' : ' seance--complet'}">
          <div class="seance__heure">${hhmm(s.start)}<small>${s.duration} min</small></div>
          <div class="seance__info"><strong>${esc(a.name)}</strong><span>avec ${esc(c ? c.name : 'l’équipe')}</span></div>
          <div class="seance__places"><span class="jauge" aria-hidden="true">${jauge}</span><span>${txt}</span></div>
          <button class="btn${left && !mine && !waiting ? '' : ' btn--clair'}" type="button" data-reserver="${s.id}" ${!chk.ok || mine || waiting ? 'disabled' : ''}
            title="${esc(chk.ok ? '' : chk.reason)}" aria-label="${label}, ${esc(a.name)} à ${hhmm(s.start)}">${label}</button>
        </li>`;
      }).join('');
      root.innerHTML = `<div class="jours" role="group" aria-label="Choisir un jour">${jours.join('')}</div>
        <h3 class="sr" aria-live="polite">${jourLong(d0)}</h3>
        ${rows ? `<ul class="seances">${rows}</ul>` : `<p class="vide">Aucune séance ${filtres.cours || filtres.coach ? 'pour ces filtres ' : ''}ce jour-là. Choisissez un autre jour.</p>`}`;
      $$('.jour', root).forEach((b) => b.addEventListener('click', () => {
        planState.set(root, Number(b.dataset.i)); renderPlanning();
        const p = $(`.jour[data-i="${b.dataset.i}"]`, root); if (p) p.focus();
      }));
      $$('[data-reserver]', root).forEach((b) => b.addEventListener('click', () => ouvrirReservation(b.dataset.reserver)));
    });
  }

  /* ---------- fenêtre de réservation ---------- */
  let dlg = null;
  function fenetre(html) {
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.className = 'fenetre';
      dlg.setAttribute('aria-labelledby', 'fen-titre');
      document.body.appendChild(dlg);
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    }
    dlg.innerHTML = `<button class="fenetre__fermer" type="button" aria-label="Fermer" data-fermer>×</button><div class="fenetre__corps">${html}</div>`;
    $('[data-fermer]', dlg).addEventListener('click', () => dlg.close());
    if (!dlg.open) dlg.showModal();
    const f = $('input, select, button:not([data-fermer])', dlg); if (f) f.focus();
    return dlg;
  }

  function recap(s) {
    const a = S.activity(s.activityId); const c = S.coach(s.coachId);
    return `<div class="recap-seance"><strong>${esc(a ? a.name : 'Cours')}</strong>${jourLong(s.start)}, ${hhmm(s.start)}, avec ${esc(c ? c.name : 'l’équipe')}</div>`;
  }

  function ouvrirReservation(id) {
    const s = S.byId('sessions', id);
    if (!s) { toast('Cette séance n’est plus disponible. Le planning a été actualisé.'); renderAll(); return; }
    const me = S.me();
    if (me) return etapeChoix(s, me);
    fenetre(`<h2 id="fen-titre">Réserver</h2>${recap(s)}
      <form data-f="email" novalidate>
        <div class="champ"><label for="r-email">Votre adresse e-mail</label><input id="r-email" type="email" autocomplete="email" required></div>
        <p class="erreur" data-err></p>
        <div class="actions"><button class="btn" type="submit">Continuer</button></div>
        <p class="petit doux" style="text-align:center;margin:1rem auto 0">Démo : essayez <button type="button" class="lien" style="background:none;border:0;padding:0;cursor:pointer;text-decoration:underline" data-exemple>chloe.martin@exemple.fr</button> (cliente avec abonnement) ou une nouvelle adresse.</p>
      </form>`);
    $('[data-exemple]', dlg).addEventListener('click', () => { $('#r-email', dlg).value = 'chloe.martin@exemple.fr'; });
    $('[data-f="email"]', dlg).addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#r-email', dlg).value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $('[data-err]', dlg).textContent = 'Saisissez une adresse e-mail valide, par exemple prenom@domaine.fr.'; return; }
      const c = S.clientByEmail(email);
      if (c) { S.signIn(c.id); renderAll(); etapeChoix(s, c); } else etapeCompte(s, email);
    });
  }

  function etapeCompte(s, email) {
    fenetre(`<h2 id="fen-titre">Créer votre compte</h2>${recap(s)}
      <form data-f="compte" novalidate>
        <div class="ligne">
          <div class="champ"><label for="r-prenom">Prénom</label><input id="r-prenom" autocomplete="given-name" required></div>
          <div class="champ"><label for="r-nom">Nom</label><input id="r-nom" autocomplete="family-name" required></div>
        </div>
        <div class="champ"><label for="r-email2">E-mail</label><input id="r-email2" type="email" value="${esc(email)}" autocomplete="email" required></div>
        <div class="champ"><label for="r-tel">Téléphone</label><input id="r-tel" type="tel" autocomplete="tel"></div>
        <label class="case"><input type="checkbox" id="r-cgv" required><span>J’accepte les <a class="lien" href="legal.html#cgv" target="_blank">conditions générales de vente</a> et la <a class="lien" href="legal.html#confidentialite" target="_blank">politique de confidentialité</a>.</span></label>
        <label class="case"><input type="checkbox" id="r-mkt"><span>Je souhaite recevoir les offres et évènements du studio (facultatif).</span></label>
        <p class="erreur" data-err></p>
        <div class="actions"><button class="btn" type="submit">Créer mon compte</button></div>
      </form>`);
    $('[data-f="compte"]', dlg).addEventListener('submit', (e) => {
      e.preventDefault();
      const err = $('[data-err]', dlg);
      if (!$('#r-cgv', dlg).checked) { err.textContent = 'Acceptez les conditions de vente pour créer votre compte.'; return; }
      const r = S.upsertClient({ firstName: $('#r-prenom', dlg).value.trim(), lastName: $('#r-nom', dlg).value.trim(),
        email: $('#r-email2', dlg).value, phone: $('#r-tel', dlg).value.trim(), marketing: $('#r-mkt', dlg).checked });
      if (!r.ok) { err.textContent = r.msg; return; }
      S.signIn(r.client.id); renderAll(); etapeChoix(s, r.client);
    });
  }

  function etapeChoix(s, c) {
    s = S.byId('sessions', s.id);
    const full = S.placesLeft(s) === 0;
    const m = S.membershipFor(c.id, s.start);
    const nouveau = S.isNewClient(c.id);
    const unite = S.offer('o-unite'); const dec = S.offer('o-decouverte');
    let options = '';
    if (m) options += `<label><input type="radio" name="opt" value="credit" checked><span><b>${esc(m.name)}</b><br><small class="doux">${m.creditsLeft} séance${m.creditsLeft > 1 ? 's' : ''} restante${m.creditsLeft > 1 ? 's' : ''}, 1 sera décomptée</small></span></label>`;
    if (nouveau && dec && dec.active) options += `<label><input type="radio" name="opt" value="decouverte" ${m ? '' : 'checked'}><span><b>Séance découverte</b><br><small class="doux">Nouveau client, réglée au studio</small></span><b>${euro(dec.price)}</b></label>`;
    if (unite && unite.active) options += `<label><input type="radio" name="opt" value="unite" ${m || nouveau ? '' : 'checked'}><span><b>Séance à l’unité</b><br><small class="doux">Réglée au studio</small></span><b>${euro(unite.price)}</b></label>`;
    fenetre(`<h2 id="fen-titre">${full ? 'Liste d’attente' : 'Confirmer'}</h2>${recap(s)}
      <p style="text-align:center">Bonjour ${esc(c.firstName)}${full ? ', ce cours est complet. Rejoignez la liste d’attente : si une place se libère, vous serez inscrit·e automatiquement.' : ', comment souhaitez-vous régler cette séance ?'}</p>
      <form data-f="choix">
        <div class="choix">${options}</div>
        <p class="petit doux">Le paiement en ligne sera branché sur un prestataire sécurisé (Stripe). Dans cette maquette, le règlement se fait au studio. Vous pouvez aussi <a class="lien" href="tarifs.html">choisir une formule</a>.</p>
        <p class="erreur" data-err></p>
        <div class="actions"><button class="btn" type="submit">${full ? 'Rejoindre la liste d’attente' : 'Confirmer la réservation'}</button>
        <button class="btn btn--clair" type="button" data-autre>Ce n’est pas moi</button></div>
      </form>`);
    $('[data-autre]', dlg).addEventListener('click', () => { S.signOut(); renderAll(); ouvrirReservation(s.id); });
    $('[data-f="choix"]', dlg).addEventListener('submit', (e) => {
      e.preventDefault();
      const opt = ($('input[name="opt"]:checked', dlg) || {}).value;
      if (!opt) { $('[data-err]', dlg).textContent = 'Choisissez un mode de règlement.'; return; }
      const r = S.book(s.id, c.id, opt);
      if (!r.ok) { $('[data-err]', dlg).textContent = r.msg; return; }
      fenetre(`<div class="confirme"><img src="assets/img/monogramme-blanc.png" alt="">
        <h2 id="fen-titre">${r.status === 'waitlist' ? 'Vous êtes sur la liste' : 'C’est réservé'}</h2>${recap(s)}
        <p>${r.status === 'waitlist' ? `Position ${r.position} sur la liste d’attente. Vous serez prévenu·e par e-mail si une place se libère.` :
          `Un e-mail de confirmation est envoyé à ${esc(c.email)}. Annulation gratuite jusqu’à 12 h avant le cours.`}</p>
        <p class="petit doux">N’oubliez pas vos chaussettes antidérapantes.</p>
        <div class="actions"><a class="btn" href="compte.html">Voir mes réservations</a><button class="btn btn--clair" type="button" data-ok>Fermer</button></div></div>`);
      $('[data-ok]', dlg).addEventListener('click', () => dlg.close());
      renderAll();
    });
  }

  /* ---------- tarifs ---------- */
  let typeAbo = 'avec';
  function renderTarifs() {
    const offers = S.db.offers.filter((o) => o.active);
    $$('[data-tarifs]').forEach((t) => {
      const cats = t.dataset.tarifs.split(',');
      t.innerHTML = '<tbody>' + offers.filter((o) => cats.includes(o.cat)).map((o) =>
        `<tr><th scope="row">${esc(o.name.replace(' (nouveau client uniquement)', ''))}<br><span class="doux">${o.newOnly ? 'Nouveaux clients uniquement. ' : ''}Valable ${o.validity === 12 ? '1 an' : o.validity + ' mois'}${o.credits > 1 ? `, soit ${euro(Math.round(o.price / o.credits * 100) / 100)} la séance` : ''}</span></th><td class="num">${euro(o.price)}</td></tr>`).join('') + '</tbody>';
    });
    const g = $('[data-abos]');
    if (g) {
      g.innerHTML = offers.filter((o) => o.cat === typeAbo).map((o) => `<div class="abo">
        <div class="nb">${o.credits}</div><span>séances par mois</span>
        <p class="prix">${euro(o.price)}<small> / mois</small></p>
        <p class="unitaire">soit ${euro(Math.round(o.price / o.credits * 100) / 100)} la séance</p></div>`).join('');
      $$('[data-abo]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.abo === typeAbo));
      $$('[data-abo-texte]').forEach((p) => { p.hidden = p.dataset.aboTexte !== typeAbo; });
    }
    const cgv = $('[data-cgv-tarifs]');
    if (cgv) {
      const ls = (cat) => offers.filter((o) => o.cat === cat).map((o) => `<li>${esc(o.name)} : ${euro(o.price)}${o.kind === 'abo' ? ' par mois' : ''}</li>`).join('');
      cgv.innerHTML = `<p><strong>Cours à l’unité</strong></p><ul>${ls('unite')}</ul>
        <p><strong>Offres de découverte (nouveaux clients uniquement)</strong></p><ul>${ls('decouverte')}</ul>
        <p><strong>Abonnements mensuels cours collectif (sans engagement, avec reconduction tacite)</strong></p><ul>${ls('sans')}</ul>
        <p><strong>Abonnements mensuels cours collectif (avec engagement 12 mois)</strong></p><ul>${ls('avec')}</ul>
        <p><strong>Packs cours collectifs</strong></p><ul>${ls('pack')}</ul>`;
    }
  }
  $$('[data-abo]').forEach((b) => b.addEventListener('click', () => { typeAbo = b.dataset.abo; renderTarifs(); }));

  /* ---------- coachs ---------- */
  function renderCoachs() {
    $$('[data-coachs]').forEach((root) => {
      const fiche = root.hasAttribute('data-fiche');
      root.innerHTML = S.db.coaches.filter((c) => c.active).map((c) => {
        const img = `<div class="arche"><img src="${esc(S.photoSrc(c.photo))}" alt="" width="600" height="800" loading="lazy" decoding="async" onerror="this.remove()"></div>`;
        return `<div class="coach">${fiche ? `<button type="button" data-coach="${c.id}">${img}<h3>${esc(c.name)}</h3></button>`
          : `<a href="studio.html#coachs" style="text-decoration:none">${img}<h3>${esc(c.name)}</h3></a>`}</div>`;
      }).join('');
      $$('[data-coach]', root).forEach((b) => b.addEventListener('click', () => ficheCoach(b.dataset.coach)));
    });
  }
  function ficheCoach(id) {
    const c = S.coach(id);
    const next = S.sessionsBetween(new Date(), new Date(Date.now() + 14 * S.DAY)).filter((s) => s.coachId === id).slice(0, 4);
    const bio = c.bio ? c.bio.split('\n').map((p) => `<p>${esc(p)}</p>`).join('') : `<p>${esc(c.name)} vous accompagne en Pilates Reformer.</p>`;
    fenetre(`<h2 id="fen-titre">${esc(c.name)}</h2>${bio}
      ${next.length ? `<p><strong>Prochains cours</strong></p><ul class="liste-resa">${next.map((s) => `<li><span>${jourLong(s.start)}, ${hhmm(s.start)}<br><small class="doux">${esc(S.activity(s.activityId).name)}</small></span><button class="btn btn--clair" type="button" data-r="${s.id}">${S.placesLeft(s) ? 'Réserver' : 'Liste d’attente'}</button></li>`).join('')}</ul>` : ''}
      <div class="actions"><a class="btn" href="planning.html?coach=${c.id}">Tous ses cours</a></div>`);
    $$('[data-r]', dlg).forEach((b) => b.addEventListener('click', () => ouvrirReservation(b.dataset.r)));
  }

  /* ---------- historique replié par année et par mois ---------- */
  // État ouvert / fermé gardé entre deux affichages ; seul le contenu des mois ouverts est construit.
  const etatPeriodes = new Map();
  function periodes(prefixe, groupes, ligne, resume) {
    const contenus = {};
    const html = groupes.map((a, ia) => {
      const ca = prefixe + ':' + a.annee;
      const oa = etatPeriodes.has(ca) ? etatPeriodes.get(ca) : ia === 0;
      return `<details class="periode periode--annee" data-cle="${ca}" ${oa ? 'open' : ''}>
        <summary><span class="periode__titre">${a.annee}</span><small>${resume(a.items)}</small></summary>
        ${a.mois.map((m, im) => {
          const cm = prefixe + ':' + m.cle;
          const om = etatPeriodes.has(cm) ? etatPeriodes.get(cm) : ia === 0 && im === 0;
          contenus[cm] = () => `<ul class="liste-resa">${m.items.map(ligne).join('')}</ul>`;
          return `<details class="periode periode--mois" data-cle="${cm}" ${om ? 'open' : ''}>
            <summary><span class="periode__titre">${m.label}</span><small>${resume(m.items)}</small></summary>
            <div data-contenu>${om ? contenus[cm]() : ''}</div></details>`;
        }).join('')}</details>`;
    }).join('');
    return { html: `<div class="periodes">${html}</div>`, contenus };
  }
  function activerPeriodes(root, contenus) {
    $$('details[data-cle]', root).forEach((d) => d.addEventListener('toggle', () => {
      etatPeriodes.set(d.dataset.cle, d.open);
      const c = d.querySelector(':scope > [data-contenu]');
      if (d.open && c && !c.firstChild && contenus[d.dataset.cle]) c.innerHTML = contenus[d.dataset.cle]();
    }));
  }

  /* ---------- espace client ---------- */
  function renderCompte() {
    const root = $('[data-compte]');
    if (!root) return;
    const me = S.me();
    if (!me) {
      root.innerHTML = `<div style="max-width:28rem">
        <h2>Se connecter</h2>
        <form data-f="login" novalidate>
          <div class="champ"><label for="l-email">Adresse e-mail</label><input id="l-email" type="email" autocomplete="email" required></div>
          <p class="erreur" data-err></p>
          <button class="btn" type="submit">Accéder à mon espace</button>
        </form>
        <p class="petit doux" style="margin-top:1.5rem">Démo : connexion par e-mail seul, par exemple chloe.martin@exemple.fr. En production : lien de connexion sécurisé envoyé par e-mail ou mot de passe.</p>
        <p>Pas encore de compte ? Il se crée à votre première <a class="lien" href="planning.html">réservation</a>.</p></div>`;
      $('[data-f="login"]', root).addEventListener('submit', (e) => {
        e.preventDefault();
        const c = S.clientByEmail($('#l-email', root).value);
        if (!c) { $('[data-err]', root).textContent = 'Aucun compte avec cette adresse. Vérifiez la saisie ou réservez une première séance.'; return; }
        S.signIn(c.id); renderAll();
      });
      return;
    }
    const now = new Date();
    const all = S.bookingsOf(me.id);
    const futur = all.filter((s) => new Date(s.start) > now && !s.cancelled);
    const passeTout = all.filter((s) => new Date(s.start) <= now && s.bookings.some((b) => b.clientId === me.id));
    const passe = passeTout.slice(-12);
    const histo = periodes('compte-' + me.id, S.parPeriode(passeTout, (s) => s.start), (s) => {
      const st = s.attendance[me.id];
      return `<li><span>${esc(S.activity(s.activityId).name)}<br><small class="doux">${jourLong(s.start)}, <span class="horaire">${hhmm(s.start)}</span></small></span>
        <span class="statut ${st === 'present' ? 'statut--ok' : st === 'absent' ? 'statut--non' : ''}">${st === 'present' ? 'Présent·e' : st === 'absent' ? 'Absent·e' : 'Non pointé'}</span></li>`;
    }, (list) => {
      const p = list.filter((s) => s.attendance[me.id] === 'present').length;
      return list.length + ' séance' + (list.length > 1 ? 's' : '') + (p ? ', ' + p + ' présence' + (p > 1 ? 's' : '') : '');
    });
    const forfaits = S.activeMemberships(me.id);
    const pay = S.db.payments.filter((p) => p.clientId === me.id).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
    const presents = passe.filter((s) => s.attendance[me.id] === 'present').length;
    $('[data-compte-accroche]').textContent = `Bonjour ${me.firstName}. ${presents ? presents + ' séance' + (presents > 1 ? 's' : '') + ' suivie' + (presents > 1 ? 's' : '') + ' récemment.' : 'Heureux de vous compter parmi nous.'}`;
    root.innerHTML = `<div class="compte">
      <aside>
        ${forfaits.length ? forfaits.map((m) => `<div class="carte-forfait"><div class="nb">${m.creditsLeft}</div><p>séance${m.creditsLeft > 1 ? 's' : ''} restante${m.creditsLeft > 1 ? 's' : ''}</p>
          <p class="petit doux" style="margin:0 auto">${esc(m.name)}<br>${m.kind === 'abo' ? 'Renouvellement le ' + new Date(m.cycleEnd).toLocaleDateString('fr-FR') : 'Valable jusqu’au ' + new Date(m.end).toLocaleDateString('fr-FR')}</p></div>`).join('')
          : `<div class="carte-forfait"><div class="nb">0</div><p>séance disponible</p><a class="btn" href="tarifs.html">Choisir une formule</a></div>`}
        <form data-f="coord" novalidate style="margin-top:2rem">
          <h3>Mes coordonnées</h3>
          <div class="champ"><label for="c-prenom">Prénom</label><input id="c-prenom" value="${esc(me.firstName)}" autocomplete="given-name"></div>
          <div class="champ"><label for="c-nom">Nom</label><input id="c-nom" value="${esc(me.lastName)}" autocomplete="family-name"></div>
          <div class="champ"><label for="c-email">E-mail</label><input id="c-email" type="email" value="${esc(me.email)}" autocomplete="email"></div>
          <div class="champ"><label for="c-tel">Téléphone</label><input id="c-tel" type="tel" value="${esc(me.phone)}" autocomplete="tel"></div>
          <label class="case"><input type="checkbox" id="c-mkt" ${me.marketing ? 'checked' : ''}><span>Recevoir les offres et évènements</span></label>
          <p class="erreur" data-err></p>
          <button class="btn btn--clair" type="submit">Enregistrer</button>
        </form>
      </aside>
      <div>
        <h2>À venir</h2>
        ${futur.length ? `<ul class="liste-resa">${futur.map((s) => {
          const w = s.waitlist.findIndex((x) => x.clientId === me.id);
          const late = (new Date(s.start) - now) < S.db.settings.freeCancelHours * 36e5;
          return `<li><span><strong style="font-weight:500">${esc(S.activity(s.activityId).name)}</strong><br>${jourLong(s.start)}, <span class="horaire">${hhmm(s.start)}</span>, avec ${esc((S.coach(s.coachId) || {}).name || 'l’équipe')}</span>
            <span>${w > -1 ? `<span class="statut">Liste d’attente, position ${w + 1}</span>` : '<span class="statut statut--ok">Confirmé</span>'}
            <button class="btn btn--clair" type="button" style="min-height:2.4rem;padding:.3rem 1rem;margin-left:.5rem" data-annuler="${s.id}" data-late="${late && w < 0 ? 1 : 0}">${w > -1 ? 'Quitter la liste' : 'Annuler'}</button></span></li>`;
        }).join('')}</ul>` : `<p class="vide">Aucune séance prévue. <a class="lien" href="planning.html">Réserver une séance</a></p>`}
        <h2>Historique <small class="h-compte">${passeTout.length} séance${passeTout.length > 1 ? 's' : ''}</small></h2>
        ${passeTout.length ? histo.html : '<p class="vide">Votre historique apparaîtra après votre première séance.</p>'}
        <h2>Mes paiements</h2>
        ${pay.length ? `<ul class="liste-resa">${pay.map((p) => `<li><span>${esc(p.label)}<br><small class="doux">${new Date(p.date).toLocaleDateString('fr-FR')}, ${esc(p.method)}</small></span><span>${euro(p.amount)} <span class="statut ${p.status === 'payé' ? 'statut--ok' : p.status === 'à régler' ? 'statut--non' : ''}">${esc(p.status)}</span></span></li>`).join('')}</ul>` : '<p class="vide">Aucun paiement.</p>'}
        <h2>Mes données</h2>
        <p>Conformément au RGPD, vous pouvez télécharger vos données ou demander leur suppression.</p>
        <div class="heros__actions">
          <button class="btn btn--clair" type="button" data-export>Télécharger mes données</button>
          <button class="btn btn--clair" type="button" data-effacer>Supprimer mon compte</button>
          <button class="btn btn--clair" type="button" data-deconnexion>Se déconnecter</button>
        </div>
      </div></div>`;

    activerPeriodes(root, histo.contenus);
    $$('[data-annuler]', root).forEach((b) => b.addEventListener('click', () => {
      const s = S.byId('sessions', b.dataset.annuler);
      const late = b.dataset.late === '1';
      const isWait = s.waitlist.some((w) => w.clientId === me.id);
      fenetre(`<h2 id="fen-titre">${isWait ? 'Quitter la liste' : 'Annuler'}</h2>${recap(s)}
        <p style="text-align:center">${isWait ? 'Vous quitterez la liste d’attente de cette séance.' : late ? `<strong>Le cours commence dans moins de ${S.db.settings.freeCancelHours} heures : la séance sera décomptée</strong>, conformément aux conditions de vente.` : 'L’annulation est gratuite : votre séance vous est rendue.'}</p>
        <div class="actions"><button class="btn" type="button" data-oui>${isWait ? 'Quitter la liste' : late ? 'Annuler quand même' : 'Annuler la séance'}</button><button class="btn btn--clair" type="button" data-non>Garder ma place</button></div>`);
      $('[data-non]', dlg).addEventListener('click', () => dlg.close());
      $('[data-oui]', dlg).addEventListener('click', () => {
        const r = S.cancelBooking(s.id, me.id);
        dlg.close();
        toast(r.waitlist ? 'Vous avez quitté la liste d’attente.' : r.late ? 'Séance annulée. Elle est décomptée.' : 'Séance annulée. Votre crédit est rendu.');
        renderAll();
      });
    }));
    $('[data-f="coord"]', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const r = S.upsertClient({ id: me.id, firstName: $('#c-prenom').value.trim(), lastName: $('#c-nom').value.trim(), email: $('#c-email').value, phone: $('#c-tel').value.trim(), marketing: $('#c-mkt').checked });
      if (!r.ok) { $('[data-err]', root).textContent = r.msg; return; }
      toast('Coordonnées enregistrées.'); renderAll();
    });
    $('[data-export]', root).addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(S.exportClient(me.id), null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mes-donnees-inspire.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $('[data-effacer]', root).addEventListener('click', () => {
      fenetre(`<h2 id="fen-titre">Supprimer mon compte</h2><p style="text-align:center">Vos données personnelles seront effacées et vos réservations à venir annulées. Les factures restent conservées, comme la loi l’exige.</p>
        <div class="actions"><button class="btn" type="button" data-oui>Supprimer définitivement</button><button class="btn btn--clair" type="button" data-non>Garder mon compte</button></div>`);
      $('[data-non]', dlg).addEventListener('click', () => dlg.close());
      $('[data-oui]', dlg).addEventListener('click', () => { S.eraseClient(me.id); S.signOut(); dlg.close(); toast('Votre compte est supprimé.'); renderAll(); });
    });
    $('[data-deconnexion]', root).addEventListener('click', () => { S.signOut(); renderAll(); });
  }

  function renderAll() {
    renderShared(); renderPlanning(); renderTarifs(); renderCompte();
  }
  initFiltres();
  renderAll();
  renderCoachs();
  // Synchronisation : toute modification faite dans le back-office (autre onglet) met à jour la page.
  S.subscribe(() => { renderAll(); renderCoachs(); });
  setInterval(renderPlanning, 60000);
})();

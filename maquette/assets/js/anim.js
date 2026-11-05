/* Inspire Pilates Studio — animations au scroll (GSAP + ScrollTrigger + SplitText)
   Fil conducteur : la respiration. Mouvements lents, amples, contrôlés.
   Sans GSAP ou avec « réduire les animations », le contenu reste complet et statique. */
(function () {
  'use strict';
  const racine = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) { racine.classList.remove('js'); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const souffle = 'power2.out';
  const mm = gsap.matchMedia();

  /* ---------- en-tête qui s'affine (tous écrans, sans mouvement) ---------- */
  const entete = $('.entete');
  if (entete) ScrollTrigger.create({ start: 120, end: 'max', onToggle: (st) => entete.classList.toggle('compacte', st.isActive) });

  mm.add({
    ordi: '(min-width: 821px) and (prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 820px) and (prefers-reduced-motion: no-preference)'
  }, (ctx) => {
    const { ordi } = ctx.conditions;

    /* ---------- héros : le texte s'éloigne, l'arche monte plus lentement ---------- */
    const heros = $('.heros');
    if (heros && ordi) {
      gsap.timeline({ scrollTrigger: { trigger: heros, start: 'top top', end: 'bottom top', scrub: 0.8 } })
        .to('.heros__texte', { yPercent: -18, opacity: 0.15, ease: 'none' }, 0)
        .to('.heros__visuel', { yPercent: 10, ease: 'none' }, 0);
    }

    /* ---------- entrée dans le studio : l'arche s'ouvre sur toute la salle ---------- */
    const entree = $('.entree');
    if (entree && ordi) {
      gsap.timeline({ scrollTrigger: { trigger: entree, start: 'top top', end: '+=120%', pin: true, scrub: 1, anticipatePin: 1 } })
        .fromTo('.entree__fenetre',
          { clipPath: 'inset(10% 37% 0% 37% round 999px 999px 0px 0px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', ease: 'power1.inOut', duration: 1 })
        .to('.entree__voile', { opacity: 1, duration: 0.4 }, 0.6)
        .fromTo('.entree__texte', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 }, 0.7)
        .to({}, { duration: 0.25 });
    }

    /* ---------- titres : révélés ligne par ligne, comme sortant d'un masque ---------- */
    const titres = $$('.page-tete h1, main h2').filter((h) => !h.closest('dialog, .heros, .entree'));
    const decoupes = [];
    function decouper() {
      titres.forEach((h) => {
        if (!window.SplitText) return;
        const split = SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'ligne-titre' });
        decoupes.push(split);
        const dansEntete = h.closest('.page-tete');
        gsap.from(split.lines, {
          yPercent: 105, duration: 1.1, ease: 'power3.out', stagger: 0.09,
          delay: dansEntete ? 0.15 : 0,
          scrollTrigger: dansEntete ? null : { trigger: h, start: 'top 88%', once: true }
        });
      });
      ScrollTrigger.refresh();
    }
    document.fonts && document.fonts.ready ? document.fonts.ready.then(decouper) : decouper();

    /* ---------- bienfaits : chaque phrase s'éclaire au rythme du scroll ---------- */
    const bienfaits = $$('.bienfaits li');
    if (bienfaits.length) {
      gsap.timeline({ scrollTrigger: { trigger: '.bienfaits', start: 'top 80%', end: 'bottom 50%', scrub: 0.6 } })
        .from(bienfaits, { opacity: 0.18, x: ordi ? 24 : 0, stagger: 0.5, duration: 1, ease: 'none' });
    }

    /* ---------- planning : séances en cascade, jauges qui se remplissent ---------- */
    $$('[data-planning]').forEach((zone) => {
      ScrollTrigger.create({
        trigger: zone, start: 'top 80%', once: true,
        onEnter: () => {
          gsap.from($$('.seance', zone), { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: souffle });
          gsap.from($$('.jauge i:not(.libre)', zone), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.5, stagger: 0.025, delay: 0.3, ease: 'back.out(2)' });
        }
      });
    });

    /* Photos affichees telles quelles : plus de zoom permanent (x1,16) ni de parallaxe, qui agrandissaient et floutaient les images. */

    /* ---------- formules et abonnements : les arches montent l'une après l'autre ---------- */
    ['.parcours', '.grille-abos'].forEach((sel) => {
      const grille = $(sel);
      if (!grille) return;
      gsap.from(grille.children, {
        y: ordi ? 90 : 40, opacity: 0, duration: 1.1, stagger: 0.14, ease: 'power3.out',
        scrollTrigger: { trigger: grille, start: 'top 82%', once: true }
      });
    });

    /* ---------- coachs : les portraits ondulent en décalé ---------- */
    $$('[data-coachs]').forEach((grille) => {
      const coachs = $$('.coach', grille);
      gsap.from(coachs, { y: 50, opacity: 0, duration: 1, stagger: 0.08, ease: souffle, scrollTrigger: { trigger: grille, start: 'top 85%', once: true } });
      if (ordi) {
        coachs.forEach((c, i) => {
          gsap.fromTo($('.arche', c), { y: i % 2 ? 40 : -10 }, {
            y: i % 2 ? -30 : 20, ease: 'none',
            scrollTrigger: { trigger: grille, start: 'top bottom', end: 'bottom top', scrub: true }
          });
        });
      }
    });

    /* ---------- retraite : le fond passe du blanc au taupe ---------- */
    $$('.retraite').forEach((r) => {
      const voile = $('.retraite__voile', r);
      if (voile) {
        gsap.fromTo(voile, { opacity: 1 }, { opacity: 0, ease: 'none', scrollTrigger: { trigger: r, start: 'top 95%', end: 'top 35%', scrub: true } });
      }
      gsap.from($$('.wrap > *', r), { y: 30, opacity: 0, duration: 1, stagger: 0.12, ease: souffle, scrollTrigger: { trigger: r, start: 'top 60%', once: true } });
    });

    /* ---------- listes d'informations : apparition douce ---------- */
    $$('.infos, .table-tarifs tbody').forEach((liste) => {
      gsap.from(liste.children, { y: 20, opacity: 0, duration: 0.8, stagger: 0.07, ease: souffle, scrollTrigger: { trigger: liste, start: 'top 85%', once: true } });
    });

    /* ---------- tarifs : la bascule avec / sans engagement anime les arches ---------- */
    const surBascule = () => requestAnimationFrame(() => gsap.from('.grille-abos .abo', { y: 24, opacity: 0, duration: 0.6, stagger: 0.07, ease: souffle }));
    $$('[data-abo]').forEach((b) => b.addEventListener('click', surBascule));

    return () => {
      decoupes.forEach((s) => s.revert());
      $$('[data-abo]').forEach((b) => b.removeEventListener('click', surBascule));
    };
  });

  /* Le planning change de hauteur selon le jour choisi : recalculer les positions. */
  let attente;
  const recalcul = () => { clearTimeout(attente); attente = setTimeout(() => ScrollTrigger.refresh(), 250); };
  if (window.ResizeObserver) $$('[data-planning]').forEach((z) => new ResizeObserver(recalcul).observe(z));
  addEventListener('load', () => ScrollTrigger.refresh());
})();

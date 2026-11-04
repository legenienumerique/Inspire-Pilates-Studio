// Assemble les pages : src/pages/*.html + en-tête et pied communs -> *.html à la racine.
// Usage : node build.js
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src', 'pages');
const V = Date.now().toString(36);
const NAV = [
  ['cours.html', 'Les cours'],
  ['planning.html', 'Planning'],
  ['tarifs.html', 'Tarifs'],
  ['studio.html', 'Le studio'],
  ['contact.html', 'Contact']
];

const head = (meta) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title}</title>
<meta name="description" content="${meta.desc}">
<meta name="theme-color" content="#ece7e1">
<link rel="icon" href="assets/img/monogramme-taupe.png">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.desc}">
<meta property="og:image" content="assets/img/studio-1.webp">
<meta property="og:locale" content="fr_FR">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Italiana&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/site.css?v=${V}">
<script>(function(d){d.classList.add('js');var t;try{t=localStorage.getItem('ips-theme')}catch(e){}d.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')})(document.documentElement)</script>
${meta.extraHead || ''}
</head>`;

const header = (file) => `
<a class="skip" href="#contenu">Aller au contenu</a>
<p class="demo-note">Maquette de refonte : réservations et comptes en mode démonstration, données enregistrées dans votre navigateur. <a href="admin/">Voir le back-office</a></p>
<div class="bandeau" data-bandeau hidden></div>
<header class="entete">
  <div class="wrap">
    <a class="marque" href="index.html" aria-label="Inspire Pilates Studio, accueil"><img class="logo-clair" src="assets/img/logo-taupe.png" alt="Inspire Pilates Studio" width="1000" height="253"><img class="logo-sombre" src="assets/img/logo-blanc.png" alt="Inspire Pilates Studio" width="1000" height="253"></a>
    <nav class="nav" id="nav" aria-label="Navigation principale">
      ${NAV.map(([h, l]) => `<a href="${h}"${h === file ? ' aria-current="page"' : ''}>${l}</a>`).join('\n      ')}
      <a href="compte.html"${file === 'compte.html' ? ' aria-current="page"' : ''} data-compte-lien>Mon espace</a>
      <a class="btn" href="planning.html">Réserver</a>
    </nav>
    <div class="entete__droite">
      <button class="theme" type="button" data-theme-bouton aria-label="Activer le mode sombre">
        <svg class="soleil" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>
        <svg class="lune" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>
      </button>
      <button class="burger" aria-expanded="false" aria-controls="nav" aria-label="Ouvrir le menu"><span></span></button>
    </div>
  </div>
</header>`;

const footer = `
<footer class="pied">
  <div class="wrap">
    <div>
      <img src="assets/img/logo-blanc.png" alt="Inspire Pilates Studio" width="1000" height="253" loading="lazy">
      <p>Studio de Pilates Reformer en petits groupes, au cœur de Lyon.</p>
    </div>
    <div>
      <h2>Le studio</h2>
      <address style="font-style:normal">15 rue Sully<br>69006 Lyon</address>
      <p style="margin-top:.8rem"><a href="tel:+33482531781">04 82 53 17 81</a><br><a href="mailto:contact@inspirepilatesstudio.fr">contact@inspirepilatesstudio.fr</a></p>
    </div>
    <div>
      <h2>Réserver</h2>
      <ul>
        <li><a href="planning.html">Planning des cours</a></li>
        <li><a href="tarifs.html">Tarifs et formules</a></li>
        <li><a href="tarifs.html#cadeaux">Cartes cadeaux</a></li>
        <li><a href="compte.html">Mon espace</a></li>
      </ul>
    </div>
    <div>
      <h2>Suivre le studio</h2>
      <ul>
        <li><a href="https://www.instagram.com/inspirepilatesstudio_lyon/" rel="noopener">Instagram</a></li>
        <li><a href="retraite-marrakech.html">Retraite à Marrakech</a></li>
        <li><a href="studio.html#coachs">Les coachs</a></li>
      </ul>
    </div>
    <div class="pied__bas">
      <span>© Inspire Pilates Studio, SASU, Lyon</span>
      <span><a href="legal.html#mentions">Mentions légales</a>, <a href="legal.html#cgv">Conditions de vente</a>, <a href="legal.html#confidentialite">Confidentialité</a></span>
    </div>
  </div>
</footer>
<div class="toast" role="status" aria-live="polite" data-toast></div>
<script src="assets/js/store.js?v=${V}"></script>
<script src="assets/js/site.js?v=${V}"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/SplitText.min.js" defer></script>
<script src="assets/js/anim.js?v=${V}" defer></script>`;

for (const f of fs.readdirSync(SRC).filter((x) => x.endsWith('.html'))) {
  const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
  const m = raw.match(/^<!--([\s\S]*?)-->\s*/);
  const meta = {};
  if (m) m[1].trim().split('\n').forEach((l) => { const i = l.indexOf(':'); meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
  const body = m ? raw.slice(m[0].length) : raw;
  const html = `${head(meta)}
<body data-page="${f.replace('.html', '')}">
${header(f)}
<main id="contenu">
${body.trim()}
</main>
${footer}
</body>
</html>
`;
  fs.writeFileSync(path.join(__dirname, f), html);
  console.log('ok', f);
}

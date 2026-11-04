# Inspire Pilates Studio — maquette de refonte

Site vitrine complet + back-office de gestion, en **mode démonstration**.
Audit du site actuel : `../audit-site-actuel.md`.

## Lancer

```bash
python -m http.server 8642 --directory maquette
```

- Site : http://localhost:8642/
- Back-office : http://localhost:8642/admin/ (code démo : `inspire`)
- Compte client démo : `chloe.martin@exemple.fr` (abonnement actif)

Modifier une page : éditer `src/pages/*.html`, puis `node build.js` (en-tête et pied communs ajoutés automatiquement).

## Ce qui fonctionne (démo)

Données partagées dans le navigateur (`assets/js/store.js`). Site et back-office ouverts dans deux onglets : toute modification s'affiche aussitôt de l'autre côté.

- Réservation : création de compte, séance découverte réservée aux nouveaux clients, décompte sur forfait, liste d'attente avec inscription automatique.
- Règles des CGV : réservation 30 jours avant, fermeture 15 min avant, annulation gratuite jusqu'à 12 h, séance décomptée au-delà.
- Espace client : séances à venir, historique et présences, crédits, paiements, export et suppression des données (RGPD).
- Back-office : tableau de bord, planning semaine (créer, modifier, annuler, copier la semaine), participants et pointage, clients (fiche, formules, crédits, ventes, historique), paiements (encaissement, export CSV), tarifs, coachs, e-mails générés, réglages (règles, horaires, annonce).
- Automatismes : renouvellement mensuel des abonnements, expiration des packs, e-mails de confirmation, annulation, place libérée, changement d'horaire.

## Ce qui est simulé (à construire en production)

| Élément | Démo | Production proposée |
|---|---|---|
| Données | navigateur (localStorage) | base MySQL + API PHP chez alwaysdata |
| Connexion client | e-mail seul | lien magique par e-mail ou mot de passe |
| Connexion admin | code partagé | comptes nominatifs + double authentification |
| Paiement en ligne | règlement au studio | Stripe (CB + mandats SEPA), aucune donnée bancaire stockée |
| E-mails | listés dans l'admin | Brevo ou SMTP alwaysdata, rappel la veille |
| Appli mobile | absente | site installable (PWA) |

**Décision à prendre** : le studio utilise déjà Liberfit (réservations, prélèvements SEPA, appli). Deux voies :
1. Garder Liberfit comme moteur et brancher ce site dessus (rapide, sans migration).
2. Remplacer Liberfit par ce back-office sur mesure (migration des clients, crédits et mandats SEPA à planifier).

## À valider avec le studio

- Planning réel, durée des cours (50 min supposées) et nombre de reformers (8 supposés).
- Horaires d'ouverture (vides sur le site actuel).
- Tarif des cours privés et prix de la retraite.
- Bios de Marine et Elisabeth (absentes du site actuel).
- CGV : mot manquant corrigé (« abonnements mensuels **avec engagement** sont conclus »), dates incohérentes (06/08/2026 et 11/12/2025).
- Mentions légales : nouvel hébergeur. Confidentialité : section cookies réécrite (plus d'analytics Liberfit).

## Identité

- Logo d'origine conservé, extrait en versions taupe et blanche (`assets/img/logo-*.png`, `monogramme-*.png`).
- Couleurs : taupe logo `#7D7062`, taupe profond `#5C5145`, lin `#ECE7E1`, ombre `#2B2622`, blanc.
- Titres : Italiana (contraste fin, proche du logotype). Texte : Jost (proche du slogan « PILATES STUDIO »).
- Signature : l'arche lumineuse, reprise des miroirs rétroéclairés du studio et du monogramme.

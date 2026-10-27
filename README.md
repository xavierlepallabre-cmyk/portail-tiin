# Portail TIIN

Portail pédagogique des apprentis du **Bac Pro TIIN** — Lycée Alexis de Tocqueville, Cherbourg-en-Cotentin.

Il réunit sur une même page, installable sur tablette :

- les applications interactives (**Nucléa TIIN**, **Sûreté & Cycle TIIN**) ;
- la galerie des projets et réalisations d'élèves ;
- les cours et ressources, classés par discipline, thème, niveau et format ;
- l'emplacement des futurs QCM.

Le portail ne modifie pas les applications : il les ouvre à leur adresse habituelle. Il n'a ni compte, ni serveur, ni collecte de données.

---

## 1. Ce que contient le dossier

```
portail-tiin/
├── index.html               la page du portail (ne pas modifier pour ajouter du contenu)
├── data/catalogue.json      ★ LE fichier à modifier : toutes les ressources sont déclarées ici
├── verifier.html            page qui contrôle le catalogue avant publication
├── documents/
│   ├── projets/             PDF, diaporamas, photos des projets d'élèves
│   └── ressources/          supports de cours, fiches de synthèse
├── assets/
│   ├── img/projets/         illustrations des fiches projets
│   ├── img/apps/            icônes des applications
│   ├── css/  js/  fonts/    fonctionnement du portail (pas besoin d'y toucher)
├── icons/                   icônes de l'application installée
├── manifest.webmanifest     réglages d'installation sur tablette
├── sw.js                    fonctionnement hors connexion du portail
└── docs/                    installation tablette, vérification avant présentation, droits
```

Règle simple : **pour ajouter du contenu, on touche à `data/catalogue.json` et on dépose les fichiers dans `documents/` ou `assets/img/`. Rien d'autre.**

---

## 2. Publier sur GitHub Pages (gratuit)

Le portail vit dans son **propre dépôt**, à côté de `nuclea-tiin` et `Surete-cycle-tiin`, sans les toucher.

1. Sur github.com, connecté à ton compte `xavierlepallabre-cmyk` : bouton **New** (nouveau dépôt).
2. Nom du dépôt : `portail-tiin`. Visibilité : **Public** (obligatoire pour GitHub Pages gratuit). Créer.
3. Dans le dépôt vide : **Add file › Upload files**, puis glisser **le contenu** du dossier `portail-tiin` (pas le dossier lui-même : `index.html` doit être à la racine du dépôt). Valider avec **Commit changes**.
4. **Settings › Pages** : *Source* = **Deploy from a branch**, *Branch* = **main**, dossier **/ (root)**. Enregistrer.
5. Attendre une à deux minutes. Le portail est en ligne à l'adresse :
   **https://xavierlepallabre-cmyk.github.io/portail-tiin/**
6. Ouvrir **https://xavierlepallabre-cmyk.github.io/portail-tiin/verifier.html** : tout doit être vert ou orange, aucune ligne rouge.

> Avec Claude Code ou Git, on peut aussi pousser le dossier directement : `git init`, `git add .`, `git commit`, `git push` vers le nouveau dépôt.

### Mettre à jour le portail

1. Modifier `data/catalogue.json` (et déposer les nouveaux fichiers) directement sur GitHub : ouvrir le fichier, icône crayon, modifier, **Commit changes**.
2. Ouvrir `verifier.html` pour contrôler.
3. Les tablettes voient les nouveautés au prochain lancement avec connexion (le catalogue est toujours relu en priorité sur le réseau).

Si tu modifies les fichiers de fonctionnement (`assets/css`, `assets/js`, `index.html`), augmente le numéro de version en tête de `sw.js` (`portail-tiin-v1.0.0` → `v1.0.1`). Le portail proposera alors « Mettre à jour » aux tablettes.

---

## 3. Ajouter une ressource

Chaque ressource est un bloc entre accolades dans la liste `"ressources"` du catalogue. On copie un bloc existant du même type, on le colle à la suite (en séparant les blocs par une **virgule**), puis on change les valeurs.

**Pièges classiques** : oublier la virgule entre deux blocs, en laisser une après le dernier bloc, ou utiliser des guillemets typographiques (« » ou “ ”) au lieu de `"`. La page `verifier.html` les détecte.

### Champs communs

| Champ | Obligatoire | Rôle |
|---|---|---|
| `id` | oui | identifiant unique, minuscules et tirets : `rapport-pompe-2027` |
| `rubrique` | oui | `applications`, `projets`, `ressources`, `qcm` (ou une nouvelle rubrique) |
| `titre` | oui | titre affiché |
| `description` | conseillé | une ou deux phrases |
| `url` | selon le cas | adresse web (`https://…`) ou fichier du portail (`documents/ressources/fiche.pdf`) |
| `image` / `icone` | non | illustration ou icône (fichier dans `assets/img/`) |
| `motsCles` | non | liste de mots pour la recherche : `["pompe", "étanchéité"]` |
| `anneeScolaire` | projets | `"2026-2027"` |
| `statut` | oui | `publie` (visible), `brouillon` (caché), `en-preparation` (annoncé), `archive` (caché) |
| `documents` | non | liste de documents joints (voir exemple projet) |

### Exemple : un support de cours en PDF

1. Déposer le fichier dans `documents/ressources/` (nom simple, sans espace ni accent : `fiche-radioprotection-3-regles.pdf`).
2. Ajouter dans `"ressources"` :

```json
{
  "id": "fiche-3-regles-radioprotection",
  "rubrique": "ressources",
  "titre": "Fiche de synthèse : les trois règles de radioprotection",
  "description": "Temps, distance, écran : définitions et exemples chiffrés.",
  "url": "documents/ressources/fiche-radioprotection-3-regles.pdf",
  "discipline": "Radioprotection",
  "thematique": "Radioprotection",
  "niveau": "Seconde",
  "format": "PDF",
  "motsCles": ["temps", "distance", "écran", "débit de dose"],
  "statut": "publie"
}
```

Les filtres (discipline, thème, niveau, format) se créent tout seuls à partir de ces valeurs : écrire toujours la même valeur de la même façon (« Seconde » et non tantôt « 2nde »).

### Exemple : un projet d'élève

Un projet **n'est affiché que si** `"autorisation": { "diffusionVerifiee": true }` est renseigné. Voir `docs/CONFIDENTIALITE-ET-DROITS.md` avant toute publication.

```json
{
  "id": "rapport-vanne-2027",
  "rubrique": "projets",
  "titre": "Rapport : remise en état d'une vanne à opercule",
  "description": "Démontage, expertise, remplacement de la garniture et essais d'étanchéité.",
  "image": "assets/img/projets/rapport-vanne-2027.jpg",
  "anneeScolaire": "2026-2027",
  "typeProjet": "Rapport",
  "thematique": "Maintenance",
  "auteurs": "Apprentis de Terminale TIIN",
  "documents": [
    { "titre": "Rapport complet", "url": "documents/projets/rapport-vanne-2027.pdf", "format": "pdf", "taille": "2,4 Mo" },
    { "titre": "Diaporama de soutenance", "url": "documents/projets/rapport-vanne-2027-diapo.pdf", "format": "pdf" }
  ],
  "liens": [
    { "titre": "Vidéo de l'essai (lien académique)", "url": "https://…" }
  ],
  "autorisation": { "diffusionVerifiee": true, "verifieeLe": "2027-06-15" },
  "motsCles": ["robinetterie", "étanchéité"],
  "statut": "publie"
}
```

Formats de documents reconnus pour l'icône : `pdf`, `pptx`/`odp` (diaporama), `jpg`/`png` (image), `mp4`/`webm` (vidéo), `lien`. Pour un diaporama, préférer un export PDF : il s'ouvre sur toutes les tablettes.

Images : format paysage 4:3 (par exemple 1200 × 900 px), en JPG de moins de 400 Ko.

### Retirer les exemples fictifs

Les quatre fiches `exemple-…` montrent la mise en page de la galerie. Dès les premiers vrais projets, supprimer leurs blocs du catalogue, ou passer `"afficherExemples": false` dans la partie `"portail"`.

### Ajouter une application

```json
{
  "id": "radioprotection-tiin",
  "rubrique": "applications",
  "titre": "Radioprotection TIIN",
  "sousTitre": "Débit de dose et protections",
  "description": "…",
  "url": "https://xavierlepallabre-cmyk.github.io/radioprotection-tiin/",
  "icone": "assets/img/apps/radioprotection.svg",
  "chiffres": [ { "valeur": "12", "libelle": "situations" } ],
  "raccourcis": [ { "titre": "Simulateur", "url": "https://…/#simulateur", "couleur": "#1F7A63" } ],
  "statut": "publie"
}
```

Sans champ `apparence`, la carte prend le style sobre du portail. Les raccourcis ne fonctionnent que si l'application sait ouvrir directement une partie à partir de l'adresse (c'est le cas de Sûreté & Cycle avec `#amont`, `#rep`… mais pas, pour l'instant, de Nucléa TIIN).

### Activer les QCM plus tard

Quand l'application de QCM existera, renseigner son adresse dans `"portail"` → `"qcm": { "url": "https://…" }`. La page QCM affichera alors un bouton d'accès. Le portail lui-même ne stockera jamais de résultat.

### Créer une nouvelle rubrique

Ajouter un bloc dans `"rubriques"` :

```json
{ "id": "videos", "titre": "Vidéos", "titreLong": "Vidéos d'atelier", "description": "…", "vue": "bibliotheque", "icone": "projets", "couleur": "ressources", "menu": true, "filtres": ["thematique"] }
```

Vues disponibles : `applications` (grandes cartes), `galerie` (fiches illustrées avec règle d'autorisation), `bibliotheque` (liste filtrable), `emplacement` (page « en préparation »), `cartes` (liste simple). Icônes : `apps`, `projets`, `ressources`, `qcm`, `info`. Couleurs : `apps`, `projets`, `ressources`, `qcm`, `neutre`. Pour garder une barre de navigation lisible, ne pas dépasser six rubriques avec `"menu": true`.

---

## 4. Choix techniques (pour mémoire)

- **Site statique** HTML/CSS/JavaScript sans framework ni étape de compilation : rien à installer, rien qui vieillisse.
- **Catalogue JSON** séparé de l'interface : les cartes, filtres et pages sont générés à partir des données.
- **Navigation par adresse** (`#/projets`, `#/projets/identifiant`) : chaque écran a son adresse, le bouton Retour d'Android fonctionne, les filtres ne créent pas d'étapes parasites dans l'historique.
- **Applications ouvertes dans la même fenêtre** : Retour ramène au portail.
- **Service worker limité au dossier du portail** : il n'intercepte jamais Nucléa ni Sûreté & Cycle, qui gardent leur propre fonctionnement hors connexion.
- **Sécurité** : politique de sécurité des contenus (CSP) stricte, liens filtrés (seuls `https://` et les fichiers du portail sont acceptés), aucune donnée personnelle, aucun secret dans le code. Seul le choix clair/sombre est mémorisé sur l'appareil.
- **Police Lexend** (licence libre OFL, fichier `assets/fonts/OFL.txt`), embarquée : aucune requête vers un service tiers.

Documentation complémentaire dans `docs/` :
- `INSTALLATION-TABLETTE.md` — installer le portail sur la Samsung Galaxy ;
- `VERIFICATION-PRESENTATION.md` — check-list et déroulé de la démonstration à la direction ;
- `CONFIDENTIALITE-ET-DROITS.md` — publication des travaux d'élèves, modèle d'autorisation.

## Auteur et droits

Conception originale : Xavier Le Pallabre  
Ressource pédagogique développée à titre personnel, avec l’assistance d’outils d’intelligence artificielle.  
© 2026 Xavier Le Pallabre — Attribution de l’auteur original à conserver lors des réutilisations et adaptations, conformément à la licence applicable : [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr).

Cette mention concerne le portail lui-même (code, mise en page, textes de présentation). Les travaux d'apprentis publiés dans `documents/` restent ceux de leurs auteurs, diffusés selon leur autorisation (voir `docs/CONFIDENTIALITE-ET-DROITS.md`).

## Licence

Sauf mention contraire, le contenu de ce dépôt (code, textes, schémas, illustrations) est mis à disposition selon les termes de la licence **Creative Commons Attribution – Pas d'utilisation commerciale – Partage dans les mêmes conditions 4.0 International** ([CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr)). Texte complet : fichier `LICENSE`.

Tu peux le réutiliser, le copier et l'adapter, à trois conditions :
- **Attribution** : citer l'auteur original (Xavier Le Pallabre), indiquer la licence et signaler les modifications ;
- **Pas d'utilisation commerciale** : pas de vente ni d'usage dans un service payant ;
- **Partage dans les mêmes conditions** : diffuser les adaptations sous la même licence.

Ne sont pas couverts par cette licence :
- la police Lexend (`assets/fonts/`), sous licence SIL Open Font License 1.1 (voir `assets/fonts/OFL.txt`) ;
- les logos du lycée Alexis de Tocqueville et du Bac Pro TIIN, propriété de l'établissement ;
- les travaux d'apprentis publiés dans `documents/` et leurs images, qui restent ceux de leurs auteurs et ne sont diffusés que selon leur autorisation (voir `docs/CONFIDENTIALITE-ET-DROITS.md`).

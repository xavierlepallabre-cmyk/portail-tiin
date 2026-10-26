# Vérification avant la présentation à la direction

À faire **la veille**, puis une version courte **une heure avant**.

## A. La veille (20 minutes)

### Publication
- [ ] `https://xavierlepallabre-cmyk.github.io/portail-tiin/verifier.html` : aucune ligne rouge.
- [ ] Les exemples fictifs sont bien marqués « Exemple fictif » dans la galerie (ou retirés si de vrais projets sont prêts).

### Sur la tablette, avec Wi-Fi
- [ ] Le portail s'ouvre **depuis l'icône** de l'écran d'accueil, en plein écran.
- [ ] Accueil lisible en **paysage** puis en **portrait** (tourner la tablette) ; aucun défilement horizontal.
- [ ] **Nucléa TIIN** s'ouvre depuis sa carte ; le bouton **Retour** ramène au portail.
- [ ] **Sûreté & Cycle TIIN** s'ouvre depuis sa carte ; Retour ramène au portail.
- [ ] Un raccourci (par exemple **Simulateur REP 1300**) ouvre directement le bon parcours.
- [ ] **Projets** : filtrer par « Poster », ouvrir la fiche, ouvrir le document PDF, revenir : le filtre est conservé.
- [ ] **Ressources** : un parcours s'ouvre ; la recherche fonctionne avec le clavier de la tablette.
- [ ] **QCM** : la page indique clairement « En préparation ».
- [ ] Icône ⓘ : la page « Le dispositif » s'affiche.
- [ ] Bouton lune : le thème sombre s'applique, puis revenir au thème clair.

### Hors connexion (mode Avion)
- [ ] Le portail s'ouvre depuis l'icône et affiche « Hors connexion » en haut.
- [ ] Toucher une application affiche l'avertissement ; « Essayer quand même » ouvre l'application si elle a déjà été chargée.
- [ ] Réactiver le Wi-Fi.

## B. Une heure avant (5 minutes)

- [ ] Tablette chargée à 100 %, Wi-Fi de la salle connecté et testé.
- [ ] Ouvrir une fois Nucléa TIIN et Sûreté & Cycle TIIN (pour qu'elles soient en mémoire).
- [ ] Fermer toutes les autres applications ; **Ne pas déranger** activé.
- [ ] Luminosité au maximum, rotation automatique activée.
- [ ] Laisser le portail ouvert sur l'**Accueil**, puis le fermer pour pouvoir montrer son lancement depuis l'icône.
- [ ] Plan B : le portail fonctionne aussi sur un ordinateur ou un téléphone, à la même adresse.

## C. Déroulé de la démonstration (environ 5 minutes)

1. **Ouverture** — Écran d'accueil Android, toucher l'icône **Portail TIIN** : le portail s'ouvre comme une application. *« Un seul point d'entrée pour tous les outils de la formation. »*
2. **Nucléa TIIN** — Toucher la carte. Montrer le tableau périodique, ouvrir un élément. *« Les apprentis manipulent : c'est la pratique avant la théorie. »*
3. **Retour au portail** — Bouton Retour d'Android : on revient exactement où l'on était.
4. **Sûreté & Cycle TIIN** — Toucher le raccourci **Simulateur REP 1300** : le simulateur s'ouvre directement. Lancer un scénario. Revenir.
5. **Projets d'élèves** — Onglet **Projets** : la galerie, les filtres, une fiche avec son document. Préciser que les fiches actuelles sont des exemples fictifs et que chaque projet réel sera publié après accord de diffusion.
6. **Perspectives** — Onglet **QCM** : le fonctionnement prévu et l'architecture séparée qui protège les données. Puis icône ⓘ **Le dispositif** : ce qui est disponible, ce qui est en préparation, ce qui est envisagé.

Conclure sur la demande : **12 tablettes** pour que chaque apprenti dispose de ce portail en atelier et en classe.

## D. Ce qui a été testé et ce qui reste à tester sur l'appareil

Testé lors du développement (navigateur Chromium, formats 1280 × 800, 800 × 1280, 390 × 844) :
- affichage des six écrans en paysage, portrait et téléphone, sans défilement horizontal ;
- toutes les zones tactiles d'au moins 44 px ;
- navigation, filtres, recherche, fiche projet, retour arrière avec conservation des filtres ;
- enregistrement du service worker, rechargement hors connexion, avertissement avant d'ouvrir une application sans réseau ;
- manifeste d'installation et icônes ;
- ouverture directe des parcours de Sûreté & Cycle TIIN (#rep, #amont…) ;
- page de vérification du catalogue.

À vérifier **uniquement sur la tablette réelle** :
- l'installation par « Ajouter à l'écran d'accueil » et l'aspect de l'icône (forme imposée par le lanceur Samsung) ;
- l'ouverture en plein écran depuis l'icône ;
- le retour au portail depuis Nucléa TIIN et Sûreté & Cycle TIIN avec le bouton ou le geste Retour d'Android ;
- le comportement si Nucléa TIIN ou Sûreté & Cycle TIIN sont aussi installées comme applications ;
- l'ouverture d'un document PDF (visionneuse PDF de la tablette) ;
- l'affichage du clavier lors d'une recherche ;
- le mode Avion ;
- la lisibilité réelle à distance de lecture et au soleil ou sous éclairage d'atelier.

Les adresses github.io n'étaient pas joignables depuis l'environnement de développement : les liens vers les deux applications ont été contrôlés sur des copies locales de leurs dépôts. **Un contrôle en ligne des deux liens est donc indispensable la veille.**

# Confidentialité et droits de diffusion

Le portail est **public** : tout ce qui y est publié est lisible par n'importe qui connaissant l'adresse. Il ne doit contenir que des contenus pouvant être diffusés sans restriction.

## Ce que fait le portail

- Aucun compte, aucune connexion, aucun formulaire.
- Aucune donnée envoyée à un service tiers (police et images embarquées).
- Seule information mémorisée sur la tablette : le choix du thème clair ou sombre.
- Les futurs résultats de QCM ne seront **jamais** stockés dans le portail : ils relèveront d'une application séparée, avec un tableau de bord enseignant protégé par authentification.

## Avant de publier un travail d'élève

Pour chaque projet, vérifier :

1. **Autorisation de diffusion** signée par l'apprenti (et par un responsable légal s'il est mineur). Modèle ci-dessous. L'archiver hors du portail.
2. **Accord de l'entreprise d'accueil** si le travail contient des informations issues d'un site (EDF, Orano, prestataire…) : plans, procédures, photos d'installations. En cas de doute, ne pas publier ou anonymiser.
3. **Données personnelles retirées** des documents : noms de famille, signatures, adresses, numéros de téléphone, photos de visages non autorisées, numéros de dosimètre ou de badge, informations de santé.
4. **Propriétés du fichier** nettoyées (nom de l'auteur dans les propriétés du PDF ou du PowerPoint) : dans Word ou PowerPoint, *Fichier › Informations › Inspecter le document*.
5. **Photos** : pas d'élève identifiable sans autorisation écrite spécifique au droit à l'image ; pas de zone d'installation sensible.
6. Dans le catalogue : champ `"auteurs"` sous forme collective (« Apprentis de Terminale TIIN, promotion 2027 »), sauf accord explicite pour les prénoms.

Ce n'est qu'ensuite qu'on renseigne dans la fiche :

```json
"autorisation": { "diffusionVerifiee": true, "verifieeLe": "2027-06-15" }
```

Sans cette ligne, le portail **n'affiche pas** le projet.

## Demande de retrait

Un apprenti ou ancien apprenti peut demander le retrait d'un travail à tout moment : supprimer le bloc du catalogue et le fichier du dossier `documents/`, puis publier. Prévoir aussi la suppression dans l'historique du dépôt GitHub si le document contenait une donnée personnelle (le service informatique ou Claude Code peut accompagner cette opération).

## Modèle d'autorisation de diffusion

> **Autorisation de diffusion d'un travail scolaire — Bac Pro TIIN, Lycée Alexis de Tocqueville**
>
> Je soussigné(e) ………………………………………, apprenti(e) en Bac Pro TIIN (promotion ……………),
> autorise le lycée Alexis de Tocqueville à diffuser sur le portail pédagogique de la formation, accessible publiquement sur Internet, le travail suivant :
>
> Titre : ………………………………………………………………………………
> Nature : ☐ rapport ☐ diaporama ☐ poster ☐ photographies ☐ vidéo ☐ autre : ……………
>
> Mention de l'auteur souhaitée : ☐ aucune ☐ « Apprentis TIIN, promotion …… » ☐ mon prénom seul
> Images où j'apparais : ☐ aucune ☐ j'autorise leur diffusion ☐ je n'autorise pas leur diffusion
>
> Cette autorisation est gratuite, valable pour une diffusion à but pédagogique, et révocable à tout moment sur simple demande auprès de l'enseignant.
>
> Fait à Cherbourg-en-Cotentin, le ……………
> Signature de l'apprenti(e) : Signature du responsable légal (si mineur) :

Faire valider ce modèle par la direction avant usage : l'établissement peut disposer de son propre formulaire de droit à l'image.

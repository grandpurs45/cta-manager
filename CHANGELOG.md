# Changelog

## v0.11.2 - 2026-03-31

### Fixed
- `Retirer` un engin engage ne le teleporte plus instantanement a la caserne.
- Si l'engin est en `trajet` / `sur_place` / `transport` / `retour`, il passe en retour reel avec un delai avant disponibilite.
- L'effectif du vehicule retire reste compte indisponible pendant son retour vers caserne.

## v0.11.1 - 2026-03-31

### Fixed
- Les profils `degrade` (ex: `SUAP_DEGRADE`) sont de nouveau proposes meme sans profil nominal selectionne.
- Reengagement d'un vehicule en `retour`: calcul base sur l'equipage embarque, plus sur l'effectif restant en caserne.
- Reengagement en `retour`: depart immediat (`departDelay = 0`) au lieu d'un delai poste/astreinte.

### Added
- Actions sur moyens deja engages depuis le detail intervention:
  - `Retirer` un engin engage,
  - `Modifier` un engin engage (retrait + remise en selection).

## v0.11.0 - 2026-03-31

### Added
- Mode "territoire" au premier lancement: choix du departement dans un catalogue de packs.
- Chargement dynamique des communes depuis `packs/fr/departements/<code>/communes.json`.
- Conversion automatique des communes en zones de jeu (`dynamicZones`) avec population.
- Nouveau panneau "Configuration territoire".
- Script `tools/build-national-db.js` pour generer des packs departement depuis une base nationale JSON.
- Pack de test Loiret (`45`) fourni (`packs/fr/...`).

### Changed
- Le moteur de zones lit maintenant les zones dynamiques quand un territoire est configure.
- Le panneau "A propos" affiche le territoire courant.

## v0.10.1 - 2026-03-31

### Added
- Calcul dynamique de zone d'influence par caserne (distance + population des communes).
- Affichage de la zone d'influence dans le panneau Casernes:
  - nombre de communes,
  - population couverte.

### Changed
- Generation des interventions: le choix de zone est maintenant pondere par influence caserne au lieu d'un poids statique seul.
- Nouveau parametrage `SETTINGS.zoneInfluence` (`radiusKm`, `minFactor`).

## v0.10.0 - 2026-03-30

### Added
- Nouveau panneau `A propos` dans l'interface (version, mode courant, recap rapide).
- Badge de mode visible dans le header:
  - `Mode offline (sauvegarde locale)`
  - `Mode online (profil cloud)`
- Checklist release ajoutee et exposee dans l'app + README.

### Changed
- Workflow de release clarifie pour preparer les prochaines versions publiques.

## v0.9.4 - 2026-03-29

### Fixed
- Correction globale des textes corrompus (mojibake) dans l'interface.
- Nettoyage UTF-8 des libelles principaux (detail, decision, selection, statuts, symboles).
- Stabilisation de l'affichage pour eviter la reintroduction de caracteres invalides.

## v0.9.3 - 2026-03-28

### Changed
- L'administration flotte ne permet plus d'ajouter des vehicules gratuitement.
- Le module admin "Ajouter un vehicule" devient un module de transfert inter-caserne.

### Added
- Transfert de vehicule avec delai de transit (vehicule indisponible pendant le trajet).
- Statut vehicule `TRANSIT` + suivi du temps restant dans la liste admin.

### Fixed
- Blocage de la suppression d'un vehicule pendant son transit.

## v0.9.2 - 2026-03-28

### Added
- Export JSON de la carriere (backup local) depuis le panneau Progression.
- Import JSON de la carriere (restauration locale) depuis le panneau Progression.

### Changed
- Ajout d'une section "Sauvegarde carriere" avec actions d'export/import directes.

## v0.9.1 - 2026-03-28

### Added
- Historique des 10 dernieres recettes dans le panneau Progression.
- Detail du score qualite affiche (couverture, delai, sur-engagement) pour la derniere intervention.

### Changed
- Chaque recette enregistre maintenant son contexte complet (intervention, score qualite, impact financier qualite).
- Resume carriere enrichi avec les donnees de suivi qualite/revenus.

## v0.9.0 - 2026-03-27

### Added
- Score qualite de dispatch avec impact financier:
  - rapidite d'engagement,
  - couverture (complet vs partiel),
  - penalite de sur-engagement.
- Resume carriere dans le panneau Progression:
  - stats de flotte et casernes,
  - qualite moyenne/meilleur/pire score,
  - cumul bonus/malus qualite.

### Changed
- Les revenus de fin d'intervention incluent maintenant un bonus/malus lie a la qualite de dispatch.
- La derniere recette affiche le score qualite de l'intervention.

## v0.8.3 - 2026-03-27

### Added
- Progression flotte amelioree:
  - debloquage par type de vehicule,
  - achat d'unites par type avec affectation a une caserne.

### Changed
- Le generateur d'interventions ne propose plus de scenarios impossibles avec la flotte possedee.
- Affichage monetaire harmonise avec le symbole `&euro;` via format robuste (`\\u20AC` / `&euro;`).

### Fixed
- Correctifs d'encodage/mojibake sur plusieurs textes UI (accents et symboles corrompus).

## v0.8.2 - 2026-03-27

### Added
- Progression flotte par type:
  - debloquer un type de vehicule,
  - acheter ensuite des unites de ce type,
  - affecter chaque unite a une caserne choisie.
- Nouveaux couts de debloquage de type (`unlockCosts.vehicleTypeUnlock`).

### Changed
- Le generateur d'interventions filtre maintenant les templates selon la flotte reellement possedee.
- Les interventions impossibles avec la flotte actuelle ne sont plus generees.
- Le panneau progression remplace l'achat d'engins predefinis par le flux type + unite.

## v0.8.1 - 2026-03-27

### Added
- Nouvelle couche de routage configurable (`distance`, `matrix`, `hybrid`) dans les settings.
- Fichier de matrice de trajet initial: [data/travel-matrix.js](data/travel-matrix.js).
- Chargement de la matrice dans l'application (script data dedie).

### Changed
- Tous les calculs de temps de trajet passent par le provider de routage unique.
- Fallback automatique sur le calcul distance+facteur si la matrice n'a pas la valeur.
- Version applicative passee en `v0.8.1`.

## v0.8.0 - 2026-03-27

### Added
- Mode progression economique (argent, interventions terminees, revenus cumules).
- Demarrage de carriere avec une seule caserne et un seul vehicule.
- Recompense de fin d'intervention avec bonus/malus selon la qualite de reponse.
- Panneau Progression pour acheter:
  - nouvelles casernes,
  - nouveaux vehicules,
  - fonctionnalites (transport hopital, administration flotte).
- Nouvelles statistiques en haut d'ecran: budget et interventions terminees.

### Changed
- Filtrage operationnel: seules les casernes et vehicules debloques sont utilisables.
- Verrouillage de l'administration flotte tant que la fonctionnalite n'est pas achetee.

### Notes
- Les anciennes sauvegardes sont migrees en mode compatible.
- Pour tester le vrai depart de carriere, utiliser "Reinitialiser".

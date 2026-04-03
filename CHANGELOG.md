# Changelog

## v0.13.4 - 2026-04-03

### Changed
- Casernes: la garde postee est disponible des le niveau 1, mais commence a 0 et doit etre achetee.
- Casernes: les astreintes commencent a 3 a la creation, puis les suivantes sont achetables.
- Gestion casernes: ajout des actions `Acheter +1 poste` / `Acheter +1 astreinte` avec cout unitaire.
- Niveaux casernes: les valeurs d'effectif sont maintenant des plafonds de capacite (et non des effectifs auto-donnes).

## v0.13.3 - 2026-04-02

### Added
- Panneau progression: ajout d'un cheat code de test `RICHECTA` pour crediter instantanement le budget de +50 000 EUR (repetable).

## v0.13.2 - 2026-04-02

### Changed
- Premier lancement: suppression du choix "Commune de depart". La 1ere caserne est maintenant placee via coordonnees GPS saisies manuellement.

## v0.13.1 - 2026-04-02

### Changed
- Premier lancement: la 1ere caserne peut maintenant etre placee librement via coordonnees manuelles (lat/lon), en plus du choix de commune.

## v0.13.0 - 2026-04-02

### Added
- Nouveau fichier central de reference economie: `data/economy.js` (couts, progression, niveaux casernes).
- Nouveau panneau `Gestion casernes` pour faire evoluer les casernes.

### Changed
- Les couts progression/revenus sont maintenant lus depuis la config economie centralisee (avec fallback de compatibilite).
- Ajout de niveaux de caserne exploites en jeu:
  - augmentation effectifs par niveau,
  - debloquage garde postee,
  - augmentation capacite de remise.
- Achat d'un vehicule bloque si la remise de la caserne est pleine.

## v0.12.10 - 2026-04-02

### Fixed
- Le type de vehicule `VSAV` n'est plus debloque a `0 EUR` par erreur.
- Cout de debloquage `VSAV` fixe a `6 000 EUR`.

## v0.12.9 - 2026-04-02

### Changed
- Premier lancement: la caserne de depart n'est plus choisie dans une liste fixe Loiret.
- Nouveau flux de demarrage:
  - choix du departement,
  - choix d'une commune de depart (chargee depuis le pack),
  - nom libre de la caserne initiale.
- La caserne de depart est creee aux coordonnees choisies.
- Le bloc `Debloquer une caserne` est masque quand il n'y a aucune caserne preconfiguree a acheter.

## v0.12.8 - 2026-04-02

### Changed
- Nouvelle carriere: plus de liste de casernes pre-creees dans l'etat de partie.
- Caserne de depart creee uniquement a la selection joueur (niveau 1).
- Niveau 1 standardise pour les casernes: `0 SP poste / 3 SP astreinte`.

## v0.12.7 - 2026-04-02

### Added
- Nouveau script de validation metier: `tools/validate-data.js`.
- Verification automatique des codes besoins/options/regles avant deploiement GitHub Pages.

## v0.12.6 - 2026-04-02

### Changed
- Durcissement "tres local" des zones d'influence:
  - `maxOperationalDistanceKm`: 12
  - `radiusKm`: 5
  - `minFactor`: 0.08

## v0.12.5 - 2026-04-02

### Changed
- Durcissement supplementaire des zones d'influence:
  - `maxOperationalDistanceKm`: 16
  - `radiusKm`: 7
  - `minFactor`: 0.12

## v0.12.4 - 2026-04-02

### Changed
- Reglage plus strict des zones d'influence pour reduire la couverture excessive en debut de partie:
  - `maxOperationalDistanceKm`: 22
  - `radiusKm`: 10
  - `minFactor`: 0.25

## v0.12.3 - 2026-04-02

### Fixed
- Affichage de zone d'influence borne au rayon operationnel (`maxOperationalDistanceKm`) pour eviter une couverture artificiellement enorme avec une seule caserne.

## v0.12.2 - 2026-04-02

### Fixed
- Nouvelle partie / reset: isolation sur le parc vehicules par defaut (plus de pollution par d'anciennes donnees persistees).
- Initialisation de carriere (choix caserne de depart): reconstruction du parc depuis la base par defaut avant creation du VIP initial.
- Reset complet: purge aussi des anciennes cles de stockage legacy (`cta_vehicules`, `cta_casernes`, `cta_interventions`, `cta_settings`).

## v0.12.1 - 2026-04-02

### Fixed
- Correction du cout de debloquage de `Orleans Nord` (plus de caserne a 0 EUR par defaut).

### Added
- Creation de casernes personnalisees depuis le panneau Progression:
  - nom, coordonnees, effectifs poste/astreinte,
  - ouverture immediate en niveau 1,
  - cout dedie `unlockCosts.customCaserne`.

## v0.12.0 - 2026-04-01

### Added
- Initialisation d'un niveau de caserne dans la progression (`niveau 1` par defaut).
- Affichage du niveau de chaque caserne dans le panneau Casernes.

### Changed
- Nouveau demarrage de carriere:
  - caserne initiale choisie par le joueur au premier lancement,
  - vehicule initial unique: `VIP` affecte a la caserne choisie,
  - type initial debloque: `VIP` (tous les autres types restent a debloquer).

## v0.11.3 - 2026-04-01

### Fixed
- Generation des interventions: limitation de la distance operationnelle pour eviter les departs trop lointains hors secteur utile.
- Les profils partiels/degrades contribuant a un besoin manquant sont de nouveau proposes en selection.
- Les options de type `Prompt secours` ne passent plus devant un besoin principal quand un moyen principal plus rapide est disponible.

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

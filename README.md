# CTA-Manager Lite

Jeu de simulation de centre de traitement d'appels pompiers (CTA), 100% front-end (HTML/CSS/JS), sans backend obligatoire.

## Fonctionnement

- Mode local/offline sans serveur applicatif
- Badge visible du mode courant (offline/online) dans le header
- Zone d'influence automatique par caserne (population + distance)
- Choix du departement au premier lancement (packs territoires)
- Progression economique (casernes, types de vehicules, achats d'unites)
- Gestion casernes (niveau, effectifs, garde postee, capacite remise)
- Administration flotte (transfert inter-caserne avec delai de transit)
- Sauvegarde locale + export/import JSON de carriere
- Panneau `A propos` avec version, mode courant et recap release

## Lancer en local (simple)

Option 1 (fichiers statiques):

- Ouvrir `index.html` dans le navigateur
- Note: le mode `file://` ne permet pas toujours le chargement des packs departement (fetch local bloque selon navigateur).

Option 2 (XAMPP):

- Mettre le dossier dans `htdocs`
- Ouvrir `http://localhost/CTA-MANAGER/`

## Lancer avec Docker

Prerequis: Docker Desktop installe.

```bash
docker compose up -d --build
```

Puis ouvrir:

- [http://localhost:8080](http://localhost:8080)

Arreter:

```bash
docker compose down
```

## Structure

- `index.html`: shell principal UI
- `css/`: styles
- `js/`: moteur simulation + UI
- `data/`: configuration, templates, regles metier
  - `data/economy.js`: reference unique des couts/paliers economie
- `docker/`: configuration Nginx
- `packs/`: base territoires (par departement)
- `tools/`: scripts de generation de packs

## Packs departements

Pack actuel inclus pour test:

- `packs/fr/departements/45/communes.json`

Generation automatique depuis une base nationale JSON:

```bash
node tools/build-national-db.js --input tools/sources/communes-fr.sample.json --output packs/fr
```

Format attendu par ligne:

- `dep` (code departement)
- `insee`
- `nom`
- `lat`
- `lon`
- `population`

## Validation des donnees metier

Verifier les codes interventions/couverture avant release:

```bash
node tools/validate-data.js
```

Le script detecte notamment:

- besoins sans regle de couverture (ex: `DIV` au lieu de `DIV3`),
- options avec code inconnu,
- codes invalides dans `coverage-rules.js`.
## Versioning

- Version applicative: `data/settings.js` (`APP_META.version`)
- Historique: `CHANGELOG.md`
- Plan court terme: `ROADMAP.md`

## Publication GitHub Pages (auto)

Un workflow GitHub Actions est fourni:

- Fichier: `.github/workflows/deploy-pages.yml`
- Deploiement automatique a chaque push sur `main`

## Checklist release

Avant chaque release:

1. Mettre a jour `APP_META.version` dans `data/settings.js`.
2. Ajouter l'entree de version dans `CHANGELOG.md`.
3. Verifier le `ROADMAP.md` (ajout/ajustement des items de version).
4. Faire un smoke test:
   - generation intervention
   - engagement selection
   - fin de mission
   - progression (deblocages/achats)
   - export/import backup JSON
5. Push sur `main` et verifier le workflow Pages.
6. Ouvrir l'URL publique et refaire un test rapide.

## Licence

Projet sous licence MIT. Voir `LICENSE`.

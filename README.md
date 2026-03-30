# CTA-Manager Lite

Jeu de simulation de centre de traitement d'appels pompiers (CTA), 100% front-end (HTML/CSS/JS), sans backend obligatoire.

## Fonctionnement

- Mode local/offline sans serveur applicatif
- Progression economique (casernes, types de vehicules, achats d'unites)
- Administration flotte (transfert inter-caserne avec delai de transit)
- Sauvegarde locale + export/import JSON de carriere

## Lancer en local (simple)

Option 1 (fichiers statiques):

- Ouvrir `index.html` dans le navigateur

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
- `docker/`: configuration Nginx

## Versioning

- Version applicative: `data/settings.js` (`APP_META.version`)
- Historique: `CHANGELOG.md`
- Plan court terme: `ROADMAP.md`

## Publication GitHub Pages (auto)

Un workflow GitHub Actions est fourni:

- Fichier: `.github/workflows/deploy-pages.yml`
- Deploiement automatique a chaque push sur `main`

## Licence

Projet sous licence MIT. Voir `LICENSE`.

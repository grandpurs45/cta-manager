# Installation

## 1) Local (simple)

Ouvrir `index.html` dans un navigateur moderne.

## 2) Local avec XAMPP

1. Copier le projet dans `htdocs`
2. Ouvrir:
   - `http://localhost/CTA-MANAGER/`

## 3) Docker (recommande)

Prerequis: Docker Desktop.

```bash
docker compose up -d --build
```

Acces:

- `http://localhost:8080`

Arret:

```bash
docker compose down
```

## 4) Publication GitHub Pages

Le workflow est configure dans:

- `.github/workflows/deploy-pages.yml`

Activation GitHub:

1. `Settings > Pages`
2. `Build and deployment` -> **GitHub Actions**

URL publique:

- `https://<user>.github.io/<repo>/`

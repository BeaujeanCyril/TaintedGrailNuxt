# Tainted Grail - Notes de projet

## Déploiement VPS

- **Serveur**: cyriongames.fr (IP: 37.59.120.247)
- **Utilisateur SSH**: ubuntu
- **Mot de passe SSH**: `FT69rkqznj$$`
- **Chemin sur le serveur**: `/home/ubuntu/apps/taintedgrail`
- **Port de l'application**: 3004
- **Process manager**: PM2 (nom: `taintedgrail`)

### Commande de déploiement (sur le serveur)
```bash
cd /home/ubuntu/apps/taintedgrail && git pull && npm install && npx prisma generate && npx prisma db push && npm run build && ln -sf ../../public .output/server/chunks/public && pm2 restart taintedgrail
```

**Note**: Le symlink `ln -sf ../../public .output/server/chunks/public` est nécessaire après chaque build pour que Nitro serve correctement les fichiers statiques.

### Connexion SSH autonome (depuis Windows)

Utiliser PowerShell avec plink (PuTTY) pour échapper correctement les `$$` du mot de passe :

```powershell
powershell -Command '& "C:\Program Files\Putty\plink.exe" -batch -pw "FT69rkqznj`$`$" ubuntu@37.59.120.247 "<commandes>"'
```

**Déploiement complet en une commande** :
```powershell
powershell -Command '& "C:\Program Files\Putty\plink.exe" -batch -pw "FT69rkqznj`$`$" ubuntu@37.59.120.247 "cd /home/ubuntu/apps/taintedgrail && git pull && npm install && npx prisma generate && npx prisma db push && npm run build && ln -sf ../../public .output/server/chunks/public && pm2 restart taintedgrail"'
```

**Note**: Les backticks (`` ` ``) sont nécessaires pour échapper les `$` dans PowerShell.

## Base de données

- **Type**: PostgreSQL
- **Schéma**: taintedgrail (dans appdb)
- **URL locale**: Voir fichier `.env`

## Keycloak

- **URL**: https://auth.cyriongames.fr
- **Realm**: cyriongames
- **Client ID**: taintedgrail
- **Rôle d'accès**: `taintedgrail.access`

## Structure du projet

- **Framework**: Nuxt 3
- **ORM**: Prisma
- **CSS**: TailwindCSS
- **Base de données**: PostgreSQL

## Modèles de données

- **Campaign**: Contient plusieurs locations
- **Location**: Lieu avec dream/nightmare, menhir, notes
- **Entry**: Entrées numérotées par lieu avec status (explored/partial/unknown)

## Pages

- `/` - Sélection de campagne
- `/campaigns/[id]` - Liste des lieux d'une campagne
- `/campaigns/[id]/locations/[locationId]` - Détail d'un lieu

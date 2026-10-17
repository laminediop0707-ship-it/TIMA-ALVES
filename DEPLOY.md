# Déploiement — Render ou Railway

Le site est prêt à déployer. Tout ce qui suit demande **ton compte** (je ne peux
pas créer de compte ni payer à ta place) : une fois l'hébergeur connecté au
dépôt, tout le reste est déjà configuré dans le code.

- Dépôt : `https://github.com/laminediop0707-ship-it/TIMA-ALVES` (branche `main`)
- Fichiers de déploiement : `render.yaml` (Render) et `railway.json` (Railway)

> ⚠️ **Le point le plus important** : le site enregistre les photos et vidéos sur
> un **disque**. Sur Render et Railway le disque par défaut est *éphémère* : sans
> volume persistant, **tous les médias importés disparaissent à chaque
> redéploiement**. Les deux procédures ci-dessous activent ce volume.

---

## Variables d'environnement

| Variable | Valeur | Obligatoire | Rôle |
| --- | --- | --- | --- |
| `DATABASE_URL` | fournie par la base managée | oui | Connexion PostgreSQL |
| `AUTH_SECRET` | chaîne aléatoire ≥ 32 caractères | oui | Sécurité des sessions |
| `ADMIN_USERNAME` | `lemzo` | oui | Identifiant admin |
| `ADMIN_BOOTSTRAP_PASSWORD` | **ton mot de passe provisoire** | oui | Créé au premier déploiement |
| `SURPRISE_NAME` | `Estère Adousinda Alves` | oui | Nom qui déverrouille la surprise (lu côté serveur) |
| `STORAGE_DIR` | `/var/data/uploads` (Render) ou `/data/uploads` (Railway) | oui | Où sont écrits les médias |
| `SESSION_COOKIE_SECURE` | `true` | oui | Cookie `Secure` (site en HTTPS) |
| `MAX_UPLOAD_SIZE_MB` | `25` | non | Taille maximale d'un fichier |
| `SESSION_TTL_HOURS` | `12` | non | Durée de la session admin |
| `SURPRISE_TTL_HOURS` | `24` | non | Durée du déverrouillage surprise |

Générer un `AUTH_SECRET` :

```bash
# Git Bash / Linux / macOS
openssl rand -base64 48
```

```powershell
# Windows PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))
```

---

## Option A — Render (recommandé)

1. Crée un compte sur <https://render.com> et connecte ton GitHub.
2. **New + → Blueprint**, choisis le dépôt `TIMA-ALVES`, puis **Apply**.
   Render lit `render.yaml` et crée automatiquement :
   - le service web `tima-birthday`,
   - une base PostgreSQL `tima-birthday-db`,
   - un disque persistant `tima-media` monté sur `/var/data`,
   - un `AUTH_SECRET` aléatoire.
3. Render demande la seule valeur secrète : renseigne
   **`ADMIN_BOOTSTRAP_PASSWORD`** (ton mot de passe provisoire admin).
4. Attends la fin du premier déploiement (build ≈ 3–5 min). L'URL publique
   ressemble à `https://tima-birthday-xxxx.onrender.com`.
5. Ouvre l'URL : la page d'accueil doit s'afficher.

> Le disque et le `preDeployCommand` nécessitent le plan **Starter**.
> En plan gratuit il n'y a **pas** de disque persistant : les médias importés
> seraient perdus à chaque déploiement.

---

## Option B — Railway

1. Crée un compte sur <https://railway.app> et connecte ton GitHub.
2. **New Project → Deploy from GitHub repo → `TIMA-ALVES`**.
   Railway détecte `railway.json` pour les commandes de build et de démarrage.
3. Ajoute la base : **New → Database → Add PostgreSQL**.
4. Sur le service web, onglet **Variables**, ajoute toutes les variables du
   tableau ci-dessus. Pour `DATABASE_URL`, clique sur **Add Reference** et
   choisis `DATABASE_URL` de la base PostgreSQL (n'écris pas l'URL à la main).
5. Onglet **Settings → Volumes** : ajoute un volume monté sur **`/data`**
   (et mets `STORAGE_DIR=/data/uploads`).
6. Onglet **Settings → Networking → Generate Domain** pour obtenir l'URL
   publique. Railway fournit déjà le `PORT`, rien à faire.
7. Ouvre l'URL : la page d'accueil doit s'afficher.

---

## Après la mise en ligne — vérification (5 minutes)

1. `https://TON-URL/` → page d'accueil rose/violet s'affiche, signature
   **made by lemzo_biker ❤️** en bas.
2. `https://TON-URL/surprise` → la porte s'affiche. Un mauvais nom doit donner
   *« Oops girl 😭😂 Wrong name ! Try again, birthday queen. »*.
3. Tape **Estère Adousinda Alves** → l'intro, les poèmes, le diaporama et le
   final s'enchaînent. (Le diaporama dit « aucun souvenir » tant que tu n'as rien
   importé : c'est normal.)
4. `https://TON-URL/admin` → connexion avec `ADMIN_USERNAME` /
   `ADMIN_BOOTSTRAP_PASSWORD`. **Le site force le changement de mot de passe.**
5. Change le mot de passe, puis :
   - onglet **Textes** : modifie un titre → **Enregistrer le brouillon** →
     **Confirmer et publier** → recharge `/surprise` : le changement est là.
   - onglet **Mes souvenirs** : importe une photo → publie → la photo apparaît
     dans le diaporama.
   - **Redémarre le service** (Render : Manual Deploy / Railway : Restart) puis
     vérifie que la photo est **toujours** là : c'est le test du disque
     persistant. Si elle disparaît → le volume est mal monté, reprends l'étape
     disque/volume.
6. Depuis ton téléphone : mêmes vérifications (mise en page, swipe, pas de
   débordement horizontal).

---

## Pistes de dépannage

| Symptôme | Cause probable / solution |
| --- | --- |
| Le build échoue sur `npm ci` | Nœud trop ancien. Ajoute `NODE_VERSION=22` (ou `.node-version` avec `22.11.0`) dans les variables d'environnement. |
| `Invalid environment configuration: AUTH_SECRET must be at least 32 characters` | `AUTH_SECRET` manquant ou trop court. |
| Les médias disparaissent après un déploiement | Disque/volume absent ou `STORAGE_DIR` ≠ chemin de montage (`/var/data/uploads` sur Render, `/data/uploads` sur Railway). |
| `Can't reach database server` | `DATABASE_URL` absent, ou la base est dans une autre région/service. Sur Render, utilise la référence `fromDatabase` (déjà fait dans le blueprint). |
| La surprise reste verrouillée après le bon nom | `SURPRISE_NAME` doit correspondre exactement au nom (accents, espaces et casse sont tolérés automatiquement). |
| Mot de passe admin perdu | Change `ADMIN_BOOTSTRAP_PASSWORD` puis lance `npm run db:seed -- --reset` (shell du service, ou localement avec `DATABASE_URL` de production). |

---

## Notes de sécurité

- `.env` n'est **jamais** dans le dépôt (vérifié) : les secrets vivent uniquement
  dans les variables d'environnement de l'hébergeur.
- Le dépôt GitHub est **public**. Pense à le passer en privé
  (Settings → General → Danger Zone → Change visibility) si tu préfères.
- Le « cadenas » de `/surprise` est un jeu, pas une vraie protection : le nom est
  comparé côté serveur, mais il ne faut pas y mettre de contenu sensible.
- Les médias importés sont stockés hors du dossier public et servis par une route
  contrôlée (`nosniff`, type MIME forcé, aucun fichier exécutable accepté).

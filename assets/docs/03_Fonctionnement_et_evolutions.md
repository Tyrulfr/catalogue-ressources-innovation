# Fonctionnement actuel et modifications à prévoir
## Du fichier Excel au JSON produit par requête

**Date** : 8 octobre 2026

---

## 1. Comment ça marche aujourd’hui

```
Fichier Excel (inventaire métier)
        ↓  import manuel (déjà fait une fois)
data/catalog.json  (ce que le site lit)
        ↓
Navigateur : pages, recherche, fiches
        ↓  (à éviter en production)
Mémoire du navigateur (localStorage) si quelqu’un clique « Modifier »
```

- **`ouvrir.py`** : uniquement pour tester **en local**. En production, l’hébergeur sert les fichiers.
- **Le site ne lit pas l’Excel.** Il lit uniquement `catalog.json`.
- **Modifier une fiche dans le navigateur** n’envoie rien vers un serveur. Ça reste sur **cet** ordinateur.
- Pour que tout le monde voie une correction : il faut **changer `catalog.json`** et **republier** le site.

Analogie : l’Excel (ou Grist) est le **classeur**. Le JSON est la **photocopie** que le site affiche.

---

## 2. Cible : une requête qui fabrique le JSON

C’est déjà comme ça qu’il faut l’envisager : **on ne « bricole » plus le JSON à la main**. On part des tables (formations, lieux, etc.) et on **assemble** le fichier `catalog.json` par une requête.

**L’idéal, si les données sont dans une base SQL** (PostgreSQL, SQLite, etc.) :

- une (ou quelques) requêtes `SELECT` qui reconstruisent la structure attendue par le site (`meta`, `definitions`, `collections`) ;
- PostgreSQL : `json_build_object`, `json_agg` ;
- SQLite : `json_object`, `json_group_array`.

Le site, lui, continue de faire `fetch("data/catalog.json")`. Les visiteurs n’exécutent pas de SQL.

**Si le maître est Grist** (piste Suite / saisie à plusieurs) :

- Grist n’est **pas** du SQL « classique » au quotidien (on saisit dans des tables / vues).
- L’esprit est le **même** : extraire les tables et **produire le JSON**.
- Trois montages possibles :
  1. **Grist → copie dans SQLite ou PostgreSQL** → **requête SQL** → `catalog.json` (le plus proche de « une requête SQL ») ;
  2. **API Grist** (requête HTTP, pas SQL) qui ramène les lignes, puis assemblage du JSON ;
  3. export CSV, puis SQL sur un fichier SQLite.

Donc : **oui, SQL si on pose (ou recopie) les données dans une base SQL**.  
**Sinon**, ce n’est pas du SQL, mais c’est **la même idée** : une extraction reproductible, pas un copier-coller.

Le site public n’a pas besoin d’une base ouverte sur Internet. La base / Grist sert **en amont**, au moment de publier.

---

## 3. Ce qu’il faudrait changer pour une prod saine

| Aujourd’hui | Demain (recommandé) |
|---|---|
| Édition possible dans le site | Site **lecture seule** pour les visites |
| Excel + JSON fabriqué une fois | Tables maîtres + **requête (SQL de préférence)** → JSON |
| `localStorage` | Ignoré ou désactivé en ligne |
| Publication = copie informelle | Lancer la requête, déposer `catalog.json`, mettre en ligne |

Le site (parcours, recherche, fiches) peut **rester**. On change **où on saisit** et **comment le JSON est produit**.

Évolution de code utile : **masquer** création / édition / suppression / restauration Excel sur la version en ligne.

---

## 4. Où saisir (le maître)

### A. Excel / tableur partagé

Déjà là. Fragile dès qu’il y a plusieurs mains. Pour viser le SQL : importer l’Excel dans SQLite / PostgreSQL, puis écrire la requête JSON.

### B. Grist (saisie) + SQL (publication)

Grist : droits, historique, 10 tables = 10 types. Les contributeurs PUI saisissent **dans Grist**.  
Publication : synchro (ou export) vers SQL, **puis requête SQL → `catalog.json`**.

À vérifier côté DSI si Grist / Suite est disponible.

### C. Base SQL seule

Si la DSI fournit PostgreSQL (ou équivalent) et un petit outil de saisie, on peut tout tenir en SQL : saisie (interface ou tableur lié) + **requête de publication**. Plus d’Excel au milieu.

---

## 5. Schéma cible

```
Contributeurs habilités  →  Grist ou tables SQL
                                    ↓
                    requête SQL (idéal)
                    ou API / export équivalent
                                    ↓
                              catalog.json
                                    ↓
                    Site en lecture seule (HTTPS)
```

---

## 6. Autres outils (même rôle que Grist)

Airtable, Baserow, NocoDB : saisie structurée. Le JSON, lui, sort d’une **requête ou d’un export scripté**, pas du site.

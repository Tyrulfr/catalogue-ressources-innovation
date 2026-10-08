# Mise en service du catalogue
## Note de projet

**Outil** : Catalogue de ressources innovation & entrepreneuriat  
**Porteur** : Pôle universitaire d’innovation (PUI) — Université Paris-Saclay  
**Date** : 8 octobre 2026  
**Statut** : cadrage pour une mise en service

---

## 1. Objet

Passer du **prototype local** (ouvert avec `ouvrir.py` sur un ordinateur) à un **service consultable** par les équipes PUI, avec un responsable, un rythme de mise à jour, et un cadrage (données, hébergement, lecture seule).

Ce n’est pas le lancement d’un SI. C’est la **mise en service d’un site statique** alimenté par un fichier d’inventaire.

---

## 2. Ce qui est déjà là

- Un site HTML / CSS / JavaScript, sans base de données.
- Un inventaire `data/catalog.json` (~318 fiches, 10 types).
- Une source métier historique : fichier Excel.
- Navigation par besoin (se former, concevoir, s’appuyer), recherche, fiches, orientation par mail.
- Identité Paris-Saclay / Oser pour innover.

Le code du site est simple. La mise en service dépend surtout de **où on l’héberge**, **qui met à jour les fiches**, et **ce qu’on a le droit de publier** (contacts, mails).

---

## 3. Périmètre de la mise en service

**Inclus**
- Publication du catalogue en consultation.
- Désignation d’un référent contenu et d’un geste de publication.
- Décision sur le fichier maître (Excel, Grist, base SQL) — voir document 03.
- Cible : **une requête (idéalement SQL)** qui produit `catalog.json`.
- Version publique **sans** édition dans le navigateur.

**Exclus à ce stade**
- Comptes utilisateurs, workflow de validation dans le site.
- Application mobile native.
- Synchronisation automatique temps réel (sauf si on la décide plus tard).

---

## 4. Étapes proposées

| Étape | Livrable | Qui |
|---|---|---|
| 1. Décider le niveau | Démo interne **ou** service publié | PUI + éventuellement DSI |
| 2. Cadrer les données | Contacts affichables ou non (RGPD) | PUI + DPD / DSI |
| 3. Choisir le fichier maître | Excel, Grist, ou tables SQL | PUI + accompagnement technique |
| 4. Héberger | URL HTTPS, idéalement Université | DSI ou Pages (transitoire) |
| 5. Désactiver l’édition publique | Site en lecture seule | Ajustement du site |
| 6. Publier une première version | JSON produit par requête + fichiers du site | Personne maîtrisant le code assisté par IA |
| 7. Rythme | Ex. mise à jour mensuelle | Référent contenu |

---

## 5. Critères de « site en service »

- Une URL stable, ouvrable sans Python ni fichier local.
- Les visiteurs **consultent** ; ils ne « sauvent » pas le catalogue pour tout le monde.
- On sait **qui** corrige une fiche et **comment** elle arrive en ligne.
- Un contact PUI est affiché (`formation.innovation@universite-paris-saclay.fr`).

---

## 6. Documents associés

- `02_Besoins_mise_en_production.md`
- `03_Fonctionnement_et_evolutions.md`
- `04_Maintenance_et_competences.md`

# Maintenance, calendrier et compétences
## Catalogue de ressources innovation & entrepreneuriat

**Date** : 8 octobre 2026

---

## 1. Profils

**Contenu (PUI)**  
Référent et contributeurs habilités : ils tiennent les fiches dans le maître (Grist, tableur, ou tables SQL). Ils n’ont pas à modifier le code du site.

**Chaîne technique**  
Une personne qui **maîtrise les outils de code assisté par IA** (idéalement avec une pratique de codeur, même partielle) : requête de publication JSON, lecture seule, dépôt des fichiers, évolutions ponctuelles du site.

L’IA accélère l’écriture de la requête SQL (ou de l’équivalent API), les tests, et les ajustements. Elle ne remplace pas la validation métier des fiches, ni le cadrage RGPD / hébergement Université.

---

## 2. Trois maintenances (ne pas les mélanger)

### A. Contenus (quotidien / mensuel)

| | |
|---|---|
| **Quoi** | Ajouter ou corriger une fiche |
| **Où** | Fichier maître (Excel aujourd’hui ; Grist ou SQL demain) — pas le site public |
| **Quand** | Dès qu’une info change ; revue **mensuelle** souvent suffisante |
| **Qui** | Référent PUI, contributeurs habilités |
| **Compétence** | Outil de saisie (tableur / Grist). Pas le code du site |

C’est l’essentiel de la vie du catalogue.

### B. Publication (geste technique)

| | |
|---|---|
| **Quoi** | Exécuter la **requête** (SQL de préférence) ou l’export équivalent → `catalog.json`, puis mettre le site à jour |
| **Où** | Base / Grist + dossier du site / Git / serveur web |
| **Quand** | Après une série de corrections (ex. une fois par mois) |
| **Qui** | Personne à l’aise avec le code assisté par IA |
| **Compétence** | Lancer la requête, vérifier le JSON, déployer |

Sans ce geste, le site affiche l’ancien inventaire.

### C. Site (ponctuel)

| | |
|---|---|
| **Quoi** | Lecture seule, nouveau type de ressource, mentions, correctif |
| **Où** | `js/`, `styles.css`, `index.html`, éventuellement la requête SQL |
| **Quand** | Quelques fois par an |
| **Qui** | Même profil (code assisté par IA), ou codeur |

---

## 3. Calendrier type

| Moment | Action |
|---|---|
| Mise en service | Hébergement + lecture seule + **première requête JSON** validée |
| Chaque mois | Mise à jour des tables, relance de la requête, publication |
| Chaque année | Liens, contacts, mention RGPD |
| Passage Grist / SQL | Recopie des tables, écriture de la requête, abandon de l’Excel au quotidien |

Pas d’astreinte. Pas de serveur applicatif à « redémarrer » pour le site statique. La base SQL, si elle existe, est un outil de **back-office**, pas le site public.

---

## 4. Besoins pour la mise en œuvre

**Côté métier**
- Temps PUI pour valider et saisir les fiches.
- Règle claire : le site **montre**, le maître **enregistre**.

**Côté technique**
- Hébergement HTTPS.
- Maître de données + **requête de publication** (SQL si les données sont en base ; sinon équivalent API / export — voir document 03).
- Une personne qui maîtrise le **code assisté par IA** pour tenir cette chaîne.

**Cadrage**
- Échange DSI / DPD avant une URL publique (contacts dans les fiches).

---

## 5. Ce que l’IA peut (et ne peut pas) faire ici

**Elle peut** aider à rédiger la requête SQL (ou l’appel API Grist), assembler le JSON au format du site, masquer l’édition publique, expliquer un fichier.

**Elle ne peut pas** décider quelles données personnelles afficher, obtenir l’hébergement Université, ni remplacer le référent qui connaît les formations.

---

## 6. En une phrase

On maintient **des tables** ; on **interroge** (idéalement en SQL) pour produire `catalog.json` ; le site n’est que la vitrine. La compétence technique utile est la **maîtrise du code assisté par IA**, pas une équipe de développement permanente.

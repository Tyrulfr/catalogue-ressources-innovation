# Besoins pour une mise en production
## Catalogue de ressources innovation & entrepreneuriat

**Date** : 8 octobre 2026

Ce document liste ce qu’il faut **avoir** avant d’annoncer le catalogue comme un service, pas seulement une démo sur un Mac.

---

## 1. Technique (léger)

| Besoin | Pourquoi | Niveau |
|---|---|---|
| Hébergement de fichiers statiques (HTTPS) | Servir HTML, CSS, JS, JSON, logos | Obligatoire |
| URL connue (idéalement Université) | Crédibilité, pérennité | Fortement recommandé |
| Version **lecture seule** | Les boutons Ajouter / Modifier / Supprimer ne mettent pas à jour le catalogue pour tous | Obligatoire en public |
| Ne plus s’appuyer sur `localStorage` en prod | Une vieille copie locale peut masquer le fichier officiel | Obligatoire en public |
| Sauvegarde du `catalog.json` (Git ou copie datée) | Pouvoir revenir en arrière | Obligatoire |
| Chaîne **tables → requête → JSON** | Ne plus fabriquer le JSON à la main | Fortement recommandé |

Le site public reste un site **statique** (pas de comptes, pas d’appli mobile). La base SQL, si on l’adopte, sert à **générer** le JSON, pas à être interrogée par chaque visiteur.

---

## 2. Données et droit

| Besoin | Pourquoi | Niveau |
|---|---|---|
| Avis RGPD / DPD | Noms et mails dans les fiches = données personnelles une fois le JSON en ligne | Bloquant si publication large |
| Règle d’affichage | Quels champs restent publics (lien, titre) vs internes (mail) | Fortement recommandé |
| Qualité minimale | Liens cliquables, établissements homogènes, contacts à jour | Recommandé avant com’ large |
| Fichier maître identifié | Une seule source de vérité (plus d’Excel + JSON + mémoire navigateur) | Obligatoire |

---

## 3. Organisation

| Besoin | Pourquoi |
|---|---|
| Référent contenu PUI | Qui décide qu’une fiche entre ou sort |
| Geste de publication | Qui lance la requête / l’export et dépose `catalog.json` |
| Rythme | Mensuel suffit souvent ; plus fréquent si le fichier maître est partagé (Grist) |
| Distinction de périmètre | Ce n’est pas un annuaire de laboratoires | 

---

## 4. Institutionnel

- Charte graphique et logos (déjà en place).
- Mentions légales / contact (le mail existe ; une page courte peut être demandée par l’Université).
- Accessibilité (RGAA) si le service est officiel : le site est simple, **pas encore audité**.

---

## 5. Dimensionnement

- Pas un SI à équipe dédiée, ni une refonte WordPress / CRM.
- Les contributeurs métier n’ont pas à coder : ils saisissent dans le maître (Grist, tableur, ou interface SQL).
- La chaîne technique (requête JSON, lecture seule, mise en ligne) est portée par une personne **à l’aise avec les outils de code assisté par IA**, éventuellement un codeur.

On a besoin d’**une décision** (interne vs public), d’**un hébergement**, d’**un maître de données**, d’**une requête de publication**, et d’**un responsable contenu**.

---

## 6. Points durs (rappel)

1. **Mails et noms** dans un fichier public.  
2. **Illusion d’édition** si on laisse les boutons actuels.  
3. **Hébergement Université** vs GitHub perso.  
4. **Qui maintient** dans six mois.

Détail du fonctionnement actuel et des évolutions (Excel → serveur / Grist) : document 03.

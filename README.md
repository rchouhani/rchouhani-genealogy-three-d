<!-- BANNIÈRE : une capture large de la scène 3D, sans données réelles -->

# 🌳 Genealogy3D

**Application web de visualisation généalogique en 3D.**

[🔗 Voir le site en ligne](#)

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?logo=threedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

---

## 📸 Aperçu

<!-- 1 à 3 captures ou un GIF court, avec des données fictives uniquement -->

*Captures à ajouter.*

---

## 🎯 Contexte

Projet réalisé **pour un client** : une application web proposant une approche visuelle et interactive de la généalogie, en trois dimensions.

J'ai pris en charge la conception technique et le développement complet : interface, scène 3D, API, base de données, authentification.

**Statut :** démarré en septembre 2025, première version en phase de tests utilisateurs livrable en Décembre 2026.

> Le détail fonctionnel du produit appartient au client et n'est volontairement pas décrit ici.

---

## ✨ Ce que le projet couvre

- Rendu **3D interactif** dans le navigateur, avec animations fluides
- Gestion de données relationnelles complexes (graphe de personnes)
- **Comptes utilisateurs** avec connexion Google et données privées par compte
- Interface de consultation, d'édition et de filtrage
- Protection des données personnelles
- Recueil de retours utilisateurs intégré

---

## 🧰 Stack technique

| Technologie | Rôle |
|---|---|
| **Next.js (App Router)** | Front et API dans un même projet |
| **React + TypeScript** | Interface et typage strict |
| **Three.js** | Rendu 3D et interactions |
| **PostgreSQL (Neon)** | Base de données managée |
| **Drizzle ORM** | Schéma typé et migrations |
| **NextAuth** | Authentification OAuth |
| **Jest + Testing Library** | Tests unitaires et de composants |
| **Tailwind CSS** | Mise en forme |

---

## 🧗 Défis techniques

- **Interactions 3D fluides :** gérer la détection de survol et de clic dans une scène dense sans saccades ni comportements parasites, avec des animations cohérentes.
- **Logique métier testable :** isoler les calculs du rendu 3D pour les couvrir par des tests unitaires (approche TDD).
- **Protection des données personnelles :** mise en place d'une authentification, d'une isolation des données entre utilisateurs et d'un chiffrement des informations sensibles.
- **Évolution d'un schéma en production :** faire évoluer le modèle de données sans perte d'informations existantes.
- **Environnement serverless :** composer avec les contraintes d'un hébergement et d'une base managée.

---

## 📚 Ce que j'ai appris

- Concevoir et livrer une application complète, du modèle de données à l'interface 3D
- Séparer logique métier et rendu pour garder un code testable
- Aborder la sécurité en profondeur plutôt que par une seule protection
- Diagnostiquer méthodiquement un bug avant de le corriger
- Arbitrer entre les demandes d'un client, les délais et la qualité

---

**Développé par [Romain Chouhani](https://www.linkedin.com/in/romain-chouhani-334b1586/)

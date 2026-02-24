Feature: Recherche de membres dans l'arbre généalogique
  En tant qu'utilisateur avec un arbre de plus de 10 personnes
  Je veux rechercher des membres par leur nom
  Afin de les localiser rapidement dans la scène 3D

  Background:
    Given la base de données contient 10 membres
    And le moteur de recherche est visible en haut de la scène

  Scénario: Rechercher et centrer sur un membre existant
    When l'utilisateur tape "Jean" dans le champ de recherche
    Then les résultats affichent "Jean Dupont (Gén. 0)"
    When l'utilisateur clique sur "Jean Dupont" dans les résultats
    Then la caméra se centre sur le point correspondant à Jean Dupont
    And le champ de recherche se vide

  Scénario: Rechercher un membre inexistant
    When l'utilisateur tape "Elisabeth" dans le champ de recherche
    Then le message "Aucun résultat pour « Elisabeth »" s'affiche
    And aucun résultat n'est affiché dans la liste

  Scénario: Filtrage en temps réel
    When l'utilisateur tape "J" dans le champ de recherche
    Then les résultats affichent tous les membres dont le prénom ou le nom contient "J"
    When l'utilisateur efface "J" et tape "Ma"
    Then les résultats se mettent à jour instantanément
    And seuls les membres contenant "Ma" sont affichés

  Scénario: Ouvrir le formulaire d'ajout depuis la recherche
    When l'utilisateur clique sur le bouton "+" dans le moteur de recherche
    Then le formulaire d'ajout de membre s'ouvre
    And tous les champs sont vides
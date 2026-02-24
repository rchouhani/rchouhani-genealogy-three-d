Feature: Ajouter un membre à l'arbre généalogique
    
    Scénario: Ajouter le premier membre
        Given La base de donnée est vide
        When L'utilsateur clique sur le bouton "+"
        And L'utilisateur écris "Prénom" "Jean"
        And L'utilisateur écris "Nom" "Dupont"
        And L'utilisateur clique sur "ajouter"
        Then Un point bleu apparaît sur la scène
        And Le point affiche "Jean Dupont" au hover


    Scénario: Ajouter un autre membre
        Given "Jean Dupont" existe en base de donnée
        When L'utilsateur clique sur le bouton "+"
        And L'utilisateur écris "Prénom" "SOphie"
        And L'utilisateur écris "Nom" "Dupont"
        And Sélectionne la relation "child"
        And Sélectionne la personne "Jean Dupont"
        And Clique sur "ajouter"
        Then Je vois deux points reliés par un trait vert
        And "Sophie" apparaît dans "personne de référence"
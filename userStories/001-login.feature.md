Feature: Input de création de compte ou login pour accéder au site
    
    Scénario: Créer son compte
        Given Login Page s'affiche avec le formulaire : mail, nom, prénom, MDP, coonfirmer MDP
        When L'utilsateur vois le formulaire de création de compte
        And L'utilisateur écris "mail" "jean.dupont@gmail.com"
        And L'utilisateur écris "Prénom" "Jean"
        And L'utilisateur écris "Nom" "Dupont"
        And L'utilisateur écris "MDP" "1234"
        And L'utilisateur écris "confimer MDP" "1234"
        And L'utilisateur clique sur "Créer"
        Then Passe à la Homepage


    Scénario: Connexion à son compte
        Given "Jean Dupont" existe en base de donnée
        When L'utilsateur vois le formulaire de connexion
        And L'utilisateur écris "mail" "jean.dupont@gmail.com"
        And L'utilisateur écris "MDP" "1234"
        And Clique sur "Se connecter"
        Then Passe à la HomePage
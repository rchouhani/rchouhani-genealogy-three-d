### Problème potentiel à venir ###

Fichiers concernés : 
- TreeScene.tsx 
- page.tsx
Problème potentiel : 
- fuite de mémoire
- canvas zombie
- interactions incohérentes
Solutions à envisager : 
1. Gérer le cleanup de montage / démontage du composant treescene
2. En dév, passer next.config.js { reactStrictMode: false, } : 
    -   Peut potentiellement cacher des problèmes en développement et
        du coup, ces derniers ne seraient visible qu'en prod'
3. dans le fichier layout.tsx :
    <React.StrictMode>
        {children}
    </React.StrictMode>
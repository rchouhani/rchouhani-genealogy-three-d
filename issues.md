### Problème potentiel à venir ###

Fichiers concernés : 
- TreeScene.tsx 
- page.tsx
Problème potentiel : 
- fuite de mémoire
- canvas zombie
- interactions incohérentes
Solutions à envisager : 
- Gérer le cleanup de montage / démontage du composant treescene
- En dév, passer next.config.js { reactStrictMode: false, }
- dans le fichier layout.tsx :
    <React.StrictMode>
        {children}
    </React.StrictMode>
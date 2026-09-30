# Nove Porte — sito Angular

Il sito è separato dall'app Ionic nella cartella superiore. La homepage, l'accesso Fortezza e i contenuti pubblici importati sono serviti da Angular 17.

## Avvio locale

In PowerShell:

```powershell
$env:NOVEPORTE_FORTEZZA_PASSWORD='<password>'
npm start
```

L'anteprima è disponibile su `http://127.0.0.1:4201/`. La password viene verificata dal server locale e non viene inserita nel bundle Angular.

## Sincronizzazione contenuti

```powershell
npm run sync
```

Il sincronizzatore parte dalla sitemap, segue i collegamenti interni, elimina script e attributi eseguibili del vecchio WebForms e genera i file sotto `public/content/`.

## Build

```powershell
npm run build
```

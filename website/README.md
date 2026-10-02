# Nove Porte — sito Angular

Il sito è separato dall'app Ionic nella cartella superiore. La homepage, l'accesso Fortezza e i contenuti pubblici importati sono serviti da Angular 17.

## Avvio locale

Copi `/.env.example` come `/.env.local` e valorizzi le variabili soltanto nel file locale:

```text
NOVEPORTE_FORTEZZA_PASSWORD=...
NOVEPORTE_WEBSITE_API_TOKEN=...
NOVEPORTE_APP_API_ORIGIN=http://127.0.0.1:5080
NOVEPORTE_APP_ASSET_ORIGIN=https://server-pubblico.example
NOVEPORTE_API_PORT=4300
```

Poi avvii normalmente:

```powershell
npm start
```

Il file `.env.local` è escluso dal controllo versione. In alternativa si possono usare variabili d'ambiente di sistema con gli stessi nomi. L'anteprima è disponibile su `http://127.0.0.1:4201/`; password, token e origine API non vengono inseriti nel bundle Angular.

## Token server del sito

Il Libro Soci usa un token statico con identità `sitoweb`. Il token non è presente nel bundle Angular: il browser chiama `/api/site/members` dopo l'accesso alla Fortezza e il server del sito aggiunge il token nella chiamata verso le nuove API.

Configurare lo stesso valore in entrambi gli ambienti:

- sito: `NOVEPORTE_WEBSITE_API_TOKEN`;
- API: `WebsiteAccess__Token`, equivalente alla chiave di configurazione `WebsiteAccess:Token`.

Il criterio `WebsiteOrMember` è applicato soltanto a `GET /api/app/members`. Le altre API continuano a rifiutare il token `sitoweb`.

## Sincronizzazione contenuti

```powershell
npm run sync
```

Il sincronizzatore parte dalla sitemap, segue i collegamenti interni, elimina script e attributi eseguibili del vecchio WebForms e genera i file sotto `public/content/`.

## Build

```powershell
npm run build
```

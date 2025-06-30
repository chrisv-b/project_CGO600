# CGO600 Flash Service

## Installatie
1. Clone deze repository
2. Installeer dependencies:
   ```
   npm install
   ```
3. Zet je firmwarebestand in `lib/firmware.bin`
4. Vul een `.env` bestand in op basis van `.env.example`

## Gebruik
- Start lokaal met:
  ```
  npm run dev
  ```
- Deploy naar Vercel via GitHub of met:
  ```
  npm run deploy
  ```

## Veiligheid
- Firmware is **niet** te downloaden, alleen te installeren via `/api/install-firmware`
- API's zijn beveiligd met CORS, rate limiting en input validatie
- Voeg zelf authenticatie toe voor productiegebruik

## Deploy
- Push naar GitHub, Vercel pakt automatisch de nieuwste versie
- Zet secrets in Vercel Environment Variables

## Overige
- Zie PRIVACY.md voor privacyverklaring 
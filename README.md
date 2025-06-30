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

## Activatiecodes beheer

De activatiecodes worden nu opgeslagen in Upstash Redis (Vercel KV), niet meer in een lokaal JSON-bestand. Dit werkt zowel lokaal als op Vercel.

### Setup
1. Maak een Upstash Redis database aan via Vercel (Marketplace > Upstash).
2. Koppel de database aan je project. De benodigde environment variables worden automatisch toegevoegd.
3. Installeer de Upstash Redis SDK:
   ```
npm install @upstash/redis
   ```
4. Trek de environment variables lokaal binnen:
   ```
vercel env pull .env.development.local
   ```

### Gebruik
- Alle API endpoints gebruiken nu Upstash Redis voor het lezen en schrijven van activatiecodes.
- Tokens worden opgeslagen als JSON in een Redis hash met key `tokens`. 
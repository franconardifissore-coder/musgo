# Deployment — Musgo Mobile

## Dónde está hosteada

La app está publicada en **Expo EAS Update** y se consume a través de **Expo Go**.

- **Proyecto:** https://expo.dev/accounts/fnardi/projects/musgo
- **Branch activo:** `main`
- **Runtime version:** `0.1.0` (sincronizado con `version` en `app.json`)
- **Bundle ID:** `com.musgo.app`

## ⚠️ Antes de probar cambios

**Siempre hacer commit antes de publicar un update.** EAS Update toma el estado actual del código, no del último commit. Si publicas sin commitear, el update en producción no coincide con lo que está en git.

Flujo correcto:

```bash
git add .
git commit -m "descripción del cambio"
eas update --branch main --message "descripción del cambio" --platform ios
```

## Cómo publicar un update

```bash
cd ~/Documents/GitHub/musgo/mobile
eas update --branch main --message "descripción" --platform ios
```

El update llega automáticamente a Expo Go la próxima vez que se abre la app.

## Cómo probar localmente (sin publicar)

```bash
cd ~/Documents/GitHub/musgo/mobile
npx expo start
```

Escanear el QR con la cámara del iPhone (con Expo Go instalado) o usar tunnel si no están en la misma red:

```bash
npx expo start --tunnel
```

## Variables de entorno

Las claves de Supabase se leen de `.env` (no commiteado). Para el build de EAS están configuradas como secrets en el proyecto de Expo.

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Historial de updates

| Fecha | Versión | Mensaje | Update ID |
|-------|---------|---------|-----------|
| 2026-06-07 | 0.1.0 | v0.1.0 | `019ea19d-7f6d-70a1-bcb6-8caa018ca3ed` |

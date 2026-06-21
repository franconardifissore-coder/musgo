# Musgo Design System — Expo / React Native

Drop the `musgo-theme/` folder into your Expo project and import from it directly.

---

## 1. Install dependencies

No extra packages needed beyond what Expo ships with. The context hook uses React, which is already there.

---

## 2. Load fonts

TikTok Sans is the sole typeface. Download the `.ttf` files from [Google Fonts](https://fonts.google.com/specimen/TikTok+Sans) and place them in `assets/fonts/`. Then load them once at app startup:

```ts
// App.tsx or app/_layout.tsx
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'TikTokSans-Light':     require('./assets/fonts/TikTokSans-Light.ttf'),
      'TikTokSans-Regular':   require('./assets/fonts/TikTokSans-Regular.ttf'),
      'TikTokSans-Medium':    require('./assets/fonts/TikTokSans-Medium.ttf'),
      'TikTokSans-SemiBold':  require('./assets/fonts/TikTokSans-SemiBold.ttf'),
      'TikTokSans-Bold':      require('./assets/fonts/TikTokSans-Bold.ttf'),
      'TikTokSans-ExtraBold': require('./assets/fonts/TikTokSans-ExtraBold.ttf'),
    }).then(() => {
      setReady(true);
      SplashScreen.hideAsync();
    });
  }, []);

  if (!ready) return null;
  return <App />;
}
```

---

## 3. Wrap your app in the theme provider

```tsx
import { MusgoThemeProvider } from './musgo-theme';

export default function App() {
  return (
    <MusgoThemeProvider>
      <YourNavigator />
    </MusgoThemeProvider>
  );
}
```

---

## 4. Use in components

```tsx
import { StyleSheet, Text, View } from 'react-native';
import { useMusgoTheme } from './musgo-theme';

export function PlantCard({ name }: { name: string }) {
  const { colors, spacing, radii, shadows, textStyles } = useMusgoTheme();

  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.surfaceCard,
        borderRadius: radii.card,
        padding: spacing.s4,
        ...shadows.sm }
    ]}>
      <Text style={[textStyles.overline, { color: colors.textMuted }]}>
        In your care
      </Text>
      <Text style={[textStyles.h3, { color: colors.textStrong }]}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
});
```

---

## 5. Cherry-pick without the provider

```ts
import { colors, spacing, textStyles, shadows } from './musgo-theme';
```

---

## Token reference

| File | What's inside |
|---|---|
| `colors.ts` | `palette` (raw scale) + `colors` (semantic aliases) |
| `typography.ts` | `fonts`, `fontSize`, `lineHeight`, `textStyles` presets |
| `spacing.ts` | `spacing`, `radii`, `shadows`, `duration`, `easing`, `zIndex` |
| `index.ts` | Re-exports everything + `theme` object + `useMusgoTheme()` hook |

---

## Shadow note

React Native requires separate iOS (`shadowColor` / `shadowOffset` / `shadowOpacity` / `shadowRadius`) and Android (`elevation`) shadow props. The `shadows` object includes both — spread them directly onto your `View` style and they resolve correctly per platform.

```tsx
<View style={{ ...shadows.md, backgroundColor: colors.surfaceCard }}>
```

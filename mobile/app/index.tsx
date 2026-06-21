/**
 * Entry point. La decisión real de adónde mandar al usuario la toma
 * RootLayout en función de la sesión. Este componente queda como
 * placeholder para que Expo Router no pierda el index.
 */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)" />;
}

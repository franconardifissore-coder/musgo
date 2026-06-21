/**
 * ProfileCard: header con avatar + email + stats.
 * Fondo en gradient verde suave para dar sensación de profundidad,
 * coincidiendo con el patrón web (`profile-head` tiene gradient radial).
 */

import { Text as RNText } from 'react-native';
import { Box } from '@/components/primitives/Box';
import { Text } from '@/components/primitives/Text';
import { GradientBrandSoft } from '@/components/ui/Gradient';
import { useTheme } from '@/theme/ThemeProvider';

export interface ProfileStat {
  label: string;
  value: string | number;
}

export interface ProfileCardProps {
  email: string;
  avatarEmoji?: string;
  stats: ProfileStat[];
}

export function ProfileCard({
  email,
  avatarEmoji = '🌿',
  stats,
}: ProfileCardProps) {
  const theme = useTheme();
  const name = email.split('@')[0] ?? email;

  return (
    <GradientBrandSoft
      style={{
        borderRadius: theme.radii.lg,
        ...theme.shadows.sm,
      }}
    >
      <Box gap="4" align="center" p="6">
        <Box
          align="center"
          justify="center"
          radius="pill"
          bg="brandSoft"
          style={{ width: 80, height: 80 }}
        >
          <RNText style={{ fontSize: 40, lineHeight: 50 }}>{avatarEmoji}</RNText>
        </Box>
        <Box gap="1" align="center">
          <Text variant="h1">{name}</Text>
          <Text variant="bodySmall" color="textMuted">
            {email}
          </Text>
        </Box>
        {stats.length > 0 ? (
          <Box
            direction="row"
            mt="2"
            style={{
              alignSelf: 'stretch',
              borderTopWidth: 1,
              borderTopColor: theme.colors.borderSubtle,
              paddingTop: 16,
            }}
          >
            {stats.map((stat) => (
              <Box key={stat.label} flex={1} align="center" gap="1">
                <Text variant="h1">{stat.value}</Text>
                <Text variant="caption" color="textMuted">
                  {stat.label}
                </Text>
              </Box>
            ))}
          </Box>
        ) : null}
      </Box>
    </GradientBrandSoft>
  );
}

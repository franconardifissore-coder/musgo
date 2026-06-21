/**
 * Type declaration para imports de .svg como componentes React Native via
 * react-native-svg-transformer. Sin esto, TS no sabe el tipo del default
 * export y los imports fallan.
 */
declare module '*.svg' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';
  const content: FC<SvgProps>;
  export default content;
}

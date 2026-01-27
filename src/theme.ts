import { extendTheme, withDefaultColorScheme } from '@chakra-ui/react';
import type { ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme(
  {
    config,
    colors: {
      brand: {
        50: '#e6f6ff',
        100: '#c4e7ff',
        200: '#9bd6ff',
        300: '#6fbfff',
        400: '#3fa2ff',
        500: '#1f86ff',
        600: '#1469db',
        700: '#0d4ead',
        800: '#09387f',
        900: '#04224f',
      },
    },
    fonts: {
      heading: "'Space Grotesk','Inter','Segoe UI',system-ui,sans-serif",
      body: "'Space Grotesk','Inter','Segoe UI',system-ui,sans-serif",
    },
    styles: {
      global: {
        body: {
          bg: 'gray.50',
          color: 'gray.800',
        },
      },
    },
    components: {
      Card: {
        baseStyle: {
          rounded: 'xl',
          borderWidth: '1px',
          borderColor: 'gray.100',
          boxShadow: 'sm',
        },
      },
    },
  },
  withDefaultColorScheme({ colorScheme: 'brand' }),
);

export default theme;

module.exports = {
  // Matches the theme's breakpoints: 480, 768, 900, 1024 and 1240px.
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '30em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '56.25em',
        'mantine-breakpoint-lg': '64em',
        'mantine-breakpoint-xl': '77.5em',
      },
    },
  },
};

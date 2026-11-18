// Breakpoints from the design (SPEC 2.7): 640, 768, 900, 1024 and 1280px.
// 720 and 960 are written as plain media queries where they are used.
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '40em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '56.25em',
        'mantine-breakpoint-lg': '64em',
        'mantine-breakpoint-xl': '80em',
      },
    },
  },
};

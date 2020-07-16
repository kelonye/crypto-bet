const cssnano = require('cssnano');
const postcssColorMod = require('postcss-color-mod-function');
const postcssPresetEnv = require('postcss-preset-env');
const postcssImport = require('postcss-import');
const postcssUrl = require('postcss-url');
const purgeCss = require('@fullhuman/postcss-purgecss');
const tailwindCss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const production = !process.env.ROLLUP_WATCH;

module.exports = {
  plugins: [
    postcssImport(),
    postcssUrl(),
    tailwindCss,
    autoprefixer,
    postcssPresetEnv({
      stage: 0,
      autoprefixer: {
        grid: true,
      },
    }),
    postcssColorMod(),
    cssnano({
      autoprefixer: false,
      preset: ['default'],
    }),
    // production &&
    //   purgeCss({
    //     content: ['./**/*.html', './**/*.svelte'],
    //     whitelistPatterns: [/nprogress/, /sweet-alert/],
    //     whitelist: ['nprogress', 'sweet-alert'],
    //     defaultExtractor: (content) => content.match(/[A-Za-z0-9-_:/]+/g) || [],
    //   }),
  ],
};

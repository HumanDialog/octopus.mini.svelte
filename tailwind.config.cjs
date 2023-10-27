const config = {
  content: [  "./src/**/*.{html,js,svelte,ts}", 
              './node_modules/@humandialog/auth.svelte/**/*.{html,js,svelte,ts}',
              './node_modules/@humandialog/forms.svelte/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      typography:{
        DEFAULT:{
          css: {
            maxWidth: '100ch'
          }
        }
      }
    },
  },

  plugins: [
    require('@tailwindcss/typography'),  
  ],
  darkMode: 'class',
};

module.exports = config;




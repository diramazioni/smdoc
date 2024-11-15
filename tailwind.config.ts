import { fontFamily } from "tailwindcss/defaultTheme";
import type { Config } from "tailwindcss";
const colors = require('tailwindcss/colors');
const svelteUx = require('svelte-ux/plugins/tailwind.cjs');

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/**/*.{html,js,svelte,ts}", 
		'./node_modules/svelte-ux/**/*.{svelte,js}'
	],
	ux: {
		themes: {
		  light: {
			primary: colors['orange']['500'],
			'primary-content': 'white',
			secondary: colors['blue']['500'],
			'surface-100': 'white',
			'surface-200': colors['gray']['100'],
			'surface-300': colors['gray']['300'],
			'surface-content': colors['gray']['900'],
			'color-scheme': 'light'
		  },
		  dark: {
			primary: colors['orange']['500'],
			'primary-content': 'white',
			secondary: colors['blue']['500'],
			'surface-100': colors['zinc']['800'],
			'surface-200': colors['zinc']['900'],
			'surface-300': colors['zinc']['950'],
			'surface-content': colors['zinc']['100'],
			'color-scheme': 'dark'
		  },
		},
	  },
	plugins: [
		//require("tailwindcss-animate"),
		svelteUx
	],
	safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px"
			}
		},
		extend: {
			colors: {
				border: "hsl(var(--border) / <alpha-value>)",
				input: "hsl(var(--input) / <alpha-value>)",
				ring: "hsl(var(--ring) / <alpha-value>)",
				background: "hsl(var(--background) / <alpha-value>)",
				foreground: "hsl(var(--foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "hsl(var(--primary) / <alpha-value>)",
					foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
					foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
				},
				muted: {
					DEFAULT: "hsl(var(--muted) / <alpha-value>)",
					foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
				},
				accent: {
					DEFAULT: "hsl(var(--accent) / <alpha-value>)",
					foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
				},
				popover: {
					DEFAULT: "hsl(var(--popover) / <alpha-value>)",
					foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
				},
				card: {
					DEFAULT: "hsl(var(--card) / <alpha-value>)",
					foreground: "hsl(var(--card-foreground) / <alpha-value>)"
				}
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)"
			},
			fontFamily: {
				sans: [...fontFamily.sans]
			}
		}
	},
};

export default config;

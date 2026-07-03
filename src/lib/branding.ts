export const BRANDING = {
  name: 'Viper Factory',
  shortName: 'Viper',
  tagline: 'Plataforma de Personal Training',
  // Colors used for PWA manifest and meta tags
  themeColor: '#D4AF37',
  backgroundColor: '#0B0B0B',
  // Logo: if set to a URL or data URL, displayed instead of the icon
  // Change this to customize the logo (e.g. '/my-logo.png' or a data URL from upload)
  logoUrl: null as string | null,
  // Fallback icon (lucide-react name) shown when no logo is uploaded
  icon: 'Flame',
} as const;

export type Branding = typeof BRANDING;

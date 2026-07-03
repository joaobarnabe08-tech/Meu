import { Flame } from 'lucide-react';
import { BRANDING } from '../lib/branding';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
};

const sizeMap = {
  sm: { box: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-sm' },
  md: { box: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-base' },
  lg: { box: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-2xl' },
};

export default function Logo({ size = 'md', showText = true, variant = 'light', className = '' }: LogoProps) {
  const s = sizeMap[size];
  const textColor = variant === 'light' ? 'text-white' : 'text-viper-900';
  const subColor = variant === 'light' ? 'text-viper-300' : 'text-viper-400';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {BRANDING.logoUrl ? (
        <img
          src={BRANDING.logoUrl}
          alt={BRANDING.name}
          className={`${s.box} rounded-xl object-contain`}
        />
      ) : (
        <div className={`${s.box} rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20 shrink-0`}>
          <Flame className={`${s.icon} text-viper-900`} />
        </div>
      )}
      {showText && (
        <div className="leading-tight">
          <span className={`font-bold ${s.text} ${textColor} tracking-tight`}>{BRANDING.name}</span>
          {size === 'lg' && <p className={`text-sm ${subColor} mt-0.5`}>{BRANDING.tagline}</p>}
        </div>
      )}
    </div>
  );
}

import React from 'react';

interface SidebarIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  active?: boolean;
  disabled?: boolean;
  hover?: 'scale' | 'rotate' | 'glow' | 'none';
  className?: string;
  title?: string;
}

export const SidebarIcon: React.FC<SidebarIconProps> = ({
  name,
  size = 'md',
  active = false,
  disabled = false,
  hover = 'scale',
  className = '',
  title,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const iconSize = sizeMap[size] || sizeMap.md;

  return (
    <span
      className={`inline-flex items-center justify-center ${iconSize} ${className}`}
      role="img"
      aria-label={title || name}
    >
      {renderIcon(name, iconSize)}
    </span>
  );
};

const renderIcon = (name: string, sizeClass: string) => {
  const svgProps = {
    viewBox: '0 0 24 24',
    className: `${sizeClass} stroke-current fill-none`,
    stroke: 'currentColor',
    strokeWidth: '2',
    fill: 'none',
  };

  switch (name) {
    case 'new-chat':
      return (
        <svg {...svgProps}>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      );

    case 'study-hub':
      return (
        <svg {...svgProps}>
          <path d="M4 19V5l8-4 8 4v14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 21v-7h6v7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="9" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );

    case 'image-ai':
      return (
        <svg {...svgProps}>
          <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'code-flow':
      return (
        <svg {...svgProps}>
          <path d="M8 3.5 3.5 8 8 12.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 3.5 20.5 8 16 12.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 21v-7" strokeLinecap="round" />
        </svg>
      );

    case 'memory-drawer':
      return (
        <svg {...svgProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18" strokeLinecap="round" />
          <circle cx="8" cy="13" r="1.5" fill="currentColor" stroke="none" />
          <path d="M13 13h6" strokeLinecap="round" />
        </svg>
      );

    case 'admin-dashboard':
      return (
        <svg {...svgProps}>
          <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 14l3-4 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'session-chat':
      return (
        <svg {...svgProps}>
          <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8l-4 4z" strokeLinejoin="round" />
          <path d="M9 11h6M9 8h3" strokeLinecap="round" />
        </svg>
      );

    case 'toggle-close':
      return (
        <svg {...svgProps}>
          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
      );

    case 'toggle-menu':
      return (
        <svg {...svgProps}>
          <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
        </svg>
      );

    case 'chevron-right':
      return (
        <svg {...svgProps}>
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    default:
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
};

export default SidebarIcon;
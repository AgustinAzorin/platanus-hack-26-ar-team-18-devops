interface CasitaLogoProps {
  size?: number;
  className?: string;
}

export default function CasitaLogo({ size = 32, className }: CasitaLogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 34.5v16.2c0 2.7 1.9 4.8 4.4 4.8h20.1M12 34.5 32 16l20 18.5v13"
        stroke="currentColor"
        strokeWidth="5.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="casita-logo-house"
      />
      <path
        d="M39.2 54.7h10.3l3.9-13.9 8.1 25.1 5.2-12.4 13.8 5.2-19.6-16.1"
        stroke="currentColor"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="casita-logo-cursor"
        transform="translate(-12 -8)"
      />
      <path
        d="M25.5 55.5h6.7M29.5 61h8.6M36.3 58.3h10.5M49.5 45.8h5.3"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        className="casita-logo-speed"
      />
    </svg>
  );
}

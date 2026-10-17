interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 36, className = '' }: LogoProps) {
  return (
    <img
      src="/cliente/logo.jpeg"
      alt="JV Locações"
      width={size}
      height={size}
      className={`object-contain rounded-xl ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = false, className = '' }: LogoProps) {
  const sizeMap = { sm: 28, md: 36, lg: 48 }
  const px = sizeMap[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/admin/logo.jpeg"
        alt="JV Locações"
        width={px}
        height={px}
        className="object-contain rounded-xl"
        style={{ width: px, height: px }}
      />
      {showText && (
        <span className="font-bold text-white">JV Locações</span>
      )}
    </div>
  )
}

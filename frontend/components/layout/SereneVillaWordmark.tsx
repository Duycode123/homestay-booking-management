type SereneVillaWordmarkProps = {
  className?: string
  compact?: boolean
}

export default function SereneVillaWordmark({
  className = '',
  compact = false,
}: SereneVillaWordmarkProps) {
  return (
    <span
      className={[
        'inline-flex min-w-0 items-center text-current',
        compact ? 'gap-2' : 'gap-3',
        className,
      ].join(' ')}
      aria-hidden="true"
    >
      <svg
        className={compact ? 'h-12 w-12 shrink-0 sm:h-[3.65rem] sm:w-[3.65rem]' : 'h-16 w-16 shrink-0'}
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="36"
          cy="35.5"
          rx="22.5"
          ry="25.5"
          stroke="currentColor"
          strokeWidth="1.15"
          opacity="0.72"
        />
        <g
          stroke="currentColor"
          strokeWidth="1.05"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.82"
        >
          <path d="M21.8 28.2C15.5 23 11.4 16.2 10.2 8.3" />
          <path d="m17.7 23.9-6.4-.9M15 19.7l-5.5-2.2M13 15.1l-3.9-3.3M19.3 26.3l.3-5.6M16.4 22.1l1.3-5M13.9 17.5l2-3.9" />
          <path d="M49.3 45.7c6.7 4.8 11 10.9 12.6 18.1" />
          <path d="m53.4 49.1 6.1.1M56.4 52.8l5.6 1.5M58.7 57l4.5 2.6M51.4 47.2l.3 5.7M54.7 50.6l-1 5.1M57.4 54.6l-1.8 4.3" />
        </g>
        <g fill="currentColor" opacity="0.68">
          <ellipse cx="10.6" cy="9.9" rx="2.1" ry="4.2" transform="rotate(-31 10.6 9.9)" />
          <ellipse cx="9.2" cy="15.9" rx="2.1" ry="4.1" transform="rotate(-60 9.2 15.9)" />
          <ellipse cx="11.2" cy="22.9" rx="2.1" ry="4.1" transform="rotate(-75 11.2 22.9)" />
          <ellipse cx="16.3" cy="14.7" rx="2" ry="4" transform="rotate(35 16.3 14.7)" />
          <ellipse cx="18" cy="20.2" rx="2.1" ry="4.2" transform="rotate(22 18 20.2)" />
          <ellipse cx="19.7" cy="26" rx="2.1" ry="4.2" transform="rotate(11 19.7 26)" />
          <ellipse cx="61.6" cy="62.1" rx="2.1" ry="4.2" transform="rotate(-28 61.6 62.1)" />
          <ellipse cx="62.2" cy="55.2" rx="2.1" ry="4.1" transform="rotate(-66 62.2 55.2)" />
          <ellipse cx="59.1" cy="49.3" rx="2.1" ry="4.1" transform="rotate(-79 59.1 49.3)" />
          <ellipse cx="55.4" cy="58.4" rx="2.1" ry="4.1" transform="rotate(38 55.4 58.4)" />
          <ellipse cx="53.8" cy="52.6" rx="2.1" ry="4.2" transform="rotate(24 53.8 52.6)" />
          <ellipse cx="51.7" cy="47.3" rx="2" ry="4" transform="rotate(12 51.7 47.3)" />
        </g>
        <path
          d="M35 15.2v40.6"
          stroke="currentColor"
          strokeWidth="0.55"
          strokeLinecap="round"
          opacity="0.2"
        />
        <text
          x="35"
          y="44"
          fill="currentColor"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="28"
          fontWeight="400"
          textAnchor="middle"
        >
          S
        </text>
      </svg>

      <span className="min-w-0 text-center">
        <span
          className={[
            'font-editorial block whitespace-nowrap uppercase leading-none',
            compact
              ? 'text-[0.92rem] tracking-[0.16em] sm:text-[1.08rem] sm:tracking-[0.18em]'
              : 'text-[1.22rem] tracking-[0.19em]',
          ].join(' ')}
        >
          The Serene Villa
        </span>
        <span
          className={[
            'mt-1.5 flex items-center justify-center gap-2 font-semibold uppercase leading-none opacity-70',
            compact ? 'text-[7px] tracking-[0.28em] sm:text-[8px]' : 'text-[8px] tracking-[0.32em]',
          ].join(' ')}
        >
          <span className="h-px w-2 bg-current opacity-55" />
          Hanoi
          <span className="h-px w-2 bg-current opacity-55" />
        </span>
      </span>
    </span>
  )
}

interface IconProps {
  className?: string
  size?: number
}

export function ArrowLeftIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M14.9998 19.9201L8.47984 13.4001C7.70984 12.6301 7.70984 11.3701 8.47984 10.6001L14.9998 4.08008"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ShareIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="7" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 13l4-2 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SettingsIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LoginIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M11.6797 14.62L14.2397 12.06L11.6797 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 12.0601H14.17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 4C16.42 4 20 7 20 12C20 17 16.42 20 12 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BlackHoleIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 10C17 10 16.6 22 9 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.3115 14C7.31152 14 7.71152 2 15.3115 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.6315 10.6959C14.167 7.16041 22.3694 15.9285 16.9954 21.3025" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M13.6801 13.3041C10.1445 16.8396 1.9421 8.07147 7.31611 2.69746" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M10.8516 13.5242C7.31605 9.98865 16.0842 1.78622 21.4582 7.16023" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M13.4599 10.4758C16.9955 14.0113 8.22736 22.2138 2.85334 16.8398" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M10 12.3115C10 7.31152 22 7.71152 22 15.3115" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 12C14 17 2 16.6 2 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function BowlTurkaIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#3d2c1f" stroke="#5c4033" strokeWidth="1" />
      <ellipse cx="16" cy="14" rx="8" ry="4" fill="#2d1f14" />
      <path d="M10 14 Q16 8 22 14" stroke="#5c4033" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

export function BowlPhunnelIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#8b7355" stroke="#a08060" strokeWidth="1" />
      <circle cx="16" cy="14" r="4" fill="#5c4033" />
      <path d="M12 14 Q16 6 20 14" stroke="#a08060" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

export function BowlKillerIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#6b5344" stroke="#8b7355" strokeWidth="1" />
      <ellipse cx="16" cy="13" rx="6" ry="3" fill="#5c4033" />
      <path d="M10 13 Q16 5 22 13" stroke="#8b7355" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

export function WrenchIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DangerIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 9V14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.0001 21.41H5.94005C2.47005 21.41 1.02005 18.93 2.70005 15.9L5.82006 10.28L8.76006 5.00003C10.5401 1.79003 13.4601 1.79003 15.2401 5.00003L18.1801 10.29L21.3001 15.91C22.9801 18.94 21.5201 21.42 18.0601 21.42H12.0001V21.41Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.9945 17H12.0035"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PlayIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g transform="translate(12 12) scale(1.1) translate(-12 -12)">
        <path
          d="M4 11.9999V8.43989C4 4.01989 7.13 2.2099 10.96 4.4199L14.05 6.1999L17.14 7.9799C20.97 10.1899 20.97 13.8099 17.14 16.0199L14.05 17.7999L10.96 19.5799C7.13 21.7899 4 19.9799 4 15.5599V11.9999Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export function PauseIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M10.65 19.11V4.89C10.65 3.54 10.08 3 8.64 3H5.01C3.57 3 3 3.54 3 4.89V19.11C3 20.46 3.57 21 5.01 21H8.64C10.08 21 10.65 20.46 10.65 19.11Z" fill="currentColor" />
      <path d="M21 19.11V4.89C21 3.54 20.43 3 18.99 3H15.36C13.93 3 13.35 3.54 13.35 4.89V19.11C13.35 20.46 13.92 21 15.36 21H18.99C20.43 21 21 20.46 21 19.11Z" fill="currentColor" />
    </svg>
  )
}

export function RestartIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M9.10996 5.0799C9.97996 4.8199 10.94 4.6499 12 4.6499C16.79 4.6499 20.67 8.5299 20.67 13.3199C20.67 18.1099 16.79 21.9899 12 21.9899C7.20996 21.9899 3.32996 18.1099 3.32996 13.3199C3.32996 11.5399 3.86996 9.8799 4.78996 8.4999" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.87 5.32L10.76 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.87 5.32007L11.24 7.78007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CloseIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CheckIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TickCircleIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z"
        fill="#292D32"
      />
    </svg>
  )
}

/** Иконка «закончить» (stop/end) для кнопки «Закончить» */
export function EndIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M14.9 2H9.10001C8.42001 2 7.46 2.4 6.98 2.88L2.88 6.98001C2.4 7.46001 2 8.42001 2 9.10001V14.9C2 15.58 2.4 16.54 2.88 17.02L6.98 21.12C7.46 21.6 8.42001 22 9.10001 22H14.9C15.58 22 16.54 21.6 17.02 21.12L21.12 17.02C21.6 16.54 22 15.58 22 14.9V9.10001C22 8.42001 21.6 7.46001 21.12 6.98001L17.02 2.88C16.54 2.4 15.58 2 14.9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 15.5L15.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 15.5L8.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Иконка таймера для кнопки прогрева */
export function TimerIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22C7.17 22 3.25 18.08 3.25 13.25C3.25 8.42 7.17 4.5 12 4.5C16.83 4.5 20.75 8.42 20.75 13.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 2H15" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.8999 18.5V17.34C14.8999 15.91 15.9199 15.32 17.1599 16.04L18.1599 16.62L19.1599 17.2C20.3999 17.92 20.3999 19.09 19.1599 19.81L18.1599 20.39L17.1599 20.97C15.9199 21.69 14.8999 21.1 14.8999 19.67V18.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TobaccoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#4a6741" stroke="#5a7a51" strokeWidth="1" />
      <ellipse cx="12" cy="14" rx="4" ry="6" fill="#5a7a51" transform="rotate(-20 12 14)" />
      <ellipse cx="16" cy="16" rx="4" ry="6" fill="#5a7a51" transform="rotate(0 16 16)" />
      <ellipse cx="20" cy="14" rx="4" ry="6" fill="#5a7a51" transform="rotate(20 20 14)" />
    </svg>
  )
}

export function AddIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AddCircleIcon({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MinusCircleIcon({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Экран «Твоя цель» — те же пути, что public/icons/Play.svg, цвет через currentColor */
export function DirectionPlayIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M2.52002 7.10999H21.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.52002 2.10999V6.96999" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.48 2.10999V6.51999" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M9.75 14.45V13.25C9.75 11.71 10.84 11.08 12.17 11.85L13.21 12.45L14.25 13.05C15.58 13.82 15.58 15.08 14.25 15.85L13.21 16.45L12.17 17.05C10.84 17.82 9.75 17.19 9.75 15.65V14.45V14.45Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** public/icons/Meditation.svg */
export function DirectionMeditationIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M14.5 4.5C14.5 5.88071 13.3807 7 12 7C10.6193 7 9.5 5.88071 9.5 4.5C9.5 3.11929 10.6193 2 12 2C13.3807 2 14.5 3.11929 14.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M21 17L19.8423 16.6101C19.6151 16.5336 19.399 16.4268 19.1998 16.2926L19.0985 16.2244C18.4122 15.762 18 14.9837 18 14.1502C18 11.7131 16.2563 9.63319 13.8772 9.23252L12.9864 9.08251C12.5 8.99992 11.5 9.00006 11.0136 9.08251L10.1228 9.23252C7.74373 9.63319 6 11.7131 6 14.1502C6 14.9837 5.58776 15.762 4.90145 16.2244L4.80022 16.2926C4.60096 16.4268 4.38488 16.5336 4.1577 16.6101L3 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 16L8.57549 17.2327C8.42794 17.4294 8.35416 17.5278 8.27135 17.6144C8.06638 17.8287 7.81632 17.9947 7.53929 18.1004C7.42736 18.1432 7.30805 18.173 7.06948 18.2326L5.27607 18.681C4.52611 18.8685 4 19.5423 4 20.3153C4 21.2458 4.75425 22 5.68466 22H6.36842C8.07661 22 9.73871 21.446 11.1053 20.4211L13 19M14.5 16L15.2267 16.9689C15.5701 17.4269 15.7419 17.6558 15.9648 17.825C16.0318 17.8759 16.102 17.9225 16.1749 17.9645C16.4174 18.1043 16.695 18.1738 17.2503 18.3126L18.7239 18.681C19.4739 18.8685 20 19.5423 20 20.3153C20 21.2458 19.2458 22 18.3153 22H17.3776C16.8153 22 16.5342 22 16.2554 21.9844C15.4319 21.9384 14.6172 21.7907 13.83 21.5446C13.5635 21.4613 13.3003 21.3626 12.7738 21.1652L11 20.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** public/icons/Flame.svg */
export function DirectionFlameIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M20 15C20 19.2545 17.3819 21.1214 15.3588 21.751C14.9274 21.8852 14.6438 21.3823 14.9019 21.0114C15.7823 19.7462 16.8 17.8159 16.8 16C16.8 14.0494 15.1559 11.7465 13.8721 10.3261C13.5786 10.0014 13.0667 10.2162 13.0507 10.6537C12.9976 12.1029 12.7689 14.0418 11.7828 15.5613C11.6241 15.8059 11.2872 15.8262 11.1063 15.5975C10.7982 15.2078 10.4901 14.7265 10.182 14.3462C10.016 14.1414 9.71604 14.1385 9.52461 14.3198C8.77825 15.0265 7.73333 16.1286 7.73333 17.5C7.73333 18.4892 8.20479 19.7206 8.69077 20.674C8.91147 21.107 8.50204 21.615 8.08142 21.3715C6.24558 20.3088 4 18.1069 4 15C4 11.8535 8.31029 7.49481 9.95605 3.37691C10.2157 2.72711 11.0161 2.42178 11.5727 2.84582C14.9439 5.41388 20 10.3781 20 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

/** Иконка «слои» для NavBtn на экране инструкции (Figma: vuesax/linear/layer) */
export function LayerIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Иконка БД / полка — как public/icons/Database.svg, цвет через currentColor */
export function DatabaseIcon({ className, size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 18V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 6V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M12 10C16.4183 10 20 8.20914 20 6C20 3.79086 16.4183 2 12 2C7.58172 2 4 3.79086 4 6C4 8.20914 7.58172 10 12 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M20 12C20 14.2091 16.4183 16 12 16C7.58172 16 4 14.2091 4 12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 18C20 20.2091 16.4183 22 12 22C7.58172 22 4 20.2091 4 18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/** Галочка в круге (колпак на сетапе) — как tick-circle.svg */
export function AccentTickCircleIcon({ className, size = 32 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16.0001 2.66675C8.65341 2.66675 2.66675 8.65341 2.66675 16.0001C2.66675 23.3467 8.65341 29.3334 16.0001 29.3334C23.3467 29.3334 29.3334 23.3467 29.3334 16.0001C29.3334 8.65341 23.3467 2.66675 16.0001 2.66675ZM22.3734 12.9334L14.8134 20.4934C14.6267 20.6801 14.3734 20.7867 14.1067 20.7867C13.8401 20.7867 13.5867 20.6801 13.4001 20.4934L9.62675 16.7201C9.24008 16.3334 9.24008 15.6934 9.62675 15.3067C10.0134 14.9201 10.6534 14.9201 11.0401 15.3067L14.1067 18.3734L20.9601 11.5201C21.3467 11.1334 21.9867 11.1334 22.3734 11.5201C22.7601 11.9067 22.7601 12.5334 22.3734 12.9334Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Иконки для карточек инструкции (inst_1–inst_5.svg) */
export function InstructionCard1Icon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={['accentStroke', className].filter(Boolean).join(' ')}
    >
      <path
        d="M2 7.33333C2 7.89333 2.42 8.54 2.93333 8.76667L7.46 10.78C7.80667 10.9333 8.2 10.9333 8.54 10.78L13.0667 8.76667C13.58 8.54 14 7.89333 14 7.33333M2 10.6667C2 11.2867 2.36667 11.8467 2.93333 12.1L7.46 14.1133C7.80667 14.2667 8.2 14.2667 8.54 14.1133L13.0667 12.1C13.6333 11.8467 14 11.2867 14 10.6667M8.67333 1.94667L12.6067 3.69333C13.74 4.19333 13.74 5.02 12.6067 5.52L8.67333 7.26667C8.22667 7.46667 7.49333 7.46667 7.04667 7.26667L3.11333 5.52C1.98 5.02 1.98 4.19333 3.11333 3.69333L7.04667 1.94667C7.49333 1.74667 8.22667 1.74667 8.67333 1.94667Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function InstructionCard2Icon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={['accentStroke', className].filter(Boolean).join(' ')}
    >
      <path
        d="M8.00016 13.64C8.82016 12.9133 9.3335 11.8467 9.3335 10.6667C9.3335 10.1467 9.2335 9.64666 9.0535 9.19333M8.00016 13.64C7.2935 14.28 6.36016 14.6667 5.3335 14.6667C3.12683 14.6667 1.3335 12.8733 1.3335 10.6667C1.3335 8.82666 2.58683 7.26666 4.28016 6.80666M8.00016 13.64C8.70683 14.28 9.64016 14.6667 10.6668 14.6667C12.8735 14.6667 14.6668 12.8733 14.6668 10.6667C14.6668 8.82666 13.4135 7.26666 11.7202 6.80666M4.28016 6.80666C4.74016 7.96666 5.72683 8.86 6.94683 9.19333C7.28016 9.28666 7.6335 9.33333 8.00016 9.33333C8.36683 9.33333 8.72016 9.28666 9.0535 9.19333M4.28016 6.80666C4.10016 6.35333 4.00016 5.85333 4.00016 5.33333C4.00016 3.12666 5.7935 1.33333 8.00016 1.33333C10.2068 1.33333 12.0002 3.12666 12.0002 5.33333C12.0002 5.85333 11.9002 6.35333 11.7202 6.80666M9.0535 9.19333C10.2735 8.86 11.2602 7.96666 11.7202 6.80666"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function InstructionCard3Icon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={['accentStroke', className].filter(Boolean).join(' ')}
    >
      <path
        d="M13.3332 10C13.3332 12.8363 11.5878 14.0809 10.239 14.5007C9.95142 14.5902 9.7624 14.2549 9.93444 14.0076C10.5214 13.1641 11.1998 11.8772 11.1998 10.6667C11.1998 9.36626 10.1038 7.831 9.24792 6.88407C9.05225 6.66758 8.71095 6.81082 8.70027 7.10244C8.66492 8.06857 8.51247 9.36118 7.85505 10.3742C7.74923 10.5373 7.52461 10.5508 7.40404 10.3983C7.19863 10.1386 6.99322 9.81764 6.78782 9.56413C6.67717 9.42757 6.4772 9.42569 6.34958 9.54653C5.85201 10.0177 5.15539 10.7524 5.15539 11.6667C5.15539 12.3262 5.4697 13.147 5.79368 13.7827C5.94082 14.0714 5.66786 14.41 5.38745 14.2477C4.16356 13.5392 2.6665 12.0712 2.6665 10C2.6665 7.90236 5.54003 4.99654 6.63721 2.25127C6.81034 1.81808 7.3439 1.61452 7.715 1.89721C9.96246 3.60925 13.3332 6.91874 13.3332 10Z"
        stroke="currentColor"
      />
    </svg>
  )
}

export function InstructionCard4Icon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={['accentStroke', className].filter(Boolean).join(' ')}
    >
      <path
        d="M3.28785 3.29064L12.7159 12.7187M11.2829 11.2857L13.1496 5.89279M8.92585 8.92864L10.7125 3.76676M6.56883 6.57161L7.78507 3.04549M3.6744 3.10208C3.3727 3.1398 3.13701 3.37548 3.0993 3.67718C2.88717 5.25639 2.47231 10.1307 5.08389 12.714C7.18636 14.8165 10.6135 14.8212 12.7207 12.714C14.8278 10.6068 14.8278 7.18445 12.7254 5.08198C10.1704 2.51754 5.2536 2.89938 3.6744 3.10208Z"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function InstructionCard5Icon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={['accentStroke', className].filter(Boolean).join(' ')}
    >
      <g clipPath="url(#clip0_352_360)">
        <path
          d="M2.2268 11.3331C4.06775 14.5218 8.14502 15.6143 11.3336 13.7733C12.6334 13.0229 13.5848 11.9009 14.1313 10.619C14.9255 8.75608 14.8643 6.55536 13.7738 4.66648C12.6833 2.7776 10.808 1.62428 8.79749 1.38059C7.41409 1.2129 5.9667 1.4759 4.66697 2.22631C1.47835 4.06726 0.385847 8.14453 2.2268 11.3331Z"
          stroke="currentColor"
        />
        <path
          d="M10.3332 9.50002C10.3332 9.96026 9.96007 10.3334 9.49984 10.3334C9.0396 10.3334 8.6665 9.96026 8.6665 9.50002C8.6665 9.03978 9.0396 8.66669 9.49984 8.66669C9.96007 8.66669 10.3332 9.03978 10.3332 9.50002Z"
          stroke="currentColor"
        />
        <path
          d="M10.3332 6.50002C10.3332 6.96026 9.96007 7.33335 9.49984 7.33335C9.0396 7.33335 8.6665 6.96026 8.6665 6.50002C8.6665 6.03978 9.0396 5.66669 9.49984 5.66669C9.96007 5.66669 10.3332 6.03978 10.3332 6.50002Z"
          stroke="currentColor"
        />
        <path
          d="M7.33317 9.50002C7.33317 9.96026 6.96007 10.3334 6.49984 10.3334C6.0396 10.3334 5.6665 9.96026 5.6665 9.50002C5.6665 9.03978 6.0396 8.66669 6.49984 8.66669C6.96007 8.66669 7.33317 9.03978 7.33317 9.50002Z"
          stroke="currentColor"
        />
        <path
          d="M7.33317 6.50002C7.33317 6.96026 6.96007 7.33335 6.49984 7.33335C6.0396 7.33335 5.6665 6.96026 5.6665 6.50002C5.6665 6.03978 6.0396 5.66669 6.49984 5.66669C6.96007 5.66669 7.33317 6.03978 7.33317 6.50002Z"
          stroke="currentColor"
        />
        <path d="M10 12.1667C10 12.4428 9.77614 12.6667 9.5 12.6667C9.22386 12.6667 9 12.4428 9 12.1667C9 11.8905 9.22386 11.6667 9.5 11.6667C9.77614 11.6667 10 11.8905 10 12.1667Z" fill="currentColor" />
        <path d="M7 12.1667C7 12.4428 6.77614 12.6667 6.5 12.6667C6.22386 12.6667 6 12.4428 6 12.1667C6 11.8905 6.22386 11.6667 6.5 11.6667C6.77614 11.6667 7 11.8905 7 12.1667Z" fill="currentColor" />
        <path d="M10 12.1667C10 12.4428 9.77614 12.6667 9.5 12.6667C9.22386 12.6667 9 12.4428 9 12.1667C9 11.8905 9.22386 11.6667 9.5 11.6667C9.77614 11.6667 10 11.8905 10 12.1667Z" fill="currentColor" />
        <path d="M10 3.83331C10 4.10946 9.77614 4.33331 9.5 4.33331C9.22386 4.33331 9 4.10946 9 3.83331C9 3.55717 9.22386 3.33331 9.5 3.33331C9.77614 3.33331 10 3.55717 10 3.83331Z" fill="currentColor" />
        <path d="M7 12.1667C7 12.4428 6.77614 12.6667 6.5 12.6667C6.22386 12.6667 6 12.4428 6 12.1667C6 11.8905 6.22386 11.6667 6.5 11.6667C6.77614 11.6667 7 11.8905 7 12.1667Z" fill="currentColor" />
        <path d="M7 3.83331C7 4.10946 6.77614 4.33331 6.5 4.33331C6.22386 4.33331 6 4.10946 6 3.83331C6 3.55717 6.22386 3.33331 6.5 3.33331C6.77614 3.33331 7 3.55717 7 3.83331Z" fill="currentColor" />
        <path d="M12.1665 6C12.4426 6 12.6665 6.22386 12.6665 6.5C12.6665 6.77614 12.4426 7 12.1665 7C11.8904 7 11.6665 6.77614 11.6665 6.5C11.6665 6.22386 11.8904 6 12.1665 6Z" fill="currentColor" />
        <path d="M3.8335 6C4.10964 6 4.3335 6.22386 4.3335 6.5C4.3335 6.77614 4.10964 7 3.8335 7C3.55735 7 3.3335 6.77614 3.3335 6.5C3.3335 6.22386 3.55735 6 3.8335 6Z" fill="currentColor" />
        <path d="M12.1665 9C12.4426 9 12.6665 9.22386 12.6665 9.5C12.6665 9.77614 12.4426 10 12.1665 10C11.8904 10 11.6665 9.77614 11.6665 9.5C11.6665 9.22386 11.8904 9 12.1665 9Z" fill="currentColor" />
        <path d="M3.8335 9C4.10964 9 4.3335 9.22386 4.3335 9.5C4.3335 9.77614 4.10964 10 3.8335 10C3.55735 10 3.3335 9.77614 3.3335 9.5C3.3335 9.22386 3.55735 9 3.8335 9Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="clip0_352_360">
          <rect width="16" height="16" rx="5" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

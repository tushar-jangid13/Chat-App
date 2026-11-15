export function Avatar({ person, small = false }) {
  const className = `avatar ${person.color} ${small ? 'avatar-small' : ''}`

  return (
    <div className={className}>
      {person.initials}
      {person.online && <i className="online-dot" />}
    </div>
  )
}

export function Icon({ name, size = 20 }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    smile: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
      </>
    ),
    paperclip: (
      <path d="m21.4 11.1-8.5 8.5a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export default function Message({ message, person }) {
  const isMine = message.from === 'me'

  return (
    <div className={`message-line ${isMine ? 'mine' : ''}`}>
      {!isMine && <Avatar person={person} small />}
      <div className="message-stack">
        <div className="bubble">{message.text}</div>
        <div className="message-time">
          {message.time}
          {isMine && <Icon name="check" size={13} />}
        </div>
      </div>
    </div>
  )
}

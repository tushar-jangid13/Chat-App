import { useEffect, useRef } from 'react'
import { useChatContext } from '../context/AuthContext'
import Message, { Avatar, Icon } from './Message'

export default function ChatBox() {
  const {
    activeChat,
    messages,
    draft,
    setDraft,
    sendMessage,
    notify,
    notice,
  } = useChatContext()

  const fileInput = useRef(null)
  const messageArea = useRef(null)

  useEffect(() => {
    if (messageArea.current) {
      messageArea.current.scrollTop = messageArea.current.scrollHeight
    }
  }, [messages])

  function attachFile(event) {
    const file = event.target.files?.[0]
    if (!file) return

    notify('File uploads are not configured yet.')
    event.target.value = ''
  }

  function addEmoji() {
    setDraft((current) => `${current}😊`)
  }

  if (!activeChat) {
    return (
      <section className="conversation">
        {notice && <div className="toast" role="status">{notice}</div>}
        <div className="conversation-empty">
          <div className="empty-mark">✦</div>
          <strong>No conversation selected</strong>
          <span>Start a chat to send your first message.</span>
        </div>
      </section>
    )
  }

  return (
    <section className="conversation">
      <header className="conversation-header">
        <div className="contact">
          <Avatar person={activeChat} />
          <div>
            <h1>{activeChat.name}</h1>
            <span className="contact-status">
              <i
                className={activeChat.online ? 'status-online' : 'status-offline'}
              />
              {activeChat.online ? 'Online now' : 'Last seen recently'}
            </span>
          </div>
        </div>
      </header>

      <div className="message-area" ref={messageArea}>
        <div className="date-divider">
          <span>Today</span>
        </div>

        <div className="messages">
          {messages.length === 0 && (
            <div className="conversation-empty">
              <div className="empty-mark">✦</div>
              <strong>Say hello to {activeChat.name.split(' ')[0]}</strong>
              <span>Your conversation starts here.</span>
            </div>
          )}

          {messages.map((message) => (
            <Message key={message.id} message={message} person={activeChat} />
          ))}
        </div>
      </div>

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}

      <form className="composer" onSubmit={sendMessage}>
        <div className="composer-tools">
          <input
            ref={fileInput}
            className="file-input"
            type="file"
            onChange={attachFile}
          />
          <button
            type="button"
            className="icon-button"
            aria-label="Attach a file"
            onClick={() => fileInput.current?.click()}
          >
            <Icon name="paperclip" size={19} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Add emoji"
            onClick={addEmoji}
          >
            <Icon name="smile" size={19} />
          </button>
        </div>

        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Message ${activeChat.name.split(' ')[0]}...`}
          aria-label="Write a message"
        />
        <button
          type="submit"
          className="send-button"
          aria-label="Send message"
          disabled={!draft.trim()}
        >
          <Icon name="send" size={17} />
        </button>
      </form>
    </section>
  )
}

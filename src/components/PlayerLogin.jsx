import React, { useState } from 'react'
import { useGame } from '../contexts/GameContext'

const avatars = [
  '👤', '👨', '👩', '🧑', '👦', '👧', '🧔', '👱',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'
]

export default function PlayerLogin() {
  const { dispatch } = useGame()
  const [nickname, setNickname] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0])
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!nickname.trim()) {
      setError('请输入昵称')
      return
    }

    if (nickname.trim().length < 2) {
      setError('昵称至少需要2个字符')
      return
    }

    if (nickname.trim().length > 20) {
      setError('昵称不能超过20个字符')
      return
    }

    const player = {
      id: Date.now().toString(),
      nickname: nickname.trim(),
      avatar: selectedAvatar,
      joinedAt: new Date().toISOString()
    }

    dispatch({ type: 'SET_PLAYER', payload: player })
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>五子棋在线对战</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nickname">昵称</label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value)
                setError('')
              }}
              placeholder="请输入您的昵称"
              maxLength={20}
            />
          </div>
          
          <div className="form-group">
            <label>选择头像</label>
            <div className="avatar-grid">
              {avatars.map((avatar, index) => (
                <button
                  key={index}
                  type="button"
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="submit-btn">
            进入游戏大厅
          </button>
        </form>
      </div>
    </div>
  )
}
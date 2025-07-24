import React, { useState, useEffect } from 'react'
import { useGame } from '../contexts/GameContext'

const avatars = [
  '👤', '👨', '👩', '🧑', '👦', '👧', '🧔', '👱',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'
]

export default function PlayerLogin() {
  const { state, dispatch } = useGame()
  const [nickname, setNickname] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0])
  const [error, setError] = useState('')
  const [showLoginForm, setShowLoginForm] = useState(true)

  // Check if user is already logged in
  useEffect(() => {
    if (state.player) {
      setShowLoginForm(false)
    }
  }, [state.player])

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

  const handleLogout = () => {
    localStorage.removeItem('gobang_player')
    dispatch({ type: 'SET_PLAYER', payload: null })
    setShowLoginForm(true)
  }

  // If user is already logged in, show welcome screen
  if (state.player && !showLoginForm) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>五子棋在线对战</h1>
          <div className="welcome-section">
            <div className="player-info">
              <div className="player-avatar">{state.player.avatar}</div>
              <h2>欢迎回来，{state.player.nickname}！</h2>
              <p>您的信息已保存，可以直接进入游戏大厅</p>
            </div>
            <div className="action-buttons">
               <button 
                 className="submit-btn"
                 onClick={() => {
                   // User is already logged in, this will be handled by App.jsx routing
                   // The button is just for UI feedback
                 }}
               >
                 进入游戏大厅
               </button>
              <button 
                className="logout-btn"
                onClick={handleLogout}
              >
                切换用户
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
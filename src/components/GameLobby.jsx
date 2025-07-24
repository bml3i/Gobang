import React, { useState, useEffect } from 'react'
import { useGame } from '../contexts/GameContext'
import { supabase } from '../lib/supabase'

export default function GameLobby() {
  const { state, dispatch, gameConfig } = useGame()
  const { player, tables, currentTable } = state
  const [startGameTimer, setStartGameTimer] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)

  // Handle joining a table
  const joinTable = async (tableNumber) => {
    if (currentTable) return // Already at a table
    
    const table = tables.find(t => t.table_number === tableNumber)
    if (!table) return
    
    // Check if table has space
    if (table.player1_id && table.player2_id) {
      alert('该游戏桌已满')
      return
    }
    
    try {
      let updateData = {}
      
      if (!table.player1_id) {
        updateData = {
          player1_id: player.id,
          player1_nickname: player.nickname,
          player1_avatar: player.avatar,
          player1_ready: false
        }
      } else if (!table.player2_id) {
        updateData = {
          player2_id: player.id,
          player2_nickname: player.nickname,
          player2_avatar: player.avatar,
          player2_ready: false
        }
      }
      
      const { error } = await supabase
        .from('game_tables')
        .update(updateData)
        .eq('table_number', tableNumber)
      
      if (error) throw error
      
      dispatch({ type: 'SET_CURRENT_TABLE', payload: tableNumber })
    } catch (error) {
      console.error('Error joining table:', error)
      alert('加入游戏桌失败')
    }
  }

  // Handle leaving a table
  const leaveTable = async () => {
    if (!currentTable) return
    
    const table = tables.find(t => t.table_number === currentTable)
    if (!table) return
    
    try {
      let updateData = {}
      
      if (table.player1_id === player.id) {
        updateData = {
          player1_id: null,
          player1_nickname: null,
          player1_avatar: null,
          player1_ready: false
        }
      } else if (table.player2_id === player.id) {
        updateData = {
          player2_id: null,
          player2_nickname: null,
          player2_avatar: null,
          player2_ready: false
        }
      }
      
      // Reset game state if leaving
      updateData.game_state = 'waiting'
      updateData.board = Array(15).fill(null).map(() => Array(15).fill(null))
      updateData.current_player = 1
      updateData.winner = null
      updateData.last_move_time = null
      
      const { error } = await supabase
        .from('game_tables')
        .update(updateData)
        .eq('table_number', currentTable)
      
      if (error) throw error
      
      dispatch({ type: 'SET_CURRENT_TABLE', payload: null })
      dispatch({ type: 'RESET_GAME' })
    } catch (error) {
      console.error('Error leaving table:', error)
    }
  }

  // Handle ready/start game
  const toggleReady = async () => {
    if (!currentTable) return
    
    const table = tables.find(t => t.table_number === currentTable)
    if (!table) return
    
    try {
      let updateData = {}
      
      if (table.player1_id === player.id) {
        updateData.player1_ready = !table.player1_ready
      } else if (table.player2_id === player.id) {
        updateData.player2_ready = !table.player2_ready
      }
      
      const { error } = await supabase
        .from('game_tables')
        .update(updateData)
        .eq('table_number', currentTable)
      
      if (error) throw error
    } catch (error) {
      console.error('Error toggling ready:', error)
    }
  }

  // Monitor start game timer
  useEffect(() => {
    if (!currentTable) return
    
    const table = tables.find(t => t.table_number === currentTable)
    if (!table) return
    
    // Check if one player is ready but not both
    const oneReady = (table.player1_ready && !table.player2_ready) || 
                    (!table.player1_ready && table.player2_ready)
    
    if (oneReady && table.player1_id && table.player2_id) {
      if (!startGameTimer) {
        const timer = setTimeout(async () => {
          // Kick the non-ready player
          try {
            let updateData = {}
            
            if (!table.player1_ready) {
              updateData = {
                player1_id: null,
                player1_nickname: null,
                player1_avatar: null,
                player1_ready: false
              }
            } else if (!table.player2_ready) {
              updateData = {
                player2_id: null,
                player2_nickname: null,
                player2_avatar: null,
                player2_ready: false
              }
            }
            
            await supabase
              .from('game_tables')
              .update(updateData)
              .eq('table_number', currentTable)
          } catch (error) {
            console.error('Error kicking player:', error)
          }
        }, gameConfig.startGameTimeoutSeconds * 1000)
        
        setStartGameTimer(timer)
        setTimeLeft(gameConfig.startGameTimeoutSeconds)
        
        const countdown = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(countdown)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } else {
      if (startGameTimer) {
        clearTimeout(startGameTimer)
        setStartGameTimer(null)
        setTimeLeft(0)
      }
    }
    
    // Start game if both ready
    if (table.player1_ready && table.player2_ready && table.player1_id && table.player2_id) {
      if (startGameTimer) {
        clearTimeout(startGameTimer)
        setStartGameTimer(null)
        setTimeLeft(0)
      }
      
      // Start the game
      supabase
        .from('game_tables')
        .update({
          game_state: 'playing',
          last_move_time: new Date().toISOString()
        })
        .eq('table_number', currentTable)
    }
  }, [tables, currentTable, startGameTimer])

  const currentTableData = tables.find(t => t.table_number === currentTable)
  const isMyReady = currentTableData && 
    ((currentTableData.player1_id === player.id && currentTableData.player1_ready) ||
     (currentTableData.player2_id === player.id && currentTableData.player2_ready))

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>游戏大厅</h1>
        <div className="player-info">
          <span className="avatar">{player.avatar}</span>
          <span className="nickname">{player.nickname}</span>
        </div>
      </div>
      
      <div className="tables-grid">
        {tables.map(table => (
          <div 
            key={table.table_number} 
            className={`game-table ${currentTable === table.table_number ? 'current' : ''}`}
          >
            <div className="table-header">
              <h3>游戏桌 {table.table_number}</h3>
              <span className={`status ${table.game_state}`}>
                {table.game_state === 'waiting' ? '等待中' : 
                 table.game_state === 'playing' ? '游戏中' : '准备中'}
              </span>
            </div>
            
            <div className="players">
              <div className="player-slot">
                {table.player1_id ? (
                  <div className={`player ${table.player1_ready ? 'ready' : ''}`}>
                    <span className="avatar">{table.player1_avatar}</span>
                    <span className="nickname">{table.player1_nickname}</span>
                    {table.player1_ready && <span className="ready-badge">已准备</span>}
                  </div>
                ) : (
                  <div className="empty-slot">空位</div>
                )}
              </div>
              
              <div className="vs">VS</div>
              
              <div className="player-slot">
                {table.player2_id ? (
                  <div className={`player ${table.player2_ready ? 'ready' : ''}`}>
                    <span className="avatar">{table.player2_avatar}</span>
                    <span className="nickname">{table.player2_nickname}</span>
                    {table.player2_ready && <span className="ready-badge">已准备</span>}
                  </div>
                ) : (
                  <div className="empty-slot">空位</div>
                )}
              </div>
            </div>
            
            <div className="table-actions">
              {currentTable === table.table_number ? (
                <div className="current-table-actions">
                  {timeLeft > 0 && (
                    <div className="timer">等待对手准备: {timeLeft}s</div>
                  )}
                  <button 
                    onClick={toggleReady}
                    className={`ready-btn ${isMyReady ? 'ready' : ''}`}
                    disabled={table.game_state === 'playing'}
                  >
                    {isMyReady ? '取消准备' : '开始游戏'}
                  </button>
                  <button onClick={leaveTable} className="leave-btn">
                    离开游戏桌
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => joinTable(table.table_number)}
                  disabled={table.player1_id && table.player2_id}
                  className="join-btn"
                >
                  {table.player1_id && table.player2_id ? '已满' : '加入'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
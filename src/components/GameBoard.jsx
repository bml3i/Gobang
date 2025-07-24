import React, { useState, useEffect, useCallback } from 'react'
import { useGame } from '../contexts/GameContext'
import { supabase } from '../lib/supabase'

const BOARD_SIZE = 15

export default function GameBoard() {
  const { state, dispatch, gameConfig } = useGame()
  const { player, currentTable, tables } = state
  const [timeLeft, setTimeLeft] = useState(gameConfig.moveTimeoutSeconds)
  const [moveTimer, setMoveTimer] = useState(null)

  const currentTableData = tables.find(t => t.table_number === currentTable)
  
  if (!currentTableData || currentTableData.game_state !== 'playing') {
    return null
  }

  const isPlayer1 = currentTableData.player1_id === player.id
  const isMyTurn = (isPlayer1 && currentTableData.current_player === 1) || 
                   (!isPlayer1 && currentTableData.current_player === 2)
  
  const myPiece = isPlayer1 ? 1 : 2
  const opponentPiece = isPlayer1 ? 2 : 1

  // Check for winner
  const checkWinner = useCallback((board, row, col, player) => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal /
      [1, -1]   // diagonal \
    ]

    for (let [dx, dy] of directions) {
      let count = 1
      
      // Check positive direction
      for (let i = 1; i < 5; i++) {
        const newRow = row + dx * i
        const newCol = col + dy * i
        if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break
        if (board[newRow][newCol] !== player) break
        count++
      }
      
      // Check negative direction
      for (let i = 1; i < 5; i++) {
        const newRow = row - dx * i
        const newCol = col - dy * i
        if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break
        if (board[newRow][newCol] !== player) break
        count++
      }
      
      if (count >= 5) return true
    }
    
    return false
  }, [])

  // Handle cell click
  const handleCellClick = async (row, col) => {
    if (!isMyTurn || currentTableData.board[row][col] !== null) return
    
    try {
      const newBoard = currentTableData.board.map(r => [...r])
      newBoard[row][col] = myPiece
      
      const hasWinner = checkWinner(newBoard, row, col, myPiece)
      const nextPlayer = hasWinner ? currentTableData.current_player : (currentTableData.current_player === 1 ? 2 : 1)
      
      const updateData = {
        board: newBoard,
        current_player: nextPlayer,
        last_move_time: new Date().toISOString()
      }
      
      if (hasWinner) {
        updateData.winner = myPiece
        updateData.game_state = 'finished'
      }
      
      const { error } = await supabase
        .from('game_tables')
        .update(updateData)
        .eq('table_number', currentTable)
      
      if (error) throw error
    } catch (error) {
      console.error('Error making move:', error)
    }
  }

  // Handle move timeout
  useEffect(() => {
    if (!isMyTurn || currentTableData.winner) return
    
    const startTime = new Date(currentTableData.last_move_time).getTime()
    const now = Date.now()
    const elapsed = Math.floor((now - startTime) / 1000)
    const remaining = Math.max(0, gameConfig.moveTimeoutSeconds - elapsed)
    
    setTimeLeft(remaining)
    
    if (remaining === 0) {
      // Time's up, player loses
      supabase
        .from('game_tables')
        .update({
          winner: opponentPiece,
          game_state: 'finished'
        })
        .eq('table_number', currentTable)
      return
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // Time's up, player loses
          supabase
            .from('game_tables')
            .update({
              winner: opponentPiece,
              game_state: 'finished'
            })
            .eq('table_number', currentTable)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    setMoveTimer(timer)
    
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isMyTurn, currentTableData.last_move_time, currentTableData.winner])

  // Handle game end
  const handleBackToLobby = async () => {
    try {
      const { error } = await supabase
        .from('game_tables')
        .update({
          game_state: 'waiting',
          board: Array(15).fill(null).map(() => Array(15).fill(null)),
          current_player: 1,
          winner: null,
          last_move_time: null,
          player1_ready: false,
          player2_ready: false
        })
        .eq('table_number', currentTable)
      
      if (error) throw error
      
      dispatch({ type: 'RESET_GAME' })
    } catch (error) {
      console.error('Error resetting game:', error)
    }
  }

  const renderCell = (row, col) => {
    const piece = currentTableData.board[row][col]
    return (
      <div
        key={`${row}-${col}`}
        className={`cell ${piece ? 'occupied' : ''} ${isMyTurn && !piece ? 'clickable' : ''}`}
        onClick={() => handleCellClick(row, col)}
      >
        {piece === 1 && <div className="piece black">●</div>}
        {piece === 2 && <div className="piece white">○</div>}
      </div>
    )
  }

  const getWinnerText = () => {
    if (!currentTableData.winner) return ''
    if (currentTableData.winner === myPiece) return '你赢了！'
    return '你输了！'
  }

  const getCurrentPlayerText = () => {
    if (currentTableData.winner) return getWinnerText()
    if (isMyTurn) return `你的回合 (${timeLeft}s)`
    return '对手回合'
  }

  return (
    <div className="game-board-container">
      <div className="game-header">
        <div className="players-info">
          <div className={`player-info ${isPlayer1 ? 'me' : ''}`}>
            <span className="avatar">{currentTableData.player1_avatar}</span>
            <span className="nickname">{currentTableData.player1_nickname}</span>
            <span className="piece">●</span>
            {currentTableData.current_player === 1 && !currentTableData.winner && (
              <span className="turn-indicator">当前回合</span>
            )}
          </div>
          
          <div className="vs">VS</div>
          
          <div className={`player-info ${!isPlayer1 ? 'me' : ''}`}>
            <span className="avatar">{currentTableData.player2_avatar}</span>
            <span className="nickname">{currentTableData.player2_nickname}</span>
            <span className="piece">○</span>
            {currentTableData.current_player === 2 && !currentTableData.winner && (
              <span className="turn-indicator">当前回合</span>
            )}
          </div>
        </div>
        
        <div className="game-status">
          <div className={`status-text ${currentTableData.winner ? 'game-over' : ''}`}>
            {getCurrentPlayerText()}
          </div>
        </div>
      </div>
      
      <div className="board">
        {Array(BOARD_SIZE).fill(null).map((_, row) => (
          <div key={row} className="board-row">
            {Array(BOARD_SIZE).fill(null).map((_, col) => renderCell(row, col))}
          </div>
        ))}
      </div>
      
      {currentTableData.winner && (
        <div className="game-over-actions">
          <button onClick={handleBackToLobby} className="back-to-lobby-btn">
            返回大厅
          </button>
        </div>
      )}
    </div>
  )
}
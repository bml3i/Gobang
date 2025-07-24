import React from 'react'
import { GameProvider, useGame } from './contexts/GameContext'
import PlayerLogin from './components/PlayerLogin'
import GameLobby from './components/GameLobby'
import GameBoard from './components/GameBoard'
import './App.css'

function GameApp() {
  const { state } = useGame()
  const { player, currentTable, tables } = state
  
  // Debug logging
  console.log('App state:', { 
    player: player?.nickname, 
    currentTable, 
    tablesCount: tables.length,
    currentTableData: tables.find(t => t.table_number === currentTable)
  })
  
  // Show login if no player
  if (!player) {
    return <PlayerLogin />
  }
  
  // Show game board if in a game
  const currentTableData = tables.find(t => t.table_number === currentTable)
  console.log('Current table check:', {
    currentTableData,
    gameState: currentTableData?.game_state,
    shouldShowGameBoard: currentTableData && currentTableData.game_state === 'playing'
  })
  
  if (currentTableData && currentTableData.game_state === 'playing') {
    return (
      <div className="app">
        <GameBoard />
      </div>
    )
  }
  
  // Show lobby by default
  return (
    <div className="app">
      <GameLobby />
    </div>
  )
}

function App() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  )
}

export default App

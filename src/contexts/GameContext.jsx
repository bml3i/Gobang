import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { supabase, gameConfig } from '../lib/supabase'

const GameContext = createContext()

const initialState = {
  player: null,
  currentTable: null,
  tables: [],
  gameState: null,
  board: Array(15).fill(null).map(() => Array(15).fill(null)),
  currentPlayer: 1,
  winner: null,
  isMyTurn: false,
  timeLeft: 0,
  gameStarted: false
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PLAYER':
      return { ...state, player: action.payload }
    case 'SET_TABLES':
      return { ...state, tables: action.payload }
    case 'SET_CURRENT_TABLE':
      return { ...state, currentTable: action.payload }
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload }
    case 'SET_BOARD':
      return { ...state, board: action.payload }
    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayer: action.payload }
    case 'SET_WINNER':
      return { ...state, winner: action.payload }
    case 'SET_IS_MY_TURN':
      return { ...state, isMyTurn: action.payload }
    case 'SET_TIME_LEFT':
      return { ...state, timeLeft: action.payload }
    case 'SET_GAME_STARTED':
      return { ...state, gameStarted: action.payload }
    case 'RESET_GAME':
      return {
        ...state,
        board: Array(15).fill(null).map(() => Array(15).fill(null)),
        currentPlayer: 1,
        winner: null,
        isMyTurn: false,
        timeLeft: 0,
        gameStarted: false
      }
    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  // Load saved player data from localStorage on initialization
  useEffect(() => {
    const savedPlayer = localStorage.getItem('gobang_player')
    if (savedPlayer) {
      try {
        const playerData = JSON.parse(savedPlayer)
        dispatch({ type: 'SET_PLAYER', payload: playerData })
        console.log('Loaded saved player:', playerData.nickname)
      } catch (error) {
        console.error('Error loading saved player data:', error)
        localStorage.removeItem('gobang_player')
      }
    }
  }, [])

  // Save player data to localStorage when player changes
  useEffect(() => {
    if (state.player) {
      localStorage.setItem('gobang_player', JSON.stringify(state.player))
      console.log('Saved player data:', state.player.nickname)
    }
  }, [state.player])

  // Initialize tables and handle server restart detection
  useEffect(() => {
    const initializeTables = async () => {
      try {
        console.log('Initializing tables...')
        
        // Generate a unique server instance ID for this session
        const serverInstanceId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Register this client instance and check if server restart occurred
        const { data: resetResult, error: resetError } = await supabase
          .rpc('register_server_instance', { instance_id: serverInstanceId })
        
        if (resetError) {
          console.error('Error registering server instance:', resetError)
        } else if (resetResult) {
          console.log('Server restart detected - game tables have been reset')
        } else {
          console.log('Client session registered - no reset needed')
        }
        
        // Check if tables exist
        const { data: existingTables } = await supabase
          .from('game_tables')
          .select('*')
          .order('table_number')

        if (!existingTables || existingTables.length === 0) {
          // Create tables if they don't exist (this indicates a fresh database)
          const tables = []
          for (let i = 1; i <= gameConfig.tablesCount; i++) {
            tables.push({
              table_number: i,
              player1_id: null,
              player2_id: null,
              player1_ready: false,
              player2_ready: false,
              game_state: 'waiting',
              board: Array(15).fill(null).map(() => Array(15).fill(null)),
              current_player: 1,
              winner: null,
              last_move_time: null
            })
          }
          
          await supabase.from('game_tables').insert(tables)
          console.log('Created new tables with clean state')
        }

        // Fetch current tables
        const { data: tables } = await supabase
          .from('game_tables')
          .select('*')
          .order('table_number')
        
        dispatch({ type: 'SET_TABLES', payload: tables || [] })
        console.log('Tables initialized successfully')
      } catch (error) {
        console.error('Error initializing tables:', error)
      }
    }

    initializeTables()
  }, [])

  // Check if player is already at a table and restore state after tables are loaded
  useEffect(() => {
    if (!state.player || !state.tables.length) return
    
    // Find if player is already at any table
    const playerTable = state.tables.find(table => 
      table.player1_id === state.player.id || table.player2_id === state.player.id
    )
    
    if (playerTable && state.currentTable !== playerTable.table_number) {
      console.log(`Player ${state.player.nickname} found at table ${playerTable.table_number}, restoring state`)
      dispatch({ type: 'SET_CURRENT_TABLE', payload: playerTable.table_number })
      
      // Save current table to localStorage for persistence
      localStorage.setItem('gobang_current_table', playerTable.table_number.toString())
    } else if (!playerTable && state.currentTable) {
      // Player is no longer at any table, clear current table
      console.log(`Player ${state.player.nickname} is no longer at any table, clearing state`)
      dispatch({ type: 'SET_CURRENT_TABLE', payload: null })
      localStorage.removeItem('gobang_current_table')
    }
  }, [state.player, state.tables])

  // Load saved current table from localStorage on initialization
  useEffect(() => {
    if (!state.player) return
    
    const savedTable = localStorage.getItem('gobang_current_table')
    if (savedTable && !state.currentTable) {
      const tableNumber = parseInt(savedTable)
      if (tableNumber && tableNumber >= 1 && tableNumber <= gameConfig.tablesCount) {
        console.log(`Attempting to restore player to table ${tableNumber}`)
        // The actual restoration will be handled by the previous useEffect
        // when tables are loaded and we verify the player is still at that table
      }
    }
  }, [state.player])

  // Subscribe to table changes
  useEffect(() => {
    const channel = supabase
      .channel('game_tables')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_tables'
        },
        (payload) => {
          // Refresh tables data
          supabase
            .from('game_tables')
            .select('*')
            .order('table_number')
            .then(({ data }) => {
              dispatch({ type: 'SET_TABLES', payload: data || [] })
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Monitor current table state changes
  useEffect(() => {
    if (!state.currentTable || !state.tables.length) return
    
    const currentTableData = state.tables.find(t => t.table_number === state.currentTable)
    if (!currentTableData) return
    
    console.log('GameContext: Current table data changed:', {
      tableNumber: state.currentTable,
      gameState: currentTableData.game_state,
      player1Ready: currentTableData.player1_ready,
      player2Ready: currentTableData.player2_ready,
      bothPlayersPresent: !!(currentTableData.player1_id && currentTableData.player2_id)
    })
    
    // Update game state when current table changes
    dispatch({ type: 'SET_GAME_STATE', payload: currentTableData.game_state })
    dispatch({ type: 'SET_BOARD', payload: currentTableData.board })
    dispatch({ type: 'SET_CURRENT_PLAYER', payload: currentTableData.current_player })
    dispatch({ type: 'SET_WINNER', payload: currentTableData.winner })
    dispatch({ type: 'SET_GAME_STARTED', payload: currentTableData.game_state === 'playing' })
    
    // Determine if it's my turn
    if (currentTableData.game_state === 'playing' && state.player) {
      const isPlayer1 = currentTableData.player1_id === state.player.id
      const isPlayer2 = currentTableData.player2_id === state.player.id
      const isMyTurn = (isPlayer1 && currentTableData.current_player === 1) || 
                       (isPlayer2 && currentTableData.current_player === 2)
      dispatch({ type: 'SET_IS_MY_TURN', payload: isMyTurn })
    }
  }, [state.tables, state.currentTable, state.player])

  const value = {
    state,
    dispatch,
    gameConfig
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
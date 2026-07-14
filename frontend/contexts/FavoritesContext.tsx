'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  addFavoriteRoom,
  fetchFavoriteRooms,
  removeFavoriteRoom,
  type FavoriteRoom,
} from '@/lib/favorite-room-service'

type FavoritesContextValue = {
  favorites: FavoriteRoom[]
  favoriteIds: Set<number>
  isLoading: boolean
  errorMessage: string
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
  toggleFavorite: (roomId: number) => Promise<void>
  refreshFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteRoom[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([])
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    try {
      setFavorites(await fetchFavoriteRooms())
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải danh sách yêu thích.')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthLoading) return
    if (!isAuthenticated) {
      setFavorites([])
      setPanelOpen(false)
      return
    }
    void refreshFavorites()
  }, [isAuthLoading, isAuthenticated, refreshFavorites])

  const favoriteIds = useMemo(() => new Set(favorites.map((favorite) => favorite.roomId)), [favorites])

  const toggleFavorite = useCallback(async (roomId: number) => {
    const isFavorite = favorites.some((favorite) => favorite.roomId === roomId)
    setErrorMessage('')

    if (isFavorite) {
      const previous = favorites
      setFavorites((current) => current.filter((favorite) => favorite.roomId !== roomId))
      try {
        await removeFavoriteRoom(roomId)
      } catch (error) {
        setFavorites(previous)
        setErrorMessage(error instanceof Error ? error.message : 'Không thể cập nhật yêu thích.')
        throw error
      }
      return
    }

    try {
      const favorite = await addFavoriteRoom(roomId)
      setFavorites((current) => [favorite, ...current.filter((item) => item.roomId !== roomId)])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể cập nhật yêu thích.')
      throw error
    }
  }, [favorites])

  return (
    <FavoritesContext.Provider value={{
      favorites,
      favoriteIds,
      isLoading,
      errorMessage,
      panelOpen,
      setPanelOpen,
      toggleFavorite,
      refreshFavorites,
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider')
  return context
}

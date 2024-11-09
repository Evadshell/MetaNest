"use client";
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const Game = dynamic(() => import('../../components/Game'), { ssr: false })

export default function Home() {
  const [username, setUsername] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  
  const startGame = () => {
    if (username.trim()) {
      setGameStarted(true)
    }
  }

  if (!gameStarted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Shape Shifters IO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-center"
              />
              <Button 
                onClick={startGame}
                className="w-full"
                size="lg"
              >
                Play Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <Game username={username} />
}


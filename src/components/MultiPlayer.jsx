'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import Phaser from 'phaser'
import io from 'socket.io-client'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Users, 
  MessageSquare, 
  Settings,
  User
} from 'lucide-react'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    }
  ],
}

export default function OfficeGame() {
  const { toast } = useToast()
  const [currentZone, setCurrentZone] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [localStream, setLocalStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState({})
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [userName, setUserName] = useState(`User-${Math.floor(Math.random() * 1000)}`)
  const gameRef = useRef(null)
  const socketRef = useRef(null)
  const peerConnections = useRef({})
  const localVideoRef = useRef(null)
  const currentZoneRef = useRef(null)

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: 800,
      height: 600,
      backgroundColor: '#f0f0f0',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update
      }
    }

    let player
    let cursors
    const otherPlayers = new Map()
    const zones = []
    const furniture = []

    function preload() {
      this.load.image('avatar', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAGMSURBVHgB7VZBUsJAEOzZzfIGfoF+QX1B8oQUj+YH+gMO3tQf4A/kBxBP6g8SfyBvUCucZHfHZA0JkAQSU8WjXbU1yc7OTk9PT4BFixYtEth7f+9rMtIU6HoAOAHAGQHtAWCKgMdENA6ePj/Yc0IA9JzWZwBHhQMRjYg4CJ4/RvnxXIDu9XXHWDsgAHfZBwGGxtBdNBpNl2OLALre9xkCXhZmTxiFYXgRj+cCdK9uDo2lFyK4zOYJ4p9REIycAMoQwNBbMq+wl8LO0PNOiWjgbKGloeA4m0yw7wTo9TzX0NuKcLgYTwXoXfk9g/SaEiDgcxAEfbVfCdDtet+I9JISoO1wODxTe1a8RNrQVqmjHYt3YbkeEjmXzNtKAGV/BdB2vV7/Ru1rAZQlwM3GBMgWYGMC/P0lsEg3xthTpY8iaLtMgFUOLBNAWQLYTQmgTAHsRgRQtgDKFkDZAihbAGULoGwBlC2AsgVQtgDKFkDZAihbAGULoGwBlC2AsgVQtgDKFkDZAihbgBYtWvwv/ACePbx0qBd0YAAAAABJRU5ErkJggg==')
    }

    function createFurniture(scene, x, y, width, height, color, type) {
      const item = scene.add.rectangle(x, y, width, height, color)
      item.setStrokeStyle(2, 0x000000)
      furniture.push(item)
      
      scene.add.text(x - width/2 + 5, y - height/2 + 5, type, { 
        fontSize: '12px',
        color: '#000000',
        backgroundColor: '#FFFFFF',
        padding: { x: 2, y: 1 }
      })
      
      return item
    }

    function create() {
      this.add.rectangle(400, 300, 780, 580, 0xFFFFFF).setStrokeStyle(4, 0x333333)
      
      const zoneData = [
        { 
          x: 50, y: 50, width: 200, height: 150, 
          name: 'Meeting Room',
          furniture: [
            { x: 125, y: 100, width: 120, height: 60, color: 0x8B4513, type: 'Table' },
            { x: 85, y: 80, width: 30, height: 30, color: 0x4A4A4A, type: 'Chair' },
            { x: 165, y: 80, width: 30, height: 30, color: 0x4A4A4A, type: 'Chair' },
            { x: 85, y: 120, width: 30, height: 30, color: 0x4A4A4A, type: 'Chair' },
            { x: 165, y: 120, width: 30, height: 30, color: 0x4A4A4A, type: 'Chair' },
            { x: 230, y: 75, width: 10, height: 100, color: 0xFFFFFF, type: 'Whiteboard' }
          ]
        },
        { 
          x: 300, y: 50, width: 200, height: 150, 
          name: 'Focus Zone',
          furniture: [
            { x: 350, y: 100, width: 40, height: 60, color: 0x8B4513, type: 'Desk' },
            { x: 350, y: 80, width: 30, height: 30, color: 0x4A4A4A, type: 'Chair' },
            { x: 450, y: 100, width: 40, height: 60, color: 0x8B4513, type: 'Desk' },
            { x: 450, y: 80, width: 30, height: 30, color: 0x4A4A4A, type: 'Chair' }
          ]
        },
        { 
          x: 550, y: 50, width: 200, height: 150, 
          name: 'Break Room',
          furniture: [
            { x: 600, y: 100, width: 80, height: 80, color: 0x8B4513, type: 'Sofa' },
            { x: 700, y: 100, width: 40, height: 40, color: 0x4A4A4A, type: 'Table' }
          ]
        },
        { 
          x: 50, y: 250, width: 700, height: 300, 
          name: 'Open Office',
          furniture: [
            { x: 150, y: 300, width: 120, height: 60, color: 0x8B4513, type: 'Desk Pod' },
            { x: 150, y: 280, width: 30, height: 30, color: 0x4A4A4A, type: 'Chair' },
            { x: 350, y: 300, width: 120, height: 60, color: 0x8B4513, type: 'Desk Pod' },
            { x: 350, y: 280, width: 30, height: 30, color: 0x4A4A4A, type: 'Chair' },
            { x: 550, y: 300, width: 120, height: 60, color: 0x8B4513, type: 'Desk Pod' },
            { x: 550, y: 280, width: 30, height: 30, color: 0x4A4A4A, type: 'Chair' },
            { x: 150, y: 450, width: 120, height: 60, color: 0x8B4513, type: 'Desk Pod' },
            { x: 150, y: 430, width: 30, height: 30, color: 0x4A4A4A, type: 'Chair' },
            { x: 350, y: 450, width: 120, height: 60, color: 0x8B4513, type: 'Desk Pod' },
            { x: 350, y: 430, width: 30, height: 30, color: 0x4A4A4A, type: 'Chair' },
            { x: 550, y: 450, width: 120, height: 60, color: 0x8B4513, type: 'Desk Pod' },
            { x: 550, y: 430, width: 30, height: 30, color: 0x4A4A4A, type: 'Chair' }
          ]
        }
      ]

      zoneData.forEach(({ x, y, width, height, name, furniture: furnitureItems }) => {
        const rectangle = new Phaser.Geom.Rectangle(x, y, width, height)
        zones.push({ zone: rectangle, name })
        
        this.add.rectangle(x + width/2, y + height/2, width, height)
          .setStrokeStyle(2, 0x000000)
          .setFillStyle(0xFFFFFF, 0.2)
        
        this.add.text(x + 10, y + 10, name, { 
          fontSize: '16px',
          color: '#000000',
          backgroundColor: '#FFFFFF',
          padding: { x: 5, y: 2 }
        })

        furnitureItems.forEach(item => {
          createFurniture(this, item.x, item.y, item.width, item.height, item.color, item.type)
        })
      })

      player = this.physics.add.sprite(400, 300, 'avatar')
      player.setDisplaySize(32, 32)
      player.setCollideWorldBounds(true)
      
      const nameLabel = this.add.text(400, 320, userName, {
        fontSize: '14px',
        backgroundColor: '#FFFFFF',
        padding: { x: 4, y: 2 }
      })
      nameLabel.setOrigin(0.5, 0)
      
      player.nameLabel = nameLabel
      
      cursors = this.input.keyboard.createCursorKeys()

      socketRef.current = io('http://localhost:4000', {
        query: { userName }
      })

      socketRef.current.on('connect', () => {
        console.log('Connected to server')
        socketRef.current.emit('set-initial-position', { 
          x: player.x, 
          y: player.y,
          userName 
        })
      })

      socketRef.current.on('update-positions', (positions) => {
        Object.entries(positions).forEach(([id, pos]) => {
          if (id !== socketRef.current.id) {
            if (!otherPlayers.has(id)) {
              const newPlayer = this.add.sprite(pos.x, pos.y, 'avatar')
              newPlayer.setDisplaySize(32, 32)
              
              const newNameLabel = this.add.text(pos.x, pos.y + 20, pos.userName || 'Anonymous', {
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                padding: { x: 4, y: 2 }
              })
              newNameLabel.setOrigin(0.5, 0)
              
              newPlayer.nameLabel = newNameLabel
              otherPlayers.set(id, newPlayer)
            } else {
              const existingPlayer = otherPlayers.get(id)
              if (existingPlayer) {
                existingPlayer.setPosition(pos.x, pos.y)
                existingPlayer.nameLabel.setPosition(pos.x, pos.y + 20)
              }
            }
          }
        })
      })

      socketRef.current.on('user-left', ({ userId }) => {
        if (otherPlayers.has(userId)) {
          const player = otherPlayers.get(userId)
          player.nameLabel.destroy()
          player.destroy()
          otherPlayers.delete(userId)
        }
        handleUserDisconnected(userId)
      })

      socketRef.current.on('chat-message', ({ userId, userName, message }) => {
        setChatMessages(prev => [...prev, { userId, userName, message, timestamp: new Date() }])
      })

      socketRef.current.on('offer', handleOffer)
      socketRef.current.on('answer', handleAnswer)
      socketRef.current.on('ice-candidate', handleNewICECandidateMsg)
    }

    function update() {
      if (!player || !cursors) return

      const speed = 160
      player.setVelocity(0)
      
      if (cursors.left.isDown) {
        player.setVelocityX(-speed)
      } else if (cursors.right.isDown) {
        player.setVelocityX(speed)
      }
      
      if (cursors.up.isDown) {
        player.setVelocityY(-speed)
      } else if (cursors.down.isDown) {
        player.setVelocityY(speed)
      }
      
      player.body.velocity.normalize().scale(speed)
      
      if (player.nameLabel) {
        player.nameLabel.setPosition(player.x, player.y + 20)
      }

      let newZone = null
      zones.forEach(({ zone, name }) => {
        if (zone.contains(player.x, player.y)) {
          newZone = name
        }
      })

      if (newZone !== currentZoneRef.current) {
        currentZoneRef.current = newZone
        setCurrentZone(newZone)
        if (newZone) {
          toast({
            title: `Entered ${newZone}`,
            description: `You are now in the ${newZone}`,
            duration: 3000,
          })
        }
      }

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('move', { 
          x: player.x, 
          y: player.y,
          userName 
        })
      }
    }

    gameRef.current = new Phaser.Game(config)
    

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      if (gameRef.current) {
        gameRef.current.destroy(true)
      }
      stopVideoChat()
    }
  }, [userName, toast])

  const startVideoChat = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      Object.keys(remoteStreams).forEach(userId => {
        createPeerConnection(userId, stream)
      })
    } catch (error) {
      console.error('Error accessing media devices:', error)
      toast({
        title: 'Video Chat Error',
        description: 'Failed to access camera/microphone. Please check permissions.',
        variant: 'destructive',
      })
    }
  }, [remoteStreams, toast])

  const createPeerConnection = useCallback((userId, stream) => {
    try {
      const peerConnection = new RTCPeerConnection(ICE_SERVERS)
      
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', {
            to: userId,
            candidate: event.candidate
          })
        }
      }

      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStreams(prev => ({
            ...prev,
            [userId]: event.streams[0]
          }))
        }
      }

      peerConnections.current[userId] = peerConnection

      peerConnection.createOffer().then(offer => {
        return peerConnection.setLocalDescription(offer)
      }).then(() => {
        socketRef.current.emit('offer', {
          to: userId,
          offer: peerConnection.localDescription
        })
      }).catch(err => {
        console.error('Error creating offer:', err)
      })

      return peerConnection
    } catch (err) {
      console.error('Error creating peer connection:', err)
      return null
    }
  }, [])

  const handleOffer = useCallback(async ({ from, offer }) => {
    try {
      let peerConnection = peerConnections.current[from]
      
      if (!peerConnection) {
        peerConnection = new RTCPeerConnection(ICE_SERVERS)
        peerConnections.current[from] = peerConnection

        peerConnection.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStreams(prev => ({
              ...prev,
              [from]: event.streams[0]
            }))
          }
        }

        if (localStream) {
          localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream)
          })
        }
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      
      socketRef.current.emit('answer', {
        to: from,
        answer: peerConnection.localDescription
      })
    } catch (err) {
      console.error('Error handling offer:', err)
    }
  }, [localStream])

  const handleAnswer = useCallback(({ from, answer }) => {
    const peerConnection = peerConnections.current[from]
    if (peerConnection) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }, [])

  const handleNewICECandidateMsg = useCallback(({ from, candidate }) => {
    const peerConnection = peerConnections.current[from]
    if (peerConnection) {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }, [])

  const stopVideoChat = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    Object.values(peerConnections.current).forEach(pc => pc.close())
    peerConnections.current = {}
    
    setRemoteStreams({})
  }, [localStream])

  const handleUserDisconnected = useCallback((userId) => {
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close()
      delete peerConnections.current[userId]
    }
    setRemoteStreams(prev => {
      const newStreams = { ...prev }
      delete newStreams[userId]
      return newStreams
    })
    setOnlineUsers(prev => {
      const newUsers = new Set(prev)
      newUsers.delete(userId)
      return newUsers
    })
  }, [])

  const sendMessage = (e) => {
    e.preventDefault()
    if (inputMessage.trim() && socketRef.current) {
      socketRef.current.emit('chat-message', {
        message: inputMessage,
        userName
      })
      setInputMessage('')
    }
  }

  useEffect(() => {
    startVideoChat()
  }, [startVideoChat])

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1">
        <div id="game-container" className="w-full h-full" />
      </div>
      <div className="w-96 bg-muted/20 p-4 flex flex-col gap-4 border-l">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Profile
              </CardTitle>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAGMSURBVHgB7VZBUsJAEOzZzfIGfoF+QX1B8oQUj+YH+gMO3tQf4A/kBxBP6g8SfyBvUCucZHfHZA0JkAQSU8WjXbU1yc7OTk9PT4BFixYtEth7f+9rMtIU6HoAOAHAGQHtAWCKgMdENA6ePj/Yc0IA9JzWZwBHhQMRjYg4CJ4/RvnxXIDu9XXHWDsgAHfZBwGGxtBdNBpNl2OLALre9xkCXhZmTxiFYXgRj+cCdK9uDo2lFyK4zOYJ4p9REIycAMoQwNBbMq+wl8LO0PNOiWjgbKGloeA4m0yw7wTo9TzX0NuKcLgYTwXoXfk9g/SaEiDgcxAEfbVfCdDtet+I9JISoO1wODxTe1a8RNrQVqmjHYt3YbkeEjmXzNtKAGV/BdB2vV7/Ru1rAZQlwM3GBMgWYGMC/P0lsEg3xthTpY8iaLtMgFUOLBNAWQLYTQmgTAHsRgRQtgDKFkDZAihbAGULoGwBlC2AsgVQtgDKFkDZAihbAGULoGwBlC2AsgVQtgDKFkDZAihbgBYtWvwv/ACePbx0qBd0YAAAAABJRU5ErkJggg==" />
                <AvatarFallback>
                  {userName.split('').slice(0, 2).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="font-medium"
                  placeholder="Enter your name"
                />
                <div className="mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {currentZone || 'Lobby'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Video Chat
              </CardTitle>
              <Badge variant="secondary" className="font-normal">
                {Object.keys(remoteStreams).length} connected
              </Badge>
            </div>
            <CardDescription>
              Connect with others in {currentZone || 'the office'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (localStream) {
                      const audioTrack = localStream.getAudioTracks()[0]
                      audioTrack.enabled = !audioTrack.enabled
                      setIsAudioEnabled(audioTrack.enabled)
                    }
                  }}
                >
                  {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (localStream) {
                      const videoTrack = localStream.getVideoTracks()[0]
                      videoTrack.enabled = !videoTrack.enabled
                      setIsVideoEnabled(videoTrack.enabled)
                    }
                  }}
                >
                  {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <ScrollArea className="h-40 rounded-lg border bg-background">
              {Object.entries(remoteStreams).map(([userId, stream]) => (
                <div key={userId} className="p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback>{userId.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">User {userId}</span>
                  </div>
                  <video
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-muted"
                    ref={el => {
                      if (el) el.srcObject = stream
                    }}
                  />
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat
              </CardTitle>
              <Badge variant="secondary" className="font-normal">
                {chatMessages.length} messages
              </Badge>
            </div>
            <CardDescription>
              Chat with others in {currentZone || 'the office'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4">
              {chatMessages.map((msg, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback>
                        {msg.userName?.slice(0, 2).toUpperCase() || msg.userId.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{msg.userName || msg.userId}</span>
                    <span className="text-xs text-muted-foreground">
                      {msg.timestamp?.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="pl-8 text-sm">{msg.message}</div>
                </div>
              ))}
            </ScrollArea>
            <Separator className="my-4" />
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <Input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
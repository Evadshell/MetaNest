'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Save, X, Edit, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, isLoading } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    nickname: '',
    avatarId: '',
    createdAt: null
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.sub) {
        try {
          const response = await fetch('/api/updateProfile')
          if (response.ok) {
            const data = await response.json()
            setProfileData(data)
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
          toast.error('Failed to load profile data')
        }
      }
    }
    fetchProfile()
  }, [user])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/updateProfile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: profileData.nickname,
          avatarId: profileData.avatarId,
        }),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setProfileData(updatedData)
        setIsEditing(false)
        toast.success('Profile updated successfully')
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile changes')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <CardTitle className="text-3xl font-bold">Profile Settings</CardTitle>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
            <CardDescription>Manage your account settings and preferences</CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Profile Header */}
            <div className="flex items-center space-x-6 pb-6 border-b">
              <Avatar className="h-24 w-24 ring-2 ring-offset-2 ring-offset-background ring-primary">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback className="text-2xl">{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
                {profileData.createdAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Member since {new Date(profileData.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">Display Name</Label>
                  <Input
                    id="nickname"
                    value={profileData.nickname}
                    onChange={(e) => setProfileData({ ...profileData, nickname: e.target.value })}
                    placeholder="Enter your display name"
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarId">Avatar ID</Label>
                  <Input
                    id="avatarId"
                    value={profileData.avatarId}
                    onChange={(e) => setProfileData({ ...profileData, avatarId: e.target.value })}
                    placeholder="Choose your avatar ID"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          {isEditing && (
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
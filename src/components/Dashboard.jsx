'use client'

import React from 'react'
import dynamic from 'next/dynamic'

const DynamicPhaserGame = dynamic(() => import('./PhaserGame'), {
  ssr: false,
})

export default function Dashboard() {
  return (
    <div className="w-full h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Gamified Workspace</h1>
      <div className="w-full h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
        <DynamicPhaserGame />
      </div>
    </div>
  )
}
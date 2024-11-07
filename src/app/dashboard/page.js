import React from 'react'
import { getSession } from '@auth0/nextjs-auth0'
import Dashboard from '@/components/Dashboard'
export default async function DashboardPage() {
  const session = await getSession()

  return (
    <div>
       <Dashboard user={session.user} />
    </div>
  )
}


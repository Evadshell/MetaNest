import React from 'react'
import { useUser } from '@auth0/nextjs-auth0/client';
import Dashboard from '@/components/Dashboard'
import { getSession } from '@auth0/nextjs-auth0'
export default async function DashboardPage() {
  const session = await getSession();
  return (
    <div>
       <Dashboard user={session?.user} />
    </div>
  )
}


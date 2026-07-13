'use client'

import type { ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AdminShell from '@/components/admin/AdminShell'

export default function AdminLayoutClient({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  )
}

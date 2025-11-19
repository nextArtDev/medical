import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAdminUsers } from '../../lib/actions'
import { getBanners, getDepartments } from '../../lib/queries'
import AdminSettingsClient from './components/admin-settings-client'
import BannerSettings from './components/banner-settings'
import DepartmentSettings from './components/department-settings'

interface AdminSettingsPageProps {
  searchParams: Promise<{
    page?: string
    tab?: string
  }>
}

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  //In Next.js 15+, searchParams is asynchronous and needs to be awaited before accessing its properties
  const resolvedSearchParams = await searchParams
  const currentTab = resolvedSearchParams?.tab || 'manage-admins'

  const [adminUsersResult, bannerResult, departmentResult] = await Promise.all([
    getAdminUsers(),
    getBanners(),
    getDepartments(),
  ])

  // Process admin users data concisely
  const {
    data: adminData,
    success: adminSuccess,
    message: adminMessage,
    error: adminError,
  } = adminUsersResult
  const usersFetchError = !adminSuccess
    ? adminMessage || 'Failed to load admin users.'
    : null
  if (usersFetchError) {
    console.error('Failed to fetch admin users:', adminError)
  }

  // Process banners, logging errors if fetches fail
  if (!bannerResult.success) {
    console.error('Failed to fetch banners:', bannerResult.error)
  }
  if (!departmentResult.success) {
    console.error('Failed to fetch departments:', departmentResult.error)
  }

  // Use nullish coalescing (??) for clean fallbacks
  const initialUsers = adminData?.users ?? []
  const initialBanner = bannerResult.data?.banners?.[0] || null
  const initialDepartments = departmentResult.data?.departments ?? []

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-background-1">
      <Tabs defaultValue={currentTab} className="w-full">
        <TabsList className="inline-flex max-w-sm mb-6">
          <TabsTrigger className="body-small" value="manage-admins">
            Manage Admins
          </TabsTrigger>
          <TabsTrigger className="body-small" value="other-settings">
            Other Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage-admins">
          <AdminSettingsClient
            initialUsers={initialUsers}
            usersFetchError={usersFetchError}
          />
        </TabsContent>

        <TabsContent value="other-settings" className="space-y-8">
          <BannerSettings initialBanner={initialBanner} />
          <DepartmentSettings initialDepartments={initialDepartments} />
        </TabsContent>
      </Tabs>
    </main>
  )
}

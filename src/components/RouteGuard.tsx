import { ReactElement } from 'react'
import { useRouter } from 'next/router'
import ComingSoon from '../pages/coming-soon'
import Page404 from '../pages/404'

interface RouteGuardProps {
  children: ReactElement
}

// Routes that show coming soon page
const COMING_SOON_ROUTES = [
  '/partners',
  '/resources',
  '/faucet',
  '/intake',
  '/onboarding',
  '/usecases'
]

// Routes that are fully accessible
const ALLOWED_ROUTES = [
  '/',
  '/coming-soon',
  '/404',
  '/profile',
  '/search',
  '/bookmarks',
  '/asset',
  '/publish',
  '/verify'
]

export default function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter()
  const { pathname } = router

  // If it's an allowed route, show the page directly
  if (ALLOWED_ROUTES.includes(pathname)) {
    return children
  }

  // Check if current path should show coming soon
  const shouldShowComingSoon = COMING_SOON_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (shouldShowComingSoon) {
    return <ComingSoon />
  }

  // Allow asset detail pages (paths starting with /asset/)
  if (
    pathname.startsWith('/asset/') ||
    pathname.startsWith('/publish/') ||
    pathname.startsWith('/verify/')
  ) {
    return children
  }

  // All other pages show 404
  return <Page404 />
}

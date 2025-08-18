import { ReactElement } from 'react'
import { useRouter } from 'next/router'
import ComingSoon from '../pages/coming-soon'
import Page404 from '../pages/404'

interface RouteGuardProps {
  children: ReactElement
}

// Routes that show coming soon page
const COMING_SOON_ROUTES = [
  '/bookmarks',
  '/verify',
  '/partners',
  '/resources',
  '/publish',
  '/profile',
  '/faucet',
  '/intake',
  '/onboarding',
  '/usecases',
  '/search'
]

// Routes that are fully accessible
const ALLOWED_ROUTES = ['/', '/coming-soon', '/404']

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

  // All other pages show 404
  return <Page404 />
}

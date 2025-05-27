export interface UseCase {
  id: string
  title: string
  description: string
  category: string
  organization: string
  image?: string
  benefits: string[]
  link?: string
  isComingSoon?: boolean
}

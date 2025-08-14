import { ReactElement, useEffect, useRef, useState } from 'react'
import { ResourceCard as ResourceCardModel } from '../types'

interface ResourceGridCardProps {
  card: ResourceCardModel
  imageHeightClass?: string
  contentHeightClass?: string
  footerHeightClass?: string
  linkText?: string
}

export default function ResourceGridCard({
  card,
  imageHeightClass = 'h-40',
  contentHeightClass = 'h-48',
  footerHeightClass = 'h-12',
  linkText = 'Read more →'
}: ResourceGridCardProps): ReactElement {
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const [descClamp, setDescClamp] = useState<number>(4)

  useEffect(() => {
    const computeClamp = () => {
      if (!titleRef.current) return
      const el = titleRef.current
      const computed = window.getComputedStyle(el)
      const lineHeight = parseFloat(computed.lineHeight || '0')
      const titleHeight = el.getBoundingClientRect().height
      const lines = lineHeight > 0 ? Math.round(titleHeight / lineHeight) : 1
      setDescClamp(lines <= 1 ? 5 : 4)
    }

    computeClamp()
    const onResize = () => computeClamp()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col">
      <img
        src={card.image}
        alt={card.title}
        className={`w-full object-cover ${imageHeightClass}`}
        onError={(e) => {
          e.currentTarget.src =
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDMyMCAxNjAiIGZpbGw9Im5vbGUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTYwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjE2MCIgeT0iODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9IjAuM2VtIj5JbWFnZSBQbGFjZWhvbGRlcjwvdGV4dD4KPC9zdmc+'
        }}
      />
      <div className="px-5 pt-5 flex flex-col">
        <div className={`flex flex-col ${contentHeightClass}`}>
          <div className="text-xs font-semibold uppercase text-gray-600 mb-2">
            {card.tag}
          </div>
          <h3
            ref={titleRef}
            className="text-xl font-bold mb-2 text-black line-clamp-2"
          >
            {card.title}
          </h3>
          <p
            className="text-base text-gray-600 leading-relaxed line-clamp-4 overflow-hidden"
            style={{ WebkitLineClamp: String(descClamp) }}
          >
            {card.description}
          </p>
        </div>
        <div className={`mt-auto flex items-start py-2 ${footerHeightClass}`}>
          <a
            href={card.link}
            className="text-[var(--color-primary)] font-semibold text-sm hover:underline hover:text-[#a25e3c] transition-colors duration-200"
          >
            {linkText}
          </a>
        </div>
      </div>
    </div>
  )
}

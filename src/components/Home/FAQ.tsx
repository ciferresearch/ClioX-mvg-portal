'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Container from '@components/@shared/atoms/Container'
import { getLandingPageContent } from '@utils/landingPageContent'

interface FAQItem {
  question: string
  answer: string
}

const FAQ = () => {
  const content = getLandingPageContent()
  const { faq } = content
  const [expandedIndices, setExpandedIndices] = useState<number[]>([])

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  return (
    <section className="pb-24 bg-white">
      <Container>
        <h2 className="text-4xl font-bold mb-4 font-sans">{faq.title}</h2>

        <div className="divide-y divide-gray-200">
          {faq.items.map((item, index) => (
            <div key={index} className="py-6">
              <button
                onClick={() => toggleExpand(index)}
                className="w-full flex justify-between items-center text-left focus:outline-none group cursor-pointer"
              >
                <h3 className="text-2xl font-bold font-sans group-hover:text-[#c8794d] text-black/80">
                  {item.question}
                </h3>
                <svg
                  className={`w-6 h-6 text-gray-500 transform transition-transform duration-200 ${
                    expandedIndices.includes(index) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <AnimatePresence>
                {expandedIndices.includes(index) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-lg font-serif text-black/80 pt-6">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default FAQ

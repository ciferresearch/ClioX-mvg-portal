import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import * as Accordion from '@radix-ui/react-accordion'

interface BenefitItem {
  id: string
  number: string
  title: string
  description: string
}

const benefits: BenefitItem[] = [
  {
    id: 'ethical',
    number: '01',
    title: 'Ethical by design',
    description:
      'Privacy-preserving architecture with transparent governance, consent, and auditability built in.'
  },
  {
    id: 'unified',
    number: '02',
    title: 'Unified multi-omic intelligence',
    description:
      'Securely integrates genomic, clinical, claims, and lifestyle data to produce deeper, more actionable insights.'
  },
  {
    id: 'accelerated',
    number: '03',
    title: 'Accelerated discovery',
    description:
      'AI/ML pipelines surface patterns, risks, and opportunities faster.'
  },
  {
    id: 'seamless',
    number: '04',
    title: 'Seamless integration',
    description:
      'Fits existing clinical, research, and analytics workflows via plugins and APIs, reducing friction and time to value.'
  }
]

export default function BenefitsSection() {
  const [openItem, setOpenItem] = useState<string>('ethical')

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.h2
          className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          What Sets Us Apart
        </motion.h2>

        <Accordion.Root
          type="single"
          value={openItem}
          onValueChange={(value) => setOpenItem(value || '')}
          collapsible
          className="border-t border-gray-200"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Accordion.Item
                value={benefit.id}
                className="border-b border-gray-200"
              >
                <Accordion.Trigger className="w-full py-6 lg:py-8 flex items-start gap-6 lg:gap-8 text-left hover:bg-gray-50/50 transition-colors duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-lg cursor-pointer">
                  <span className="text-emerald-400 font-bold text-lg lg:text-xl tracking-wider opacity-90 mt-1 min-w-[3ch]">
                    {benefit.number}
                  </span>
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight group-hover:text-teal-700 transition-colors duration-200 flex-1">
                    {benefit.title}
                  </h3>
                  <motion.div
                    className="ml-auto mt-1 text-gray-400 group-hover:text-teal-600 transition-colors duration-200"
                    animate={{
                      rotate: openItem === benefit.id ? 180 : 0
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </motion.div>
                </Accordion.Trigger>

                <div className="overflow-hidden">
                  <AnimatePresence>
                    {openItem === benefit.id && (
                      <motion.div
                        key={`content-${benefit.id}`}
                        initial={{
                          height: 0,
                          opacity: 0,
                          y: -10
                        }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                          y: 0
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          y: -10
                        }}
                        transition={{
                          duration: 0.4,
                          ease: [0.16, 1, 0.3, 1],
                          opacity: { duration: 0.3, delay: 0.05 },
                          y: { duration: 0.35 },
                          height: { duration: 0.4 }
                        }}
                        className="overflow-hidden"
                        style={{
                          originY: 0
                        }}
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{
                            opacity: 0,
                            transition: { duration: 0.35 }
                          }}
                          transition={{ duration: 0.3, delay: 0.05 }}
                          className="pb-6 lg:pb-8 pl-14 lg:pl-16 pr-4"
                        >
                          <p className="text-gray-600 leading-relaxed text-base lg:text-lg max-w-4xl">
                            {benefit.description}
                          </p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Accordion.Item>
            </motion.div>
          ))}
        </Accordion.Root>
      </div>
    </section>
  )
}

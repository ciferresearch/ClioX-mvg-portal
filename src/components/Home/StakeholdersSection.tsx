import { motion } from 'motion/react'

interface StakeholderCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

const stakeholders: StakeholderCard[] = [
  {
    id: 'patients',
    title: 'For Patients',
    description:
      'Private, consent-led access to your data and personalized insights that support better everyday decisions.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-8 h-8 text-emerald-50"
      >
        <path d="M20.8 7.6c0 6.1-8.8 10.2-8.8 10.2S3.2 13.7 3.2 7.6a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8Z" />
      </svg>
    )
  },
  {
    id: 'providers',
    title: 'For Providers',
    description:
      'Bring multi-omic and clinical data into the workflow you already use to diagnose faster and personalize treatment plans.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-8 h-8 text-emerald-50"
      >
        <path d="M6 3v6a4 4 0 1 0 8 0V3" />
        <path d="M6 13a6 6 0 0 0 12 0" />
      </svg>
    )
  },
  {
    id: 'payers',
    title: 'For Payers',
    description:
      'Improve population health and reduce costs with governed analytics that surface risks, gaps, and outcomes in real time.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-8 h-8 text-emerald-50"
      >
        <path d="M3 20h18" />
        <path d="M7 20V10M12 20V6M17 20v-8" />
      </svg>
    )
  },
  {
    id: 'pharma',
    title: 'For Pharma',
    description:
      'Accelerate discovery with high-quality, diverse, and consented real-world data to power evidence generation and trials.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-8 h-8 text-emerald-50"
      >
        <path d="M6 2h12" />
        <path d="M9 2v5l-5 9a4 4 0 0 0 3.5 6h9a4 4 0 0 0 3.5-6l-5-9V2" />
      </svg>
    )
  }
]

export default function StakeholdersSection() {
  return (
    <section className="bg-teal-50 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4">
            See what MY Data Platform can do for you
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
          {stakeholders.map((stakeholder, index) => (
            <motion.div
              key={stakeholder.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: 'easeOut'
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className="group"
            >
              <div className="bg-white border border-gray-100 rounded-2xl p-6 lg:p-8 shadow-md hover:shadow-xl hover:border-teal-200 transition-all duration-300 h-full flex flex-col items-center text-center cursor-default">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                  {stakeholder.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-teal-700 transition-colors duration-300">
                  {stakeholder.title}
                </h3>

                <p className="text-gray-600 leading-relaxed text-sm lg:text-base flex-1">
                  {stakeholder.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

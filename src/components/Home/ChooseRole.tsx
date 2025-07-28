'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import Button from '../Home/common/Button'
import Container from '@components/@shared/atoms/Container'
import { getLandingPageContent } from '@utils/landingPageContent'

// Add scroll helper function
const scrollToElement = (e: React.MouseEvent, selector: string): void => {
  e.preventDefault()
  document.querySelector(selector)?.scrollIntoView({
    behavior: 'smooth'
  })
}

type Role = {
  imageSrc: string
  title: string
  description: string
  primaryAction: string
  primaryActionLink: string
  secondaryAction: string
  secondaryActionLink: string
}

export default function ChooseRole() {
  const [hoveredRole, setHoveredRole] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const content = getLandingPageContent()
  const { chooseRole } = content

  const handleMouseEnter = (index: number) => {
    setHoveredRole(index)
  }

  const handleMouseLeave = () => {
    setHoveredRole(null)
  }

  const handleRoleClick = (index: number) => {
    setSelectedRole(selectedRole === index ? null : index)
  }

  return (
    <section id="choose-role" className="pt-16 bg-white">
      <Container className="px-4">
        <div className="w-full mx-auto text-center">
          <h2 className="text-4xl font-bold mb-5 font-sans">
            {chooseRole.title}
          </h2>
          <p className="text-gray-600 text-lg mb-10 font-serif">
            {chooseRole.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mx-auto">
          {chooseRole.roles.map((role, index) => (
            <div
              key={index}
              className="flex flex-col w-full mx-auto max-w-[340px] mb-10 md:mb-0"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <motion.div
                className={`flex flex-col items-center text-center h-auto min-h-[400px] w-full
                  cursor-pointer transition-all duration-300 p-6
                  border border-gray-200 shadow-sm rounded-2xl
                  ${
                    hoveredRole === index || selectedRole === index
                      ? 'ring-1 ring-[#c8794d] shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleRoleClick(index)}
              >
                <div className="flex flex-col h-full items-center">
                  <div className="h-[160px] flex items-center justify-center">
                    <div className="relative w-[96px] h-[96px]">
                      <Image
                        src={role.imageSrc}
                        alt={`${role.title} icon`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center mb-4">
                    <h3 className="text-xl font-bold font-heading">
                      {role.title}
                    </h3>
                  </div>

                  <div className="flex items-start justify-center pt-2">
                    <p className="text-base text-black/80 font-body">
                      {role.description}
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="mt-4 w-full mx-auto h-[120px] flex flex-col justify-start">
                <motion.div
                  className="space-y-3 flex flex-col items-center"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{
                    opacity:
                      hoveredRole === index || selectedRole === index ? 1 : 0,
                    y: hoveredRole === index || selectedRole === index ? 0 : -20
                  }}
                  transition={{
                    duration: 0.6,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  <Link
                    href={role.primaryActionLink}
                    className="w-full flex justify-center"
                  >
                    <Button
                      variant="primary"
                      size="lg"
                      className={`w-full max-w-[280px] bg-[#a47e5a] hover:bg-[#8e6c4c] border-0 rounded-xl font-medium text-white transform transition-all duration-200 ${
                        hoveredRole === index || selectedRole === index
                          ? ''
                          : 'pointer-events-none'
                      }`}
                    >
                      {role.primaryAction}
                    </Button>
                  </Link>
                  <Link
                    href={role.secondaryActionLink}
                    className="w-full flex justify-center"
                    onClick={
                      role.secondaryActionLink.startsWith('#')
                        ? (e) => scrollToElement(e, role.secondaryActionLink)
                        : undefined
                    }
                  >
                    <Button
                      variant="secondary"
                      size="lg"
                      className={`w-full max-w-[280px] bg-[#efe6d5] hover:bg-[#e6dcc8] border-0 rounded-xl font-medium text-black transform transition-all duration-200 ${
                        hoveredRole === index || selectedRole === index
                          ? ''
                          : 'pointer-events-none'
                      }`}
                    >
                      {role.secondaryAction}
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

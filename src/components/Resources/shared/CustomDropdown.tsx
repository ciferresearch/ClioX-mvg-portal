import { ReactElement, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface DropdownOption {
  value: string
  label: string
}

interface CustomDropdownProps {
  id: string
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  label?: string
  widthClass?: string
}

export default function CustomDropdown({
  id,
  value,
  options,
  onChange,
  label,
  widthClass = 'w-24 sm:w-40'
}: CustomDropdownProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700 sm:text-base"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <button
            id={id}
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center ${widthClass} px-3 py-2 text-left bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:border-gray-300 hover:border-gray-400 transition-colors duration-200 text-sm font-medium relative cursor-pointer sm:text-base`}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className="truncate text-gray-900 pr-8 text-sm sm:text-base">
              {selectedOption?.label}
            </span>
            <ChevronDownIcon
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 absolute right-3 top-1/2 transform -translate-y-1/2 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />

              {/* Dropdown Menu */}
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                <div className="py-1">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onChange(option.value)
                        setIsOpen(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:bg-gray-50 focus:text-gray-900 transition-colors duration-150 sm:text-base ${
                        option.value === value
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-700'
                      }`}
                      role="option"
                      aria-selected={option.value === value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

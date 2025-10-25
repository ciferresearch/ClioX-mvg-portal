import { ReactElement, useEffect, useState } from 'react'
import CreatableSelect from 'react-select/creatable'
import { components as selectComponents, OnChangeValue } from 'react-select'
import { useField } from 'formik'
import { InputProps } from '../..'
import { getTagsList } from '@utils/aquarius'
import { chainIds, assetTitlePrefix } from '../../../../../../app.config'
import { useCancelToken } from '@hooks/useCancelToken'
import styles from './index.module.css'
import { matchSorter } from 'match-sorter'

interface AutoCompleteOption {
  readonly value: string
  readonly label: string
}

export default function TagsAutoComplete({
  ...props
}: InputProps): ReactElement {
  const { name, placeholder } = props
  const [tagsList, setTagsList] = useState<AutoCompleteOption[]>()
  const [matchedTagsList, setMatchedTagsList] = useState<AutoCompleteOption[]>(
    []
  )
  const [field, meta, helpers] = useField(name)
  const [input, setInput] = useState<string>()

  const newCancelToken = useCancelToken()

  const generateAutocompleteOptions = (
    options: string[]
  ): AutoCompleteOption[] => {
    return options?.map((tag) => ({
      value: tag,
      label: tag
    }))
  }

  const selectedTags = field.value
    ? generateAutocompleteOptions(field.value)
    : []

  useEffect(() => {
    const generateTagsList = async () => {
      const tags = await getTagsList(chainIds, newCancelToken())
      const autocompleteOptions = generateAutocompleteOptions(tags)
      setTagsList(autocompleteOptions)
    }
    generateTagsList()
  }, [newCancelToken])

  const handleChange = (userInput: OnChangeValue<AutoCompleteOption, true>) => {
    let normalizedInput = userInput.map((input) => input.value)

    // Enforce non-removable default tag only for publish form field
    const enforceLock = name === 'metadata.tags'
    if (enforceLock) {
      const hasProtected = normalizedInput.some(
        (v) => v?.toLowerCase() === assetTitlePrefix?.toLowerCase()
      )
      if (!hasProtected && assetTitlePrefix) {
        normalizedInput = [assetTitlePrefix, ...normalizedInput]
      }
      // ensure unique values
      normalizedInput = Array.from(new Set(normalizedInput))
    }

    helpers.setValue(normalizedInput)
    helpers.setTouched(true)
  }

  const handleOptionsFilter = (
    options: AutoCompleteOption[],
    input: string
  ): void => {
    setInput(input)
    const matchedTagsList = matchSorter(options, input, { keys: ['value'] })
    setMatchedTagsList(matchedTagsList)
  }

  // Adjust padding only for protected (non-removable) tag; keep defaults otherwise
  const selectStyles = {
    multiValueLabel: (base: any, state: any) => {
      const isProtected =
        state?.selectProps?.name === 'metadata.tags' &&
        state?.data?.value?.toLowerCase() === assetTitlePrefix?.toLowerCase()
      return isProtected ? { ...base, paddingLeft: 6, paddingRight: 6 } : base
    }
  }

  return (
    <CreatableSelect
      components={{
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
        // Hide remove icon for protected tag when used in publish form
        MultiValueRemove: (componentProps) => {
          const enforceLock = name === 'metadata.tags'
          const isProtected =
            enforceLock &&
            componentProps.data?.value?.toLowerCase() ===
              assetTitlePrefix?.toLowerCase()
          if (isProtected) return null
          return <selectComponents.MultiValueRemove {...componentProps} />
        }
      }}
      className={styles.select}
      value={selectedTags}
      styles={selectStyles}
      name={name}
      hideSelectedOptions
      isMulti
      isClearable={false}
      noOptionsMessage={() =>
        'Start typing to get suggestions based on tags from all published assets.'
      }
      onChange={(value: AutoCompleteOption[]) => handleChange(value)}
      onInputChange={(value) => handleOptionsFilter(tagsList, value)}
      openMenuOnClick
      options={!input || input?.length < 1 ? [] : matchedTagsList}
      placeholder={placeholder}
      onKeyDown={(e) => {
        // Prevent backspace from removing protected tag when no input text
        if (name !== 'metadata.tags') return
        if (e.key !== 'Backspace') return
        if (input && input.length > 0) return
        const values: string[] = field?.value || []
        if (!values?.length) return
        const last = values[values.length - 1]
        if (last?.toLowerCase() === assetTitlePrefix?.toLowerCase()) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      theme={(theme) => ({
        ...theme,
        colors: { ...theme.colors, primary25: 'var(--border-color)' }
      })}
    />
  )
}

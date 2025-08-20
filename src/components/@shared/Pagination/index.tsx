import { useState, useEffect, ReactElement } from 'react'
import { motion } from 'framer-motion'
import ReactPaginate from 'react-paginate'
import { MAXIMUM_NUMBER_OF_PAGES_WITH_RESULTS } from '@utils/aquarius'
import Arrow from '@images/arrow.svg'
import { PaginationProps } from './_types'

export default function Pagination({
  totalPages,
  currentPage,
  rowsPerPage,
  rowCount,
  onChangePage
}: PaginationProps): ReactElement {
  const [smallViewport, setSmallViewport] = useState(true)
  const [totalPageNumbers, setTotalPageNumbers] = useState<number>()

  function getTotalPages() {
    if (totalPages) return setTotalPageNumbers(totalPages)
    const doublePageNumber = rowCount / rowsPerPage
    const roundedPageNumber = Math.round(doublePageNumber)
    const total =
      roundedPageNumber < doublePageNumber
        ? roundedPageNumber + 1
        : roundedPageNumber
    setTotalPageNumbers(total)
  }

  function onPageChange(page: number) {
    totalPages ? onChangePage(page) : onChangePage(page + 1)
  }

  function viewportChange(mq: { matches: boolean }) {
    setSmallViewport(!mq.matches)
  }

  useEffect(() => {
    getTotalPages()
  }, [totalPages, rowCount])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 600px)')
    viewportChange(mq)
    mq.addEventListener('change', viewportChange)

    return () => {
      mq.removeEventListener('change', viewportChange)
    }
  }, [])

  return totalPageNumbers && totalPageNumbers > 1 ? (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ReactPaginate
        pageCount={
          totalPageNumbers > MAXIMUM_NUMBER_OF_PAGES_WITH_RESULTS
            ? MAXIMUM_NUMBER_OF_PAGES_WITH_RESULTS
            : totalPageNumbers
        }
        // react-pagination starts counting at 0, we start at 1
        initialPage={currentPage ? currentPage - 1 : 0}
        // adapt based on media query match
        marginPagesDisplayed={smallViewport ? 0 : 1}
        pageRangeDisplayed={smallViewport ? 3 : 6}
        onPageChange={(data) => onPageChange(data.selected)}
        disableInitialCallback
        previousLabel={<Arrow className="w-4 h-4 fill-current rotate-180" />}
        nextLabel={<Arrow className="w-4 h-4 fill-current" />}
        breakLabel="..."
        containerClassName="
          flex flex-wrap justify-center mt-6 mb-6 pl-0 text-sm
        "
        pageLinkClassName="
          font-bold px-2 py-1 -ml-px -mt-px block cursor-pointer
          min-w-[3rem] h-full flex items-center justify-center
          text-emerald-700 hover:text-emerald-500
          transition-colors duration-200
          first:rounded-l last:rounded-r
        "
        activeLinkClassName="
          cursor-default pointer-events-none text-gray-900
        "
        previousLinkClassName="
          font-bold px-2 py-1 -ml-px -mt-px block cursor-pointer
          min-w-[3rem] h-full flex items-center justify-center
          text-emerald-700 hover:text-emerald-500
          transition-colors duration-200 text-right
        "
        nextLinkClassName="
          font-bold px-2 py-1 -ml-px -mt-px block cursor-pointer
          min-w-[3rem] h-full flex items-center justify-center
          text-emerald-700 hover:text-emerald-500
          transition-colors duration-200 text-right
        "
        disabledClassName="opacity-0"
        breakLinkClassName="
          font-bold px-2 py-1 -ml-px -mt-px block cursor-pointer 
          min-w-[3rem] h-full flex items-center justify-center
          text-emerald-600
        "
      />
    </motion.div>
  ) : null
}

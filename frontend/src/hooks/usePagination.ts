import { useState } from 'react'

interface PaginationState {
  page: number
  size: number
}

export function usePagination(initialSize = 10) {
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, size: initialSize })

  const setPage = (page: number) => setPagination((prev) => ({ ...prev, page }))
  const setSize = (size: number) => setPagination({ page: 1, size })
  const reset = () => setPagination({ page: 1, size: initialSize })

  return { ...pagination, setPage, setSize, reset }
}

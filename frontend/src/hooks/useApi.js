import { useState, useCallback } from 'react'
import api from '../services/api'

export function useApi() {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (request) => {
    setState({ data: null, loading: true, error: null })
    try {
      const data = await request()
      setState({ data, loading: false, error: null })
      return data
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Une erreur est survenue'
      setState({ data: null, loading: false, error: message })
      throw err
    }
  }, [])

  const get = useCallback(
    (url) => execute(() => api.get(url).then((r) => r.data)),
    [execute]
  )

  const create = useCallback(
    (url, data) => execute(() => api.post(url, data).then((r) => r.data)),
    [execute]
  )

  const update = useCallback(
    (url, data) => execute(() => api.put(url, data).then((r) => r.data)),
    [execute]
  )

  const remove = useCallback(
    (url) => execute(() => api.delete(url).then((r) => r.data)),
    [execute]
  )

  return { ...state, get, create, update, remove, execute }
}

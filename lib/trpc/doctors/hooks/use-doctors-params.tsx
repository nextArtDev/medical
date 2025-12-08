import { useQueryStates } from 'nuqs'
import { doctorsInfiniteParams, doctorsParams } from '../params'

export const useDoctorsParams = () => {
  return useQueryStates(doctorsParams)
}

/**
 * Hook for managing infinite scroll product params in URL
 */
export const useDoctorsInfiniteParams = () => {
  return useQueryStates(doctorsInfiniteParams, {
    history: 'push',
    scroll: false,
    shallow: true,
  })
}

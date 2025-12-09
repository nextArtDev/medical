import { createLoader } from 'nuqs/server'
import { doctorsInfiniteParams, doctorsParams } from '../params'

export const doctorsParamsLoader = createLoader(doctorsInfiniteParams)

import { useReducer } from 'react'
import type { PrintMode } from '@/types/calculator'
import { QUOTE_DEFAULTS } from '@/lib/quote-defaults'
export interface CalculatorFormState {
  studyNumber: string
  selectedProductTypeId: string
  productSearch: string
  isProductDropdownOpen: boolean
  quantity: number
  selectedPlateId: string
  flatWidth: number
  flatHeight: number
  printSurfacePercent: number
  printMode: PrintMode
  isRectoVerso: boolean
  hasVarnish: boolean
  hasFlatColor: boolean
  rectoVersoType: string | null
  cuttingTimePerPoseSeconds: number
  assemblyTimePerPieceSeconds: number
  packTimePerPieceSeconds: number
  hasAssemblyNotice: boolean
  currentAccessoryId: string
  currentAccessoryQty: number
  currentConsumableId: string
  currentConsumableSize: number
  hasPackaging: boolean
  packagingPlateId: string
  packagingQuantity: number
  packagingCuttingTimePerPoseSeconds: number
  packagingWidth: number
  packagingHeight: number
  hasPrintSetup: boolean
  hasCuttingSetup: boolean
  hasImpression: boolean
  hasFaconnage: boolean
  hasConditionnement: boolean
  hasAccessoires: boolean
}

export const initialFormState: CalculatorFormState = {
  studyNumber: 'ET',
  selectedProductTypeId: '',
  productSearch: '',
  isProductDropdownOpen: false,
  quantity: 100,
  selectedPlateId: '',
  flatWidth: 0,
  flatHeight: 0,
  printSurfacePercent: 0,
  rectoVersoType: null,
  currentAccessoryId: '',
  currentAccessoryQty: 0,
  currentConsumableId: '',
  currentConsumableSize: 0,
  packagingPlateId: '',
  packagingQuantity: 0,
  packagingWidth: 0,
  packagingHeight: 0,
  // ✅ Valeurs par défaut depuis la source unique
  ...QUOTE_DEFAULTS,
}

export type CalculatorFormAction =
  | { type: 'SET_FIELD'; field: keyof CalculatorFormState; value: CalculatorFormState[keyof CalculatorFormState] }
  | { type: 'RESET' }

export function calculatorFormReducer(
  state: CalculatorFormState,
  action: CalculatorFormAction
): CalculatorFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return initialFormState
    default:
      return state
  }
}

export function useCalculatorForm() {
  const [formState, dispatch] = useReducer(calculatorFormReducer, initialFormState)

  const setField = <K extends keyof CalculatorFormState>(
    field: K,
    value: CalculatorFormState[K]
  ) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }

  const resetForm = () => {
    dispatch({ type: 'RESET' })
  }

  return { formState, setField, resetForm }
}
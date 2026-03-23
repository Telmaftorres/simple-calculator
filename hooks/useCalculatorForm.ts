import { useReducer } from 'react'
import { QUOTE_DEFAULTS } from '@/lib/quote-defaults'

export const initialFormState = {
  studyNumber: 'ET' as string,
  selectedProductTypeId: '' as string,
  productSearch: '' as string,
  isProductDropdownOpen: false as boolean,
  quantity: 100 as number,
  selectedPlateId: '' as string,
  flatWidth: 0 as number,
  flatHeight: 0 as number,
  inkMlPerPlate: 20 as number,          // ✅ renommé, défaut 20 ml
  rectoVersoType: null as string | null,
  currentAccessoryId: '' as string,
  currentAccessoryQty: 0 as number,
  currentConsumableId: '' as string,
  currentConsumableSize: 0 as number,
  packagingPlateId: '' as string,
  packagingQuantity: 0 as number,
  packagingWidth: 0 as number,
  packagingHeight: 0 as number,
  ...QUOTE_DEFAULTS,
}

export type CalculatorFormState = typeof initialFormState

export type CalculatorFormAction =
  | { type: 'SET_FIELD'; field: keyof CalculatorFormState; value: CalculatorFormState[keyof CalculatorFormState] }
  | { type: 'LOAD_QUOTE'; payload: Partial<CalculatorFormState> }
  | { type: 'RESET' }

export function calculatorFormReducer(
  state: CalculatorFormState,
  action: CalculatorFormAction
): CalculatorFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'LOAD_QUOTE':
      return { ...initialFormState, ...action.payload }
    case 'RESET':
      return { ...initialFormState }
    default:
      return state
  }
}

export function useCalculatorForm() {
  const [formState, dispatch] = useReducer(calculatorFormReducer, { ...initialFormState })

  const setField = <K extends keyof CalculatorFormState>(
    field: K,
    value: CalculatorFormState[K]
  ) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }

  const loadQuote = (payload: Partial<CalculatorFormState>) => {
    dispatch({ type: 'LOAD_QUOTE', payload })
  }

  const resetForm = () => dispatch({ type: 'RESET' })

  return { formState, setField, loadQuote, resetForm }
}
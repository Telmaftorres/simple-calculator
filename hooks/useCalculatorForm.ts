import { useReducer } from 'react'
import { QUOTE_DEFAULTS } from '@/lib/quote-defaults'
import { DEFAULT_PRODUCT_SLOT } from '@/types/calculator'
import type { ProductSlot } from '@/types/calculator'
import { v4 as uuidv4 } from 'uuid'

export const initialFormState = {
  studyNumber: 'ET' as string,
  selectedProductTypeId: '' as string,
  productSearch: '' as string,
  isProductDropdownOpen: false as boolean,
  quantity: 100 as number,
  selectedPlateId: '' as string,
  flatWidth: 0 as number,
  flatHeight: 0 as number,
  inkMlPerPlate: 20 as number,
  rectoVersoType: null as string | null,
  currentAccessoryId: '' as string,
  currentAccessoryQty: 0 as number,
  currentConsumableId: '' as string,
  currentConsumableSize: 0 as number,
  packagingPlateId: '' as string,
  packagingQuantity: 0 as number,
  packagingWidth: 0 as number,
  packagingHeight: 0 as number,
  products: [] as ProductSlot[],
  activeProductIndex: 0 as number,
  ...QUOTE_DEFAULTS,
}

export type CalculatorFormState = typeof initialFormState

export type CalculatorFormAction =
  | { type: 'SET_FIELD'; field: keyof CalculatorFormState; value: CalculatorFormState[keyof CalculatorFormState] }
  | { type: 'LOAD_QUOTE'; payload: Partial<CalculatorFormState> }
  | { type: 'RESET' }
  | { type: 'ADD_PRODUCT' }
  | { type: 'REMOVE_PRODUCT'; index: number }
  | { type: 'SET_ACTIVE_PRODUCT'; index: number }
  | { type: 'UPDATE_PRODUCT'; index: number; field: keyof ProductSlot; value: ProductSlot[keyof ProductSlot] }

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

    case 'ADD_PRODUCT': {
      const newSlot: ProductSlot = {
        ...DEFAULT_PRODUCT_SLOT,
        id: uuidv4(),
      }
      const newProducts = [...state.products, newSlot]
      return {
        ...state,
        products: newProducts,
        activeProductIndex: newProducts.length - 1,
      }
    }

    case 'REMOVE_PRODUCT': {
      if (state.products.length <= 1) return state
      const newProducts = state.products.filter((_, i) => i !== action.index)
      const newIndex = Math.min(state.activeProductIndex, newProducts.length - 1)
      return {
        ...state,
        products: newProducts,
        activeProductIndex: newIndex,
      }
    }

    case 'SET_ACTIVE_PRODUCT':
      return { ...state, activeProductIndex: action.index }

    case 'UPDATE_PRODUCT': {
      const newProducts = state.products.map((p, i) =>
        i === action.index ? { ...p, [action.field]: action.value } : p
      )
      return { ...state, products: newProducts }
    }

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

  const addProduct = () => dispatch({ type: 'ADD_PRODUCT' })

  const removeProduct = (index: number) => dispatch({ type: 'REMOVE_PRODUCT', index })

  const setActiveProduct = (index: number) => dispatch({ type: 'SET_ACTIVE_PRODUCT', index })

  const updateProduct = <K extends keyof ProductSlot>(
    index: number,
    field: K,
    value: ProductSlot[K]
  ) => {
    dispatch({ type: 'UPDATE_PRODUCT', index, field, value })
  }

  return {
    formState,
    setField,
    loadQuote,
    resetForm,
    addProduct,
    removeProduct,
    setActiveProduct,
    updateProduct,
  }
}
import { afterEach, expect, it, vi } from 'vitest'
import { createStore } from 'zustand/vanilla'
import type { StoreApi } from 'zustand/vanilla'

// To avoid include react deps on vanilla version
vi.mock('react', () => ({}))

const consoleError = console.error
afterEach(() => {
  console.error = consoleError
})

it('create a store', () => {
  let params
  const result = createStore((...args) => {
    params = args
    return { value: null }
  })
  expect({ params, result }).toMatchInlineSnapshot(`
   {
      "params": [
        [Function],
        [Function],
        {
          "destroy": [Function],
          "getState": [Function],
          "setState": [Function],
          "subscribe": [Function],
        },
      ],
      "result": {
        "destroy": [Function],
        "getState": [Function],
        "setState": [Function],
        "subscribe": [Function],
      },
    }
  `)
})

type CounterState = {
  count: number
  inc: () => void
}

it('uses the store', async () => {
  const store = createStore<CounterState>((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }))
  store.getState().inc()

  expect(store.getState().count).toBe(1)
})

it('can get the store', async () => {
  type State = {
    value: number
    getState1: () => State
    getState2: () => State
  }

  const store = createStore<State>((_, get) => ({
    value: 1,
    getState1: () => get(),
    getState2: (): State => store.getState(),
  }))

  expect(store.getState().getState1().value).toBe(1)
  expect(store.getState().getState2().value).toBe(1)
})

it('can set the store', async () => {
  type State = {
    value: number
    setState1: StoreApi<State>['setState']
    setState2: StoreApi<State>['setState']
  }

  const store = createStore<State>((set) => ({
    value: 1,
    setState1: (v) => set(v),
    setState2: (v): void => store.setState(v),
  }))

  store.getState().setState1({ value: 2 })
  expect(store.getState().value).toBe(2)
  store.getState().setState2({ value: 3 })
  expect(store.getState().value).toBe(3)
})

it('both NaN should not update', () => {
  const store = createStore<number>(() => NaN)
  const fn = vi.fn()

  store.subscribe(fn)
  store.setState(NaN)

  expect(fn).not.toBeCalled()
})

it('can set the store without merging', () => {
  const { setState, getState } = createStore<{ a: number } | { b: number }>(
    (_set) => ({
      a: 1,
    })
  )

  // Should override the state instead of merging.
  setState({ b: 2 }, true)

  expect(getState()).toEqual({ b: 2 })
})

it('works with non-object state', () => {
  const store = createStore<number>(() => 1)
  const inc = () => store.setState((c) => c + 1)

  inc()

  expect(store.getState()).toBe(2)
})

it('can destroy the store', () => {
  const { destroy, getState, setState, subscribe } = createStore(() => ({
    value: 1,
  }))

  subscribe(() => {
    throw new Error('did not clear listener on destroy')
  })
  destroy()

  setState({ value: 2 })
  expect(getState().value).toEqual(2)
})

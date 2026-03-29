'use client'

import { useState } from 'react'

/**
 * Sets a value and automatically reverts it after a delay.
 *
 * @param {*} initialValue - The initial (and revert-to) value
 * @param {number} delay - Milliseconds before reverting
 * @returns {[*, function]} - Current value and setter
 */
export default function useAutoRevert(initialValue, delay) {
  const [value, setValueRaw] = useState(initialValue)

  function setValue(newValue) {
    setValueRaw(newValue)
    setTimeout(() => setValueRaw(initialValue), delay)
  }

  return [value, setValue]
}

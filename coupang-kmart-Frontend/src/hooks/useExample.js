import { useState } from 'react'

export default function useExample(initial = 0){
  const [value, setValue] = useState(initial)
  return [value, setValue]
}

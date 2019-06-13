import { useState, useEffect } from 'react'
import spinners from 'cli-spinners'

export default ({ type = 'dots' }: { type?: string } = {}) => {
  const spinner = spinners[type]
  const [ frame, setFrame ] = useState(0)

  useEffect(() => {
    const timer =
      setInterval(() =>
        setFrame(
          frame === spinner.frames.length - 1
            ? 0
            : frame + 1),
        spinner.interval)
    return () => clearInterval(timer)
  }, [])

  return spinner.frames[frame]
}

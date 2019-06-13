import { render } from 'ink'
import React from 'react'
import Reporter from './reporter.tsx'

export default subject =>
  render(<Reporter subject={subject}/>)

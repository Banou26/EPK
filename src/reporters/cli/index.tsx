import { render, StdinContext } from 'ink'
import React from 'react'
import Reporter from './reporter.tsx'

export default subject =>
  render(
    <StdinContext.Consumer>
      {({ stdin, setRawMode }) => (
        <Reporter stdin={stdin} setRawMode={setRawMode} subject={subject}/>
      )}
    </StdinContext.Consumer>
  )

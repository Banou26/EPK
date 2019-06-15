import React from 'react'
import { Text, Box, Color } from 'ink'

import { prettifyPath } from '../../utils/file.ts'

export default ({ testFile }) =>
  <Box>
    {prettifyPath(testFile.name)}
  </Box>

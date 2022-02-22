import { from, GroupedObservable, Observable } from 'rxjs'

import React, { Fragment, useEffect, useState } from 'react'
import { Box, render, Text } from 'ink'
import { groupBy, map, mergeMap, scan, tap } from 'rxjs/operators'

const groupByFile =
	() =>
		(observable: GroupedObservable<any, any>) =>
			observable
				.pipe(
					scan(
						(events, event) =>
							event.type === 'build' && event.name === 'success'
								? [event]
								: [...events, event]
						, []
					),
					map(events => ({
						path: observable.key,
						events
					}))
				)

const Mount = ({ observable }: { observable: Observable<any> }) => {
	const [eventsPerFile, setEventsPerFile] = useState([])

	useEffect(() => {
		const unsub =
		observable
			.pipe(
				groupBy(val => val.path),
				mergeMap(groupByFile()),
				scan(
					(files, file) =>
						[
							...files.filter((_file) => _file.path !== file.path),
							file
						]
					, []
				)
			)
			.subscribe(events => {
				setEventsPerFile(events)
			})
		return unsub
	}, [])

	return (
		<>
			{
				eventsPerFile
					.map(({ path, events }) =>
						<Fragment key={`${path}`}>
							<Text>{path}</Text>
							<Box flexDirection="column" paddingLeft={2}>
								<Box flexDirection="column">
									{
										events
											.filter(event => event.type === 'log')
											.map(({ error, warn, info, log }, i) =>
												<Fragment key={i}>
													{
														error ? <Text><Text color="redBright">err</Text>{error}</Text> :
														warn ? <Text><Text color="yellowBright">wrn</Text>{warn}</Text> :
														info ? <Text><Text color="cyanBright">inf</Text>{info}</Text> :
														log ? <Text><Text color="whiteBright">log</Text>{log}</Text> :
														null
													}
												</Fragment>
											)
									}
								</Box>
								<Box flexDirection="column">
									{
										events
											.filter(event => event.type === 'runs')
											.map(({ testsRuns }, i) =>
												<Fragment key={i}>
													{
														testsRuns
															.filter(({ status }) => status === 'fail')
															.map(({ test, status, error }) =>
																<Box key={test.name} flexDirection="column" paddingLeft={2}>
																	<Text color="redBright">
																		{test.name}
																	</Text>
																	<Box flexDirection="column" paddingLeft={2}>
																		<Text color="redBright">{error.stack}</Text>
																	</Box>
																</Box>
															)
													}
												</Fragment>
											)
									}
								</Box>
							</Box>
						</Fragment>
					)
			}
		</>
	)
}

export default () =>
	(observable: Observable<any>) => {
		render(<Mount observable={observable}/>)
		return observable
	}

import type { Observable } from 'rxjs'

import { useEffect, useState } from 'react'
import { render, Text } from 'ink'
import { scan } from 'rxjs/operators'

const Mount = ({ observable }: { observable: Observable<any> }) => {
	const [events, setEvents] = useState([])

	useEffect(() => {
		const unsub =
		observable.pipe(scan((events, event) => [...events, event], [])).subscribe(events => {
			setEvents(events)
		})
		return unsub
	}, [])

	return (
		<>
			<Text>events: {events.length }</Text>
			{
				events
					.filter(event => event.type === 'log')
					.map(({ error, warn, info, log }) =>
						error ? <Text color="red">{error}</Text> :
						warn ? <Text color="yellow">{warn}</Text> :
						info ? <Text color="blue">{info}</Text> :
						log ? <Text color="gray">{log}</Text> :
						null
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

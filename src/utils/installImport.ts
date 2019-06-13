import set from 'core-js/features/set'

import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { spawn } from 'child_process'
import { builtinModules } from 'module'

import { Observable, Subject, from } from 'rxjs'
import { shareReplay, filter, bufferTime, mergeMap, skip, switchMap, take } from 'rxjs/operators'
// import rxjs from 'rxjs'
// import rxjsOperators from 'rxjs/operators'

import { cwd, access } from './file.ts'
import { installImportOptions } from '../types.ts'

// const { Observable, Subject, from } = rxjs
// const { shareReplay, filter, bufferTime, mergeMap, skip } = rxjsOperators

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

export const getClosestPackageJSONDirPath =
	(_path: string = undefined, _cwd: string = cwd) =>
		access('package.json', _path || _cwd)
			.then(access => {
				if (access) return _path || _cwd
				const parentPath = path.resolve('..', _path)
				return parentPath === _cwd
					? undefined
					: getClosestPackageJSONDirPath(parentPath)
			})

/**
 * 
 * @param path Package.json path
 * @returns Promise of a dependency and devDependency Set tuple
 */
export const getDependencies =
	(path: string): Promise<[Set<string>, Set<string>]> =>
		readFile(path, 'utf8')
			.then(
				data => data,
				err => // If package.json doesn't exist, create an empty one
					err.code === 'ENOENT' &&
					writeFile(path, '{}')
						.then(() => '{}'))
			.then(data =>
				JSON.parse(data))
			.then(({ dependencies, devDependencies }) => [
					new Set<string>([...builtinModules, ...Object.keys(dependencies)]),
					new Set<string>([...builtinModules, ...Object.keys(devDependencies)])
				])

// const installPackages = (dependencies: string[], { path, dev, yarn }: { path: string, dev: boolean, yarn: boolean }) =>
// 	Observable.create(observer => {
// 		const child = spawn(
// 			yarn ? 'yarn' : 'npm',
// 			[
// 				yarn ? 'add' : 'install',
// 				...dependencies.map(name =>
// 						name
// 							.split('/')
// 							.shift()),
// 				...dev && [yarn ? '-D': '--save-dev']
// 			],
// 			{
// 				cwd: path,
// 				stdio: 'inherit', // needed to get the colors and stream writes
// 				shell: process.platform === 'win32' // needed for windows
// 			})
// 		// If stdio is inherit, comment the data listeners
// 		// child.stdout.on('data', data => observer.next(data.toString('utf8')))
// 		// child.stderr.on('data', data => observer.error(data.toString('utf8')))
// 		child.on('close', () => observer.complete())
// 		return () => child.kill()
// 	})
// console.log(spawn('yarn -v'))
const installPackages = (dependencies: string[], { path, dev, yarn }: { path: string, dev: boolean, yarn: boolean }) =>
	new Promise(resolve => {
		const child = spawn(
			yarn ? 'yarn' : 'npm',
			[
				yarn ? 'add' : 'install',
				...dependencies.map(name =>
						name
							.split('/')
							.shift()),
				...dev ? [yarn ? '-D': '--save-dev'] : []
			],
			{
				cwd: path,
				stdio: 'inherit', // needed to get the colors and stream writes
				shell: process.platform === 'win32' // needed for windows
			}
			)
		// If stdio is inherit, comment the data listeners
		// child.stdout.on('data', data => observer.next(data.toString('utf8')))
		// child.stderr.on('data', data => observer.error(data.toString('utf8')))
		child.on('close', () => resolve())
	})

const importModules =
	(names: string[]) =>
		Promise
			.all(
				names.map(name =>
					import(name)))

const packageObservable = async (path: string): Promise<Function> => {
	const packagePath = await getClosestPackageJSONDirPath(path)
	const yarn = await access('yarn.lock', packagePath)
	const [ dependencies, devDependencies ] = await getDependencies(`${path}/package.json`)
	// const [ seenDep, seenDevDep ] = [new Set(), new Set()]
	const [ queuedDeps, queuedDevDeps ] = [new Set<string>(), new Set<string>()]
	let pending: Promise<string[]> = Promise.resolve([])

	const run = async (modules: string[], dev: boolean) => {
		const deps = dev ? devDependencies : dependencies
		const qDeps = dev ? queuedDevDeps : queuedDeps

		for (const name of modules) qDeps.add(name)

		const allCurrentModules = [...devDependencies, ...dependencies]
		if (!modules.some(name => !allCurrentModules.includes(name))) return importModules(modules)

		try {
			await pending
		} finally {
			const names = Array.from(qDeps)
			await installPackages(names, { path, dev, yarn })

			for (const name of names) deps.add(name)
			for (const name of names) qDeps.delete(name)

      return importModules(modules)
		}
	}
	

	return (modules: string[], dev: boolean = false) => (pending = run(modules, dev))

	const [ depQueue, devDepQueue ] =
		[new Subject(), new Subject()]
			.map((subject, dev) =>
				// @ts-ignore
				subject
				// @ts-ignore
				|> filter((names: string[]) => {
					const seenDeps = dev ? seenDevDep : seenDep
					try {
						return Array.from(
							seenDeps
								.difference(names))
								.flat(Infinity)
					} finally {
						for (const name of names) seenDeps.add(name)
					}
				})
				// @ts-ignore
				|> bufferTime(50)
				// @ts-ignore
				|> filter(arr => arr.length))

	const [ depUpdate, devDepUpdate ] =
		[depQueue, devDepQueue]
			.map((obs, dev) =>
				// @ts-ignore
				obs
				// @ts-ignore
				|> mergeMap(async (names: string[]) => {
					const deps = dev ? devDependencies : dependencies

					await installPackages(names, { path, dev, yarn }).toPromise()

					for (const name of names) deps.add(name)

					return from(names)
				})
				// @ts-ignore
				|> shareReplay())

	// @ts-ignore
	depUpdate.subscribe()
	// @ts-ignore
	devDepUpdate.subscribe()

	return (modules, dev) =>
		new Promise((resolve, reject) => {
			if (typeof modules === 'string') modules = [modules]
			const deps = dev ? devDependencies : dependencies
			const queue = dev ? devDepQueue : depQueue
			const depsUpdate = dev ? devDepUpdate : depUpdate

			const missingDeps =
				new Set(
					modules.map(name =>
						name
							.split('/')
							.shift()))
							.difference(deps)
			
			if (missingDeps.size) {
				const obs =
					depsUpdate
					// @ts-ignore
					|> switchMap(obs => obs)
					// @ts-ignore
					|> filter(name => missingDeps.has(name))
					// @ts-ignore
					|> skip(missingDeps.size - 1)
					// @ts-ignore
					|> take(1)

				// @ts-ignore
				obs.subscribe(() => resolve(importModules(modules)))
				
				// @ts-ignore
				for (const name of missingDeps) queue.next(name)

			} else {
				resolve(importModules(modules))
			}
		})
}

const packages = new Map<string, Function>()

const getPackage = async (path: string) =>
	packages.has(path)
		? packages.get(path)
		: packages
			.set(path, await packageObservable(path))
			.get(path)

export default async (names: string | string[], options?: installImportOptions) =>
	getPackage(options?.path || await getClosestPackageJSONDirPath())
		.then(getPackage =>
			getPackage(Array.isArray(names) ? names : [names], options?.dev))
		.then(packages =>
			Array.isArray(names)
				? packages
				: packages[0])

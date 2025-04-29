import type {Context} from "#~src/Context.mts"
import {spawn} from "../spawn.mts"
import {copy} from "@aniojs/node-fs"
import path from "node:path"
// @ts-ignore:next-line
import runPromisesInParallel from "@anio-js-foundation/run-promises-in-parallel"

export async function installNPMPackages(
	context: Context
) {
	const installQueue: ((...args: any[]) => any)[] = []

	for (const [key, value] of context.toolchains.entries()) {
		for (const version of value.versions) {
			const cwd = path.join(context.workDir, key, `v${version}`)

			installQueue.push(async () => {
				process.stderr.write(`installing ${key}@${version}\n`)

				const {code, stderr} = await spawn("npm", [
					"install"
				], cwd)

				if (code !== 0) {
					throw new Error(
						`failed to install npm package.\n${stderr}`
					)
				}

				await copy(
					path.join(
						cwd,
						"node_modules",
						"@enkore-toolchain-types",
						key,
						"dist",
						"default",
						"index.d.mts"
					),
					path.join(
						context.workDir,
						"declarationFiles",
						`${key}_v${version}.d.mts`
					)
				)

				return "ok"
			})
		}
	}

	let results = await runPromisesInParallel(installQueue, 5)

	for (let [_, result] of results) {
		if (result !== "ok") {
			console.log(result)

			throw new Error(`Failed to install some packages.`)
		}
	}
}

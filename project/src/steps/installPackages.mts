import type {Context} from "#~src/Context.mts"
import path from "node:path"
import {executeNPMCommand} from "../executeNPMCommand.mts"
import {copy} from "@aniojs/node-fs"
// @ts-ignore:next-line
import runPromisesInParallel from "@anio-js-foundation/run-promises-in-parallel"

type AnyFn = (...args: any[]) => any

export async function installPackages(context: Context) {
	const jobQueue: AnyFn[] = []

	for (const [toolchain, {versions}] of context.toolchains.entries()) {
		for (const version of versions) {
			const packageName = `@asint-types/enkore__target-${toolchain}-toolchain`

			jobQueue.push(async () => {
				const cwd = path.join(
					context.workDir, "toolchains", toolchain, `v${version}`
				)

				process.stderr.write(`installing ${packageName}@${version}\n`)

				const {code, stderr} = await executeNPMCommand({
					secretsDir: context.secretsDir,
					cwd
				}, ["install"])

				if (code !== 0) {
					throw new Error(
						`failed to install npm package.\n${stderr}`
					)
				}

				await copy(
					path.join(
						cwd,
						"node_modules",
						packageName,
						"dist",
						"default",
						"index.d.mts"
					),
					path.join(
						context.workDir,
						"declarationFiles",
						`${toolchain}_v${version}.d.mts`
					)
				)

				return "ok"
			})
		}
	}

	const results = await runPromisesInParallel(jobQueue, 5)

	for (const [_, result] of results) {
		if (result !== "ok") {
			console.log(result)

			throw new Error(`Failed to install some packages.`)
		}
	}
}

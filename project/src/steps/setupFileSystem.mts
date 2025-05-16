import type {Context} from "#~src/Context.mts"
import {mkdirp, writeAtomicFileJSON} from "@aniojs/node-fs"
import path from "node:path"

export async function setupFileSystem(context: Context) {
	for (const [toolchain, {versions}] of context.toolchains.entries()) {
		for (const version of versions) {
			const base = path.join("toolchains", toolchain, `v${version}`)

			await mkdirp(base)

			await writeAtomicFileJSON(
				path.join(base, "package.json"), {
					name: "toolchain",
					type: "module",
					version: "0.0.0",
					private: true,
					dependencies: {
						[`@asint-types/enkore__target-${toolchain}-toolchain`]: `=${version}`
					}
				},
				{
					pretty: true
				}
			)
		}
	}
}

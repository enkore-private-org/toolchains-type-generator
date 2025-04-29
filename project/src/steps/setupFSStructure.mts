import type {Context} from "#~src/Context.mts"
import path from "node:path"
import {mkdirp, writeAtomicFileJSON} from "@aniojs/node-fs"

export async function setupFSStructure(context: Context) {
	for (const [key, value] of context.toolchains.entries()) {
		for (const version of value.versions) {
			const dir = path.join(key, `v${version}`)

			await mkdirp(dir)

			await writeAtomicFileJSON(
				path.join(dir, "package.json"), {
					name: "toolchain",
					private: true,
					version: "0.0.0",
					dependencies: {
						[`@enkore-toolchain-types/${key}`]: `=${version}`
					}
				}, {
					pretty: true
				}
			)
		}
	}
}

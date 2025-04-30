import type {Context} from "#~src/Context.mts"
import path from "node:path"
import {spawn} from "#~src/spawn.mts"
import {writeAtomicFileJSON} from "@aniojs/node-fs"

export async function downloadLatestPublishedPackage(
	context: Context
) {
	const cwd = path.join(context.workDir, "latestPublishedPackage")

	await writeAtomicFileJSON(path.join(cwd, "package.json"), {
		name: "latestPublishedPackage",
		version: "0.0.0",
		private: true,
		dependencies: {
			[`@enkore-types/toolchains`]: `=0.0.${context.latestPublishedRevision}`
		}
	}, {pretty: true})

	const {code, stderr} = await spawn("npm", [
		"install"
	], cwd)

	if (code !== 0) {
		throw new Error(
			`failed to install npm package.\n${stderr}`
		)
	}

	const {contents} = await import(
		path.join(
			cwd,
			"node_modules",
			"@enkore-types",
			"toolchains",
			"contents.mjs"
		)
	)

	for (const toolchain in contents) {
		const {versions} = contents[toolchain]

		context.latestPublishedRevisionContents.set(
			toolchain, {
				versions
			}
		)
	}
}

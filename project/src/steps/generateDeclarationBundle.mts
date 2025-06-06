import type {Context} from "#~src/Context.mts"
import {calculateRevisionFromVersion} from "#~src/calculateRevisionFromVersion.mts"
import {writeAtomicFile} from "@aniojs/node-fs"
import {tsDeclarationBundler} from "@enkore-private/target-js-rollup"
import path from "node:path"

function codeFriendlyIdentifier(id: string): string {
	return id
		.split("@").join("")
		.split("/").join("")
		.split("-").join("")
		.toUpperCase()
}

export async function generateDeclarationBundle(context: Context) {
	let dtsImportCode = ``, dtsCode = ``
	const typeAliases: string[] = []
	const toolchainTuples: string[] = []

	for (const [toolchain, {versions}] of context.toolchains.entries()) {
		const packageName = `@asint-types/enkore__target-${toolchain}-toolchain`
		const id = codeFriendlyIdentifier(packageName)

		for (const version of versions) {
			const rev = calculateRevisionFromVersion(version)

			dtsImportCode += `import {`
			dtsImportCode += `__ModuleExport as ${id}_R${rev}_RAW`
			dtsImportCode += `} from "./declarationFiles/${toolchain}_v${version}.d.mts"\n`

			dtsCode += `type ${id}_R${rev} = ${id}_R${rev}_RAW & {\n`
			dtsCode += `    toolchainID: "${toolchain}"\n`
			dtsCode += `    toolchainRev: ${rev}\n`
			dtsCode += `}\n`

			typeAliases.push(`${id}_R${rev}`)

			toolchainTuples.push(
				`["${toolchain}", ${rev}]`
			)
		}
	}

	dtsCode += `export type Toolchains = ${typeAliases.join(" | ")};\n`
	dtsCode += `export type ToolchainIDs = Toolchains["toolchainID"]\n`
	dtsCode += `export type ToolchainByID<ID extends ToolchainIDs> = Extract<Toolchains, {\n`
	dtsCode += `    toolchainID: ID\n`
	dtsCode += `}>\n`

	dtsCode += `export type ValidToolchainCombinations = ${toolchainTuples.join(" | ")};\n`

	const entryCode = dtsImportCode + dtsCode

	const bundle = await tsDeclarationBundler(
		context.workDir, entryCode
	)

	await writeAtomicFile(
		path.join(context.workDir, "newPackage", "index.d.mts"), bundle
	)
}

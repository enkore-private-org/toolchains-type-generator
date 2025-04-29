import type {Context} from "#~src/Context.mts"
import {writeAtomicFile} from "@aniojs/node-fs"
import {calculateRevisionFromVersion} from "../calculateRevisionFromVersion.mts"
import {tsDeclarationBundler} from "@enkore-private/target-js-rollup"

function codeFriendlyIdentifier(id: string): string {
	return id.split("-").join("").toUpperCase()
}

export async function generateDTSFile(
	context: Context
) {
	let dtsFileImports = ``, dtsTypeCode = ``
	const typeAliases: string[] = []

	for (const [key, value] of context.toolchains.entries()) {
		const id = codeFriendlyIdentifier(key)

		for (const version of value.versions) {
			const rev = calculateRevisionFromVersion(version)

			dtsFileImports += `import {__ModuleExport as ${id}_R${rev}_RAW} `
			dtsFileImports += `from "./declarationFiles/${key}_v${version}.d.mts"\n`

			dtsTypeCode += `type ${id}_R${rev} = ${id}_R${rev}_RAW & {`
			dtsTypeCode += `toolchainID: "${key}", toolchainRev: ${rev}`
			dtsTypeCode += `}\n`

			typeAliases.push(`${id}_R${rev}`)
		}
	}

	dtsTypeCode += `export type Toolchains = ${typeAliases.join(" | ")};\n`

	dtsTypeCode += `
export type ToolchainIDs = Toolchains["toolchainID"]
export type ToolchainByID<ID extends ToolchainIDs> = Extract<Toolchains, {
	toolchainID: ID
}>
`

	const dtsCode = dtsFileImports + dtsTypeCode

	const bundle = await tsDeclarationBundler(
		context.workDir, dtsCode
	)

	await writeAtomicFile("package/index.d.mts", bundle)
}

import {tmpdir, remove, writeAtomicFileJSON} from "@aniojs/node-fs"
import constants from "#~src/constants.mts"
import {getVersionsOfNPMPackage} from "#~src/getVersionsOfNPMPackage.mts"
import {calculateRevisionFromVersion} from "#~src/calculateRevisionFromVersion.mts"
import type {Context} from "#~src/Context.mts"
import {mkdirp} from "@aniojs/node-fs"
import {setupFSStructure} from "#~src/steps/setupFSStructure.mts"
import {installNPMPackages} from "#~src/steps/installNPMPackages.mts"
import {generateDTSFile} from "#~src/steps/generateDTSFile.mts"
import {getLatestPublishedPackageRevisionNumber} from "#~src/getLatestPublishedPackageRevisionNumber.mts"
import {spawn} from "#~src/spawn.mts"
import path from "node:path"

export async function main() {
	const workDir = await tmpdir()

	let context: Context = {
		workDir,
		toolchains: new Map()
	}

	const savedCWD = process.cwd()

	try {
		process.chdir(workDir)

		await mkdirp("declarationFiles")
		await mkdirp("package")
		await mkdirp("tsconfig")
		await writeAtomicFileJSON("tsconfig/base.json", {
			compilerOptions: {}
		})

		for (const id of constants.toolchainIds) {
			const versionsToUse: string[] = []

			await mkdirp(id)

			process.stderr.write(`getting versions for ${id}:\n`)

			const versions = await getVersionsOfNPMPackage(
				`@enkore-toolchain/${id}`
			)

			for (const version of versions) {
				process.stderr.write(`    v${version}\n`)

				const revision = calculateRevisionFromVersion(version)

				if (revision >= constants.startingRevisionNumber) {
					versionsToUse.push(version)
				}
			}

			context.toolchains.set(id, {
				newestRevision: Math.max.apply(
					null, versionsToUse.map(calculateRevisionFromVersion)
				),
				versions: versionsToUse
			})
		}

		const highestRevisionOverall = Math.max.apply(
			null, [
				...context.toolchains.entries()
			].map(([k, v]) => v.newestRevision)
		)

		for (const [key, {newestRevision}] of context.toolchains.entries()) {
			if (newestRevision !== highestRevisionOverall) {
				throw new Error(
					`all toolchain type packages must have the same highest version number: ` +
					`highestRevisionOverall: ${highestRevisionOverall}, newestRevision: ${newestRevision}.`
				)
			}
		}

		await setupFSStructure(context)
		await installNPMPackages(context)
		await generateDTSFile(context)

		const currentVersionNumber = await getLatestPublishedPackageRevisionNumber()
		const nextVersionNumber = currentVersionNumber + 1

		await writeAtomicFileJSON("package/package.json", {
			name: "@enkore-toolchain-types/toolchains",
			version: `0.0.${nextVersionNumber}`,
			type: "module",
			exports: {
				".": {
					"types": "./index.d.mts"
				}
			},
			files: ["./index.d.mts"]
		}, {
			pretty: true
		})

		const {code, stderr} = await spawn("npm", [
			"publish",
			"--access",
			"public"
		], path.join(workDir, "package"))

		if (code !== 0) {
			throw new Error(`failed to publish package: ${stderr}`)
		}
	} finally {
		process.chdir(savedCWD)

		await remove(workDir)
	}
}

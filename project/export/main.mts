import {resolvePathSync, tmpdir, mkdirp, remove, writeAtomicFileJSON, writeAtomicFile} from "@aniojs/node-fs"
import type {Context} from "#~src/Context.mts"
import constants from "#~src/constants.mts"
import {getLatestPublishedPackageRevisionNumber} from "#~src/getLatestPublishedPackageRevisionNumber.mts"
import {getVersionsOfNPMPackage} from "#~src/getVersionsOfNPMPackage.mts"
import {calculateRevisionFromVersion} from "#~src/calculateRevisionFromVersion.mts"
import {setupFileSystem} from "#~src/steps/setupFileSystem.mts"
import {installPackages} from "#~src/steps/installPackages.mts"
import {downloadLatestPublishedPackage} from "#~src/steps/downloadLatestPublishedPackage.mts"
import {generateDeclarationBundle} from "#~src/steps/generateDeclarationBundle.mts"
import path from "node:path"
import {convertToInternalPackageName} from "#~src/convertToInternalPackageName.mts"
import {executeNPMCommand} from "#~src/executeNPMCommand.mts"

async function checkIfNeedsUpdate(context: Context) {
	let needsUpdate = false

	const copy = globalThis.structuredClone(context.toolchains)

	for (const [toolchain, {versions}] of copy.entries()) {
		for (const version of versions) {
			if (!context.latestPublishedRevisionContents.has(toolchain)) {
				process.stderr.write(
					`needs update because of a new toolchain '${toolchain}'\n`
				)

				needsUpdate = true

				break
			}

			const alreadyPublishedVersions = context.latestPublishedRevisionContents.get(toolchain)!.versions

			if (!alreadyPublishedVersions.includes(version)) {
				process.stderr.write(
					`needs update because of a new toolchain version '${toolchain}@${version}'\n`
				)

				needsUpdate = true

				break
			}
		}
	}

	return needsUpdate
}

export async function main() {
	const workDir = await tmpdir()
	const savedCWD = process.cwd()

	// secrets are assumed to be at the cwd
	const secretsDir = resolvePathSync(
		path.join(
			savedCWD, "secrets"
		), ["regularDir"]
	)

	const latestPublishedRevision = await getLatestPublishedPackageRevisionNumber(
		secretsDir
	)

	const context: Context = {
		secretsDir,
		workDir,
		toolchains: new Map(),
		latestPublishedRevision,
		latestPublishedRevisionContents: new Map()
	}

	try {
		process.chdir(workDir)

		await mkdirp("latestPublishedPackage")
		await mkdirp("toolchains")
		await mkdirp("declarationFiles")
		await mkdirp("tsconfig")
		await mkdirp("newPackage")

		await writeAtomicFileJSON("tsconfig/base.json", {
			compilerOptions: {}
		})

		for (const toolchain of constants.toolchains) {
			const applicableVersions: string[] = []
			const versions = await getVersionsOfNPMPackage(
				context.secretsDir, convertToInternalPackageName(toolchain)
			)

			for (const version of versions) {
				const asRevision = calculateRevisionFromVersion(version)

				if (asRevision >= constants.startingRevisionNumber) {
					applicableVersions.push(version)
				}
			}

			context.toolchains.set(toolchain, {versions: applicableVersions})
		}

		await downloadLatestPublishedPackage(context)

		const shouldSkipRelease = !(await checkIfNeedsUpdate(context))

		if (shouldSkipRelease && constants.forceNewRelease !== true) {
			process.stderr.write(`nothing to do, exiting early... \n`)

			return
		}

		await setupFileSystem(context)
		await installPackages(context)
		await generateDeclarationBundle(context)

		const newContents: Record<string, {
			versions: string[]
		}> = {}

		for (const [toolchain, {versions}] of context.toolchains.entries()) {
			newContents[toolchain] = {versions}
		}

		await writeAtomicFile(
			path.join(context.workDir, "newPackage", "contents.mjs"),
			`export const contents = ${JSON.stringify(newContents, null, 4)};\n`
		)

		const newRevision = context.latestPublishedRevision + 1

		await writeAtomicFileJSON(
			path.join(context.workDir, "newPackage", "package.json"), {
				name: convertToInternalPackageName("@enkore-types/toolchains"),
				version: `0.0.${newRevision + constants.newRevisionOffset}`,
				type: "module",
				exports: {
					".": {
						"types": "./index.d.mts"
					},
					"./contents": {
						"default": "./contents.mjs"
					}
				},
				files: ["./index.d.mts", "./contents.mjs"]
			}, {pretty: true}
		)

		const {code, stderr} = await executeNPMCommand({
			secretsDir: context.secretsDir,
			token: {
				anioNPMRegistryToken: "tbd",
				npmRegistryToken: "tbd"
			},
			cwd: path.join(workDir, "newPackage")
		}, ["publish", "--access", "public"])

		if (code !== 0) {
			throw new Error(`failed to publish package: ${stderr}`)
		}
	} finally {
		process.chdir(savedCWD)
		await remove(workDir)
	}
}

await main()

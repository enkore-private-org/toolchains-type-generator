import {spawn} from "./spawn.mts"

export async function getVersionsOfNPMPackage(
	packageName: string
): Promise<string[]> {
	const result = await spawn("npm", [
		"view",
		packageName,
		"versions",
		"--json"
	], process.cwd())

	if (result.code !== 0) {
		throw new Error(
			`cannot get versions for npm package '${packageName}'.`
		)
	}

	try {
		return JSON.parse(result.stdout)
	} catch {
		throw new Error(
			`cannot get versions for npm package '${packageName}': failed to parse JSON.`
		)
	}
}

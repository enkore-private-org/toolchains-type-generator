import {executeNPMCommand} from "./executeNPMCommand.mts"

export async function getVersionsOfNPMPackage(
	secretsDir: string,
	packageName: string
): Promise<string[]> {
	const result = await executeNPMCommand({
		secretsDir
	}, [
		"view",
		packageName,
		"versions",
		"--json"
	])

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

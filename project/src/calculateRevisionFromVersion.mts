export function calculateRevisionFromVersion(version: string): number {
	const [major, minor, patch] = version.split(".").map(part => {
		return parseInt(part, 10)
	})

	let revision = patch

	revision += (minor * 1000)
	revision += (major * 1000000)

	return revision
}

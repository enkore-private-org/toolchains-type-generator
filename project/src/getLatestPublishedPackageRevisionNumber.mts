import {getVersionsOfNPMPackage} from "./getVersionsOfNPMPackage.mts"
import {calculateRevisionFromVersion} from "./calculateRevisionFromVersion.mts"

export async function getLatestPublishedPackageRevisionNumber() {
	const versions = await getVersionsOfNPMPackage(
		"@enkore-types/toolchains"
	)

	versions.sort((a, b) => {
		return calculateRevisionFromVersion(b) - calculateRevisionFromVersion(a)
	})

	return calculateRevisionFromVersion(versions[0])
}

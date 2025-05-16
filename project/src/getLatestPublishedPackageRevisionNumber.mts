import {getVersionsOfNPMPackage} from "./getVersionsOfNPMPackage.mts"
import {calculateRevisionFromVersion} from "./calculateRevisionFromVersion.mts"

export async function getLatestPublishedPackageRevisionNumber(
	secretsDir: string
) {
	const versions = await getVersionsOfNPMPackage(
		secretsDir, "@asint-types/enkore__toolchains"
	)

	versions.sort((a, b) => {
		return calculateRevisionFromVersion(b) - calculateRevisionFromVersion(a)
	})

	return calculateRevisionFromVersion(versions[0])
}

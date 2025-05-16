import {getVersionsOfNPMPackage} from "./getVersionsOfNPMPackage.mts"
import {calculateRevisionFromVersion} from "./calculateRevisionFromVersion.mts"
import {convertToInternalPackageName} from "./convertToInternalPackageName.mts"

export async function getLatestPublishedPackageRevisionNumber(
	secretsDir: string
) {
	const versions = await getVersionsOfNPMPackage(
		secretsDir, convertToInternalPackageName("@enkore-types/toolchains")
	)

	versions.sort((a, b) => {
		return calculateRevisionFromVersion(b) - calculateRevisionFromVersion(a)
	})

	return calculateRevisionFromVersion(versions[0])
}

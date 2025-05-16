export function convertToInternalPackageName(input: string) {
	const tmp = input.split("/")

	if (tmp.length === 1) {
		return `@asint/${tmp}`
	}

	const orgName = tmp[0].slice(1)
	const packageName = tmp[1]

	if (orgName.endsWith("-types")) {
		const cleanOrgName = orgName.slice(0, orgName.length - 6)

		return `@asint-types/${cleanOrgName}__${packageName}`
	}

	return `@asint/${orgName}__${packageName}`
}

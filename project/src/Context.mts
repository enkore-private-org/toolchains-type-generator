export type Context = {
	secretsDir: string
	workDir: string
	latestPublishedRevision: number
	latestPublishedRevisionContents: Map<string, {
		versions: string[]
	}>
	toolchains: Map<string, {
		versions: string[]
	}>
}

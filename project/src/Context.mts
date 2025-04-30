export type Context = {
	workDir: string
	latestPublishedRevision: number
	latestPublishedRevisionContents: Map<string, {
		versions: string[]
	}>
	toolchains: Map<string, {
		versions: string[]
	}>
}

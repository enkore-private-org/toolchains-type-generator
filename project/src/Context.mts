export type Context = {
	workDir: string
	toolchains: Map<string, {
		newestRevision: number
		versions: string[]
	}>
}

import {spawn as nativeSpawn} from "node:child_process"

export function spawn(
	cmd: string,
	args: string[],
	cwd?: string
): Promise<{code: number, stdout: string, stderr: string}> {
	return new Promise((resolve, reject) => {
		const child = nativeSpawn(cmd, args, {
			cwd: cwd === undefined ? process.cwd() : cwd
		})

		let stdout = "", stderr = ""

		child.stdout.on("data", d => {
			stdout += `${d.toString()}`
		})

		child.stderr.on("data", d => {
			stderr += `${d.toString()}`
		})

		child.on("error", reject)
		child.on("exit", (code) => {
			if (code === null) {
				code = 1
			}

			resolve({code, stdout, stderr})
		})
	})
}

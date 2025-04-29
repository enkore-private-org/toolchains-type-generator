import {
	createConfig,
	createTargetJSNodeOptions
} from "enkore/spec/factory"

export const config: unknown = createConfig({
	target: {
		name: "js-node",
		options: createTargetJSNodeOptions({
			externalPackages: [
				"@enkore-private/target-js-rollup"
			]
		})
	}
})

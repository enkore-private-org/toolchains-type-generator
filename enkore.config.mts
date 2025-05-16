import {
	createConfig,
	createTargetJSNodeOptions
} from "enkore/spec/factory"

export const config: unknown = createConfig({
	target: {
		name: "js-node",
		options: createTargetJSNodeOptions({
			npm: {
				registry: [{
					url: "https://registry.npmjs.org/",
					authTokenFilePath: "./secrets/npm_auth_token"
				}, {
					url: "https://npm-registry.anio.software/",
					scope: ["@asint", "@asint-types"],
					clientPrivateKeyFilePath: "./secrets/npm_client.pkey",
					clientCertificateFilePath: "./secrets/npm_client.cert",
					authTokenFilePath: "./secrets/anio_npm_auth_token"
				}]
			},
			externalPackages: [
				"@enkore-private/target-js-rollup"
			]
		})
	}
})

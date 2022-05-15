/**
 * Create and export configuration variables
 *
 */

// Container for all the environments
var environments = {};

// Staging environment (default)
environments.staging = {
	httpPort: 3000,
	httpsPort: 3001,
	envName: "staging",
	hashingSecret: "secret",
	maxChecks: 5,
};

//Production environment
environments.production = {
	httpPort: 5000,
	httpsPort: 5001,
	envName: "production",
	hashingSecret: "secret",
	maxChecks: 5,
};

// Determine which environment should be exported
var currentEnvironment =
	typeof process.env.NODE_ENV === "string"
		? process.env.NODE_ENV.toLowerCase()
		: "";

// Check that the current environment is a defined one,
//else default to staging environment
var environmentToExport =
	typeof environments[currentEnvironment] === "object"
		? environments[currentEnvironment]
		: environments.staging;

// Export the module
module.exports = environmentToExport;

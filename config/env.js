// environment configurations and credentials
// this is a stub file to protect credentials and secrets

const environments = {
  // Default environment (using the credentials from the PDF)
  dev: {
    email: 'dev-user@example.com',
    password: 'dev_password',
  },
  // Credentials can be added for production or other environments
  prod: {
    email: 'prod_user@example.com',
    password: 'prod_password',
  },
};

// Select the environment based on the command line flag -e ENV=xxx, defaulting to 'dev'
const selectedEnv = __ENV.ENV || 'dev';

export const credentials = environments[selectedEnv];

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Loads environment variables and initializes the Firebase Admin SDK with service account credentials.
 * 
 * @constant {admin.ServiceAccount} serviceAccount - An object containing the Firebase service account configuration, 
 * loaded from environment variables.
 * @property {string} type - The type of the service account (usually "service_account").
 * @property {string} project_id - The project ID for your Firebase project.
 * @property {string} private_key_id - The private key ID for the service account.
 * @property {string} private_key - The private key for the service account, which replaces escaped newline characters.
 * @property {string} client_email - The client email for the service account.
 * @property {string} client_id - The client ID for the service account.
 * @property {string} auth_uri - The authentication URI for the service account.
 * @property {string} token_uri - The token URI for the service account.
 * @property {string} auth_provider_x509_cert_url - The URL for the authentication provider's certificate.
 * @property {string} client_x509_cert_url - The URL for the client certificate.
 * @property {string} universe_domain - The domain for the Firebase universe (if applicable).
 * 
 * @description This script initializes the Firebase Admin SDK using the credentials specified in environment variables. 
 * It uses the dotenv package to load the environment variables from a `.env` file.
 * 
 * @returns {admin.app.App} The initialized Firebase Admin app instance.
 */
const serviceAccount = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
} as admin.ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
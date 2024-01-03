import { join } from "path";

export const staticsPath = join(__dirname, "static");
export const templatesPath = join(__dirname, "templates");

export const packageJsonValues = {
  scripts: {
    "ssl:generate": "./scripts/generate-ssl.sh",
  },
};

export const placeHolderValues = {
  httpsCertDir: "${{ CERTIFICATES_DIR }}",
  httpsCertName: "${{ CERTIFICATES_FILE }}",
  httpsKeyName: "${{ KEY_FILE }}",
  caKeyName: "${{ CA_KEY_FILE }}",
  caCertName: "${{ CA_CERT_FILE }}",
};

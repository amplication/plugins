#!/bin/bash

# Generate a self-signed certificate for the server to be used in development over HTTPS for local testing.
# !!! DO NOT USE THIS IN PRODUCTION !!!

certificates_dir="./${{ CERTIFICATES_DIR }}"
certificates_file="${{ CERTIFICATES_FILE }}"
key_file="${{ KEY_FILE }}"
ca_key_file="${{ CA_KEY_FILE }}"
ca_cert_file="${{ CA_CERT_FILE }}"

# Create the certificates directory if it doesn't exist
if [ ! -d "$certificates_dir" ]; then
  mkdir "$certificates_dir"
fi

# Generate the CA key and certificate
openssl genrsa -out "$certificates_dir/$ca_key_file" 2048
openssl req -x509 -new -nodes -key "$certificates_dir/$ca_key_file" -sha256 -days 1825 -out "$certificates_dir/$ca_cert_file" <<END
IN
Odisha
Rourkela
Amplication
Software
localhost
ca-ashish@amplication.com
END

# Generate the certificate and key files for localhost with the CA key and certificate
openssl req -new -nodes -newkey rsa:2048 -keyout "$certificates_dir/$key_file" -out "$certificates_dir/server.csr" <<END
IN
Odisha
Rourkela
Amplication
Software
localhost
ashishpadhy@amplication.com
password
Plugin
END

openssl x509 -req -sha256 -days 1825 -in "$certificates_dir/server.csr" -CA "$certificates_dir/$ca_cert_file" -CAkey "$certificates_dir/$ca_key_file" -CAcreateserial -out "$certificates_dir/$certificates_file"

# Remove the certificate signing request
rm "$certificates_dir/server.csr"

# Remove the CA serial file
# Get the CA serial file name from the CA certificate file name by replacing the extension with .srl
ca_serial_file="${ca_cert_file%.*}.srl"
rm "$certificates_dir/$ca_serial_file"
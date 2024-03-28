/**
 * Patches the NGINX configuration to use port 80.
 */
export default function patchNginx(original: string): string {
  return original.replace(/(listen\s+)(\d+)/, (_match, spaces, _number) => `${spaces}80`);
}
/**
 * Patches the NGINX configuration to use port 80.
 */
export default function patchNginx(original: string): string {
  return original.replace(/(listen\s+)(\d+)/, (match, spaces, number) => `${spaces}80`);
}
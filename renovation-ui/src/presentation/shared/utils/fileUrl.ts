import { config } from '@/config';

/** API file fields are paths such as `/files/projects/<id>/original.jpg`; prefix the API base. */
export function resolveFileUrl(path: string): string;
export function resolveFileUrl(path: string | null | undefined): string | null;
export function resolveFileUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }
  return `${config.apiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

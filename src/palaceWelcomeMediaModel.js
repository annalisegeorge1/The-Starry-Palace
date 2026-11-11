export const PALACE_IMAGE_MAX_BYTES = 6 * 1024 * 1024;
export const PALACE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const SUPPORTED = new Set(['image/jpeg','image/png','image/webp','image/gif']);
export function validatePalaceWelcomeImage(file) {
 if (!file) return 'Choose an image first.';
 if (!SUPPORTED.has(file.type)) return 'Choose a JPG, PNG, WebP or GIF image.';
 if (file.size === 0) return 'This image file is empty.';
 if (file.size > PALACE_IMAGE_MAX_BYTES) return 'Images must be 6 MB or smaller.';
 return '';
}
export function palaceWelcomeFandoms(value) {
 return [...new Set(String(value || '').split(',').map(s=>s.trim()).filter(Boolean))].slice(0,10);
}

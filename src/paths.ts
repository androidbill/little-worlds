/** Keep artwork and navigation inside the app's deployment directory. */
export const baseUrl = import.meta.env.BASE_URL;

export const assetUrl = (path: string) => baseUrl + path.replace(/^\/+/, "");

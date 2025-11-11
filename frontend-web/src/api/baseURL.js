export function baseURL(mode) {
    return mode === "production" ? "https://api.myaedojourney.xyz" : "http://localhost:3001";
}
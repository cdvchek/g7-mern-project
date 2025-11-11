export function baseURL(mode) {
    console.log(mode);
    return mode === "production" ? "https://api.myaedojourney.xyz" : "http://localhost:3001";
}
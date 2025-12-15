
/**
 * Fetch JSON from a URL
 * @param {string} url 
 * @returns {Promise<any>}
 */
export async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error("Failed to fetch JSON:", e);
        return null;
    }
}

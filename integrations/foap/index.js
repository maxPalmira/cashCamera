const Foap = require("foap");; // Make sure this path points to your Foap class implementation

// Create a function to get or create a Foap instance
let foapInstance = null;
function getFoapInstance() {
    if (!foapInstance) {
        foapInstance = new Foap();
    }
    return foapInstance;
}

async function loginToFoap(email, password) {
    try {
        const foap = getFoapInstance();
        console.log('Logging in...');
        await foap.login(email, password);
        console.log('Login successful!');
        return true;
    } catch (error) {
        console.error('Login failed:', error.message);
        throw new Error(`Login failed: ${error.message}`);
    }
}

async function uploadToFoap(pathToFile, description, tags) {
    try {
        const foap = getFoapInstance();
        // Check if file exists before upload
        const fs = require('fs');
        if (!fs.existsSync(pathToFile)) {
            throw new Error(`Image file not found: ${pathToFile}`);
        }

        console.log('Uploading image...');
        const uploadResult = await foap.upload(pathToFile, description, tags);
        console.log('Upload successful!');
        return uploadResult;
    } catch (error) {
        console.error('Upload failed:', error.message);
        throw new Error(`Upload failed: ${error.message}`);
    }
}

// Example usage:
async function main() {
    try {
        await loginToFoap("leonschaefer24@gmail.com", "CashCamera2024");
        await uploadToFoap(
            "/Users/Leon/cashCamera/integrations/foap/mein_chef.jpg",
            "Beautiful professional headshot",
            ["portrait", "professional", "business"]
        );
    } catch (error) {
        console.error('Process failed:', error.message);
    }
}

module.exports = {
    loginToFoap,
    uploadToFoap
};

// If running this file directly
if (require.main === module) {
    main().then(() => {
        console.log('Process completed');
    }).catch(error => {
        console.error('Process failed:', error);
    });
}
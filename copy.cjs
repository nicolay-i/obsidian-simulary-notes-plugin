const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const files = fs.readdirSync(distPath);

files.forEach(file => {
    fs.copyFileSync(path.join(distPath, file), path.join(__dirname, file));
});

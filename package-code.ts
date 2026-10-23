
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const zip = new AdmZip();
const publicDir = path.join(process.cwd(), 'public');
const outputFile = path.join(publicDir, 'source-code.zip');

// Ensure public dir exists
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

const rootDir = process.cwd();
const files = fs.readdirSync(rootDir);

files.forEach(file => {
    // Exclude list
    if (['node_modules', '.git', 'dist', 'public', '.DS_Store', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'].includes(file)) return;
    
    const filePath = path.join(rootDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
        zip.addLocalFolder(filePath, file);
    } else {
        zip.addLocalFile(filePath);
    }
});

zip.writeZip(outputFile);
console.log(`Created ${outputFile}`);

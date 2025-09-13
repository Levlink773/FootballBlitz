import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.resolve(__dirname, "components", "transfer", "Transfer.jsx");
const outputFile = path.resolve(__dirname, "components","transfer", "Transfer.jsx");
const imagesDir = path.resolve(__dirname, "assets");

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

let code = fs.readFileSync(inputFile, "utf-8");

let counter = 55;

code = code.replace(
    /src="data:image\/(png|jpg|jpeg|gif);base64,([^"]+)"/g,
    (match, ext, base64data) => {
        const filename = `img${counter}.${ext}`;
        const filePath = path.join(imagesDir, filename);

        fs.writeFileSync(filePath, Buffer.from(base64data, "base64"));
        console.log(`✅ Saved ${filename}`);

        counter++;
        return `src="../../assets/${filename}"`; // путь относительно main.jsx
    }
);

fs.writeFileSync(outputFile, code, "utf-8");

console.log(`🎉 Done! Updated file saved as ${outputFile}`);

import { readFile, readdir, unlink } from "fs/promises"
import { createWriteStream } from "fs";
import { createCanvas, loadImage } from "canvas"
import stripJsonComments from "strip-json-comments";

const colors = [
    { "hex": "#ff0000", "name": "red" },
    { "hex": "#11ff00ff", "name": "green" },
    { "hex": "#2200ffff", "name": "blue" },
    { "hex": "#fff200ff", "name": "yellow" },
    { "hex": "#ff9500ff", "name": "orange" },
    { "hex": "#8800ffff", "name": "purple" },
]

/**
 * 
 * @param {string} hex 
 * @returns 
 */

function hex2rgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
};

let writtenFiles = 0

/**
 * 
 * @param {string} path 
 */
async function search(path) {
    const dir = await readdir(path, { withFileTypes: true })
    for (const file of dir) {
        if (file.isDirectory()) {
            await search(`${file.parentPath}/${file.name}`)
            continue
        }
        if (!file.name.endsWith(".tint.json")) continue
        /**
        * @type {{
        *  colors?: {hex: string, name: string}[],
        *  saturation_adjustments?: {modifier?: number, start?: number, reverse?: boolean},
        * }}
        */
        let fileData = {}
        try {
            const parsedFile = await readFile(`${file.parentPath}/${file.name}`);
            fileData = JSON.parse(stripJsonComments(parsedFile.toString('utf-8')));
        } catch (e) {
            console.error(e);
        }
        await unlink(`${file.parentPath}/${file.name}`, (err) => {
            if (err) throw err
        })

        try {
            const loadedImage = await loadImage(`${file.parentPath}/${file.name.replaceAll(".tint.json", ".png")}`)
            for (const color of fileData.colors ?? colors) {
                const toRGB = hex2rgb(color.hex)
                const canvas = createCanvas(loadedImage.width, loadedImage.height)
                const ctx = canvas.getContext("2d")
                ctx.save()
                ctx.clearRect(0, 0, loadedImage.width, loadedImage.height)
                ctx.drawImage(loadedImage, 0, 0)
                const imageData = ctx.getImageData(0, 0, loadedImage.width, loadedImage.height)
                const data = imageData.data
                for (let i = 0; i < imageData.data.length; i += 4) {
                    if (data[i + 3] == 0) continue
                    const { r, g, b } = toRGB
                    if (data[i] !== data[i + 1] || data[i] !== data[i + 2]) continue
                    let percent = data[i] < ((fileData.saturation_adjustments?.start ?? 0) * 255) ? 0 : (((fileData.saturation_adjustments?.reverse ? 255 - data[i] : data[i]) - ((fileData.saturation_adjustments?.start ?? 0) * 255)) / ((255 - ((fileData.saturation_adjustments?.start ?? 0) * 255)) / (fileData.saturation_adjustments?.modifier ?? 0.5)))
                    if (!fileData.saturation_adjustments) {
                        data[i] = data[i] * (r / 255);     // Red
                        data[i + 1] = data[i + 1] * (g / 255); // Green
                        data[i + 2] = data[i + 2] * (b / 255); // Blue
                    } else {
                        data[i] = data[i] * ((r / 255) + ((1 - (r / 255)) * percent));     // Red
                        data[i + 1] = data[i + 1] * ((g / 255) + ((1 - (g / 255)) * percent)); // Green
                        data[i + 2] = data[i + 2] * ((b / 255) + ((1 - (b / 255)) * percent)); // Blue
                    }
                }
                ctx.putImageData(imageData, 0, 0)
                const newFile = createWriteStream(`${file.parentPath}/${file.name.replaceAll(".tint.json", "")}_${color.name}.png`)
                canvas.createPNGStream().pipe(newFile)
                writtenFiles++
            }
            await unlink(`${file.parentPath}/${file.name.replaceAll(".tint.json", ".png")}`, (err) => {
                if (err) throw (err)
            })
        } catch (e) { console.error(e) }
    }
}

const start = Date.now()

await search("RP/textures")

console.info(`Finished writing ${writtenFiles} files in ${Math.round(((Date.now() - start) / 1000) * 100) / 100} seconds`)
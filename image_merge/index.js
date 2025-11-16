import { readFile, readdir, unlink } from "fs/promises"
import { createWriteStream} from "fs";
import { createCanvas, Image, loadImage } from "canvas"

/**
 * 
 * @type {[id: string]: Image}
 */
const allTimeLoadedImages = {}

let writtenFiles = 0

async function search(path) {
    const dir = await readdir(path, { withFileTypes: true })
    for (const file of dir) {
        const filePath = file.parentPath
        if (file.isDirectory()) {
            await search(`${file.parentPath}/${file.name}`)
            continue
        }
        if (!file.name.endsWith(".merge.json")) continue
        /**
        * @type {{
        *  images: string[], delete?: boolean, overlay_adjustment?: {x?: number, y?: number}
        * } | {files: {images: string[], file_name: string, delete?: boolean, overlay_adjustment?: {x?: number, y?: number}}[]}}
        */
        let fileData = {}
        try {
            const parsedFile = await readFile(`${filePath}/${file.name}`);
            fileData = JSON.parse(parsedFile.toString('utf-8'));
        } catch (e) {
            console.error(e);
        }
        const fileName = file.name
        await unlink(`${filePath}/${file.name}`, (err) => {
            if (err) throw err
        })
        /**
        * @type {{images: string[], file_name: string, delete?: boolean, overlay_adjustment?: {x?: number, y?: number}}[]}}
        */
        const newFiles = fileData.images ? [{ images: fileData.images, file_name: fileName.replace(".merge.json", ""), overlay_adjustment: fileData.overlay_adjustment }] : fileData.files

        for (const newFile of newFiles) {
            try {
                /**
                 * @type {Image[]}
                 */
                const images = []
                for (const file of newFile.images) {
                    try {
                        const path = file.endsWith(".png") ? `${filePath}/${file}` : `${filePath}/${file}.png`
                        const deleted = allTimeLoadedImages[path] !== undefined
                        const loadedImage = allTimeLoadedImages[path] ?? await loadImage(path)
                        allTimeLoadedImages[path] = loadedImage
                        if (images.length > 0) {
                            if (loadedImage.width !== images[0].width || loadedImage.height !== images[0].height) {
                                throw (`${path} does not match the size of ${newFile.images[0].endsWith(".png") ? `${filePath}/${newFile.files[0]}` : `${filePath}/${newFile.files[0]}.png`}`)
                            }
                        }
                        if (!deleted && newFile.delete) await unlink(path, (err) => {
                            if (err) throw err
                        })
                        images.push(loadedImage)
                    } catch (e) { console.error(e) }
                }
                const canvas = createCanvas(images[0].width, images[0].height)
                const ctx = canvas.getContext("2d")
                ctx.save()
                ctx.clearRect(0, 0, images[0].width, images[0].height)
                for (let i = 0; i < images.length; i++) ctx.drawImage(
                    images[i], 
                    i === 0 ? 0 : (newFile?.overlay_adjustment?.x === undefined ? 0 : newFile.overlay_adjustment.x), 
                    i === 0 ? 0 : (newFile?.overlay_adjustment?.y === undefined ? 0 : newFile.overlay_adjustment.y)
                )
                const createdFile = createWriteStream(`${filePath}/${newFile.file_name}.png`)
                canvas.createPNGStream().pipe(createdFile)
                writtenFiles++
            } catch (e) { console.error(e) }
        }
    }
}

const start = Date.now()

await search("RP/textures")

console.info(`Finished writing ${writtenFiles} files in ${Math.round(((Date.now() - start) / 1000) * 100) / 100} seconds`)
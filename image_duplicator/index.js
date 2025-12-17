import { readFile, readdir, writeFile, unlink, copyFile } from "fs/promises"

let writtenFiles = 0

async function search(path) {
    const dir = await readdir(path, { withFileTypes: true })
    for (const file of dir) {
        const filePath = file.parentPath
        if (file.isDirectory()) {
            await search(`${file.parentPath}/${file.name}`)
            continue
        }
        if (!file.name.endsWith(".png")) continue
        /**
        * @type {{files: string[]} | undefined}
        */
        let fileData = {}
        try {
            const parsedFile = await readFile(`${filePath}/${file.name.replace(".png", "")}.duplicate.json`);
            fileData = JSON.parse(parsedFile.toString('utf-8'));
        } catch (e) {
            console.error(e);
        }
        if (!fileData) continue
        await unlink(`${filePath}/${file.name.replace(".png", "")}.duplicate.json`, (err) => {
            if (err) throw err
        })
        for (const newFile of fileData.files) {
            try {
                await copyFile(`${filePath}/${file.name}`, `${filePath}/${newFile}.png`)
                writtenFiles++
            } catch (e) { console.error(e) }
        }

    }
}

const start = Date.now()
await search("RP")
await search("BP")

console.info(`Finished writing ${writtenFiles} files in ${Math.round(((Date.now() - start) / 1000) * 100) / 100} seconds`)
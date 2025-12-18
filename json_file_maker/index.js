import { readFile, readdir, writeFile, unlink } from "fs/promises"
import stripJsonComments from "strip-json-comments"

let writtenFiles = 0

async function search(path) {
    const dir = await readdir(path, { withFileTypes: true })
    for (const file of dir) {
        const filePath = file.parentPath
        if (file.isDirectory()) {
            await search(`${file.parentPath}/${file.name}`)
            continue
        }
        if (!file.name.endsWith(".files.json")) continue
        /**
        * @type {{files: {file_name: string, data: Object}[]}}
        */
        let fileData = {}
        try {
            const parsedFile = await readFile(`${filePath}/${file.name}`);
            fileData = JSON.parse(stripJsonComments(parsedFile.toString('utf-8')));
        } catch (e) {
            console.error(e);
        }
        await unlink(`${filePath}/${file.name}`, (err) => {
            if (err) throw err
        })
        for (const newFile of fileData.files) {
            try {
                await writeFile(`${filePath}/${newFile.file_name}.json`, JSON.stringify(newFile.data))
                writtenFiles++
            } catch (e) { console.error(e) }
        }

    }
}

const start = Date.now()
await search("RP")
await search("BP")

console.info(`Finished writing ${writtenFiles} files in ${Math.round(((Date.now() - start) / 1000) * 100) / 100} seconds`)
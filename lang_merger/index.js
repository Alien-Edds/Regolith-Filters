import { readdir, rm, readFile, appendFile } from "fs/promises";

const start = Date.now()

let mergedFiles = 0

/**
 * 
 * @param {string} path 
 * @param {string | undefined} file
 */
async function search(path, file) {
    const dir = await readdir(path, {withFileTypes: true})
    console.info(dir)
    for (const lang of dir) {
        if (lang.isDirectory()) {await search(`${lang.parentPath}/${lang.name}`, file === undefined ? `${lang.name}.lang` : file)} else if (lang.name.endsWith(".lang") && file) {
            mergedFiles++
            console.info(`merging file ${lang.parentPath}/${lang.name} with RP/texts/${file}`)
            await appendFile(`RP/texts/${file}`, `\n${await readFile(`${lang.parentPath}/${lang.name}`, {encoding: "utf-8"})}`)
        }
    }
}

/**
 * 
 * @param {string} path 
 */
async function removeFolders(path) {
    const dir = await readdir(path, {withFileTypes: true})
    for (const lang of dir) {
        if (lang.isDirectory()) {
            await rm(`${lang.parentPath}/${lang.name}`, {recursive: true})
            console.info(`removed folder RP/texts/${lang.name}`)
        }
    }
}

await search("RP/texts")

await removeFolders("RP/texts")

const end = Date.now()
console.info(`Merged ${mergedFiles} language files in ${Math.floor(((end - start) / 1000) * 100) / 100} seconds`)
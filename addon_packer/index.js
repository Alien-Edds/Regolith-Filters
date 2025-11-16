import { readFile, readdir, writeFile, appendFile, copyFile, cp, mkdir } from "fs/promises"

let writtenFiles = 0

let mainScriptFileName = undefined
const manifest = JSON.parse((await readFile("./BP/manifest.json")).toString('utf-8'))
mainScriptFileName = manifest.modules?.find((f) => { return f.type === "script" })?.entry

const createdDirectories = {}

/**
 * 
 * @param {string} path 
 * @param {"BP" | "RP"} folderType 
 * @param {string | undefined} folderName 
 */

const extraFolders = [
    "entities",
    "items",
    "blocks",
    "biomes",
    "recipes",
    "entity",
    "attachables",
    "animations",
    "animation_controllers",
    "models/blocks",
    "models/entity"
]

async function ensureDir(path) {
    return new Promise(async (resolve) => {
        if (!createdDirectories[path]) try { await readdir(path, { withFileTypes: true }); createdDirectories[path] = true } catch {
            await mkdir(path, (err) => { if (err) throw (err) })
            createdDirectories[path] = true
        }
        resolve(resolve)
    })
}

/**
 * 
 * @param {string} path 
 * @returns {Promise<NonSharedBuffer | undefined>}
 */
async function getFileData(path) {
    let data = undefined
    await new Promise(async (resolve) => {
        try {
            const parsedFile = await readFile(path)
            data = parsedFile
        } catch { }
        resolve(resolve)
    })
    return data
}

function deepMerge(target, source) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                // If the source property is an object, and the target property is not,
                // or if the target property is also an object, recursively merge.
                if (typeof target[key] !== 'object' || target[key] === null || Array.isArray(target[key])) {
                    target[key] = {}; // Initialize as an empty object if target doesn't have an object at this key
                }
                deepMerge(target[key], source[key]);
            } else if (Array.isArray(source[key])) {
                // For arrays, you might choose to overwrite, concatenate, or merge elements.
                // This example overwrites the array. For merging elements, more complex logic is needed.
                Array.isArray(target[key]) ? target[key] = [...target[key], ...source[key]] : target[key] = [...source[key]]; // Create a new array to avoid reference issues
            } else {
                // For primitive values, simply assign them.
                target[key] = source[key];
            }
        }
    }
    return target;
}

async function search(path, folderType, folderName) {
    console.log(`${path}`)
    const dir = await readdir(path, { withFileTypes: true })
    for (const file of dir) {
        const filePath = file.parentPath
        if (file.isDirectory()) {
            let found = false
            if (folderName !== undefined) {
                for (const folder of extraFolders) {
                    if (found) continue
                    const split = (filePath + `/${file.name}`).split(`${folderType === "BP" ? "behavior_packs" : "resource_packs"}/${folderName}`)[1]
                    console.log(split)
                    if (split.startsWith(`/${folder}`)) {
                        found = true
                        await ensureDir(`./${folderType}${split}`)
                        console.log(`./${folderType}${split}`)
                        await cp(`${filePath}/${file.name}`, `./${folderType}${split}/${folderName}`, { recursive: true })
                        continue
                    }
                }
            }
            if (found) continue
            if (file.name === "scripts") {
                await ensureDir("./BP/scripts")
                await cp(`${filePath}/${file.name}`, `./BP/scripts/${folderName}`, { recursive: true })
                let manifestFileData = {}
                try {
                    const parsedFile = await readFile(`${filePath}/./manifest.json`);
                    manifestFileData = JSON.parse(parsedFile.toString('utf-8'));
                } catch (e) {
                    console.error(e);
                }
                let scriptFileData = ""
                try {
                    const parsedFile = await readFile(`./BP/${mainScriptFileName}`)
                    scriptFileData = parsedFile.toString('utf-8')
                } catch (e) { }
                const importText = `${scriptFileData !== "" ? "\n" : ""}import "./${folderName}/${manifestFileData.modules?.find((f) => { return f.type === "script" })?.entry?.replace('scripts/', "")}";`
                if (scriptFileData !== "") {
                    await appendFile(`./BP/${mainScriptFileName}`, importText)
                } else {
                    await writeFile(`./BP/${mainScriptFileName}`, importText)
                }
            } else {
                if (folderType && folderName) {
                    let newFolderPath = `${filePath}/${file.name}`.replace(
                        `../../packs/data/addon_packer/${folderType === "BP" ? "behavior_packs" : "resource_packs"}/${folderName}`,
                        `./${folderType}`
                    )
                    if (newFolderPath.includes("/recipes/")) {
                        try { await readdir(`./${folderType}/recipes`, { withFileTypes: true }) } catch { await mkdir(`./${folderType}/recipes`, { recursive: true }) }
                        try { await readdir(`./${folderType}/recipes/${folderName}`, { withFileTypes: true }) } catch { await mkdir(`./${folderType}/recipes/${folderName}`, { recursive: true }) }
                        newFolderPath = newFolderPath.replace("/recipes/", `/recipes/${folderName}/`)
                    } else {

                    }
                    await ensureDir(newFolderPath)
                }
                await search(`${filePath}/${file.name}`, folderType, folderName ? folderName : `${file.name}`)
            }
            continue
        }
        const restrictedFiles = ["manifest.json", "pack_icon.png"]
        if (restrictedFiles.includes(file.name)) continue
        const copyPath = `${filePath}`.replace(
            `../../packs/data/addon_packer/${folderType === "BP" ? "behavior_packs" : "resource_packs"}/${folderName}`,
            `./${folderType}`
        )
        await ensureDir(copyPath)
        if (file.name.endsWith(".lang")) {
            let oldLang = await getFileData(`${copyPath}/${file.name}`)
            if (oldLang) oldLang = oldLang.toString('utf-8')
            if (oldLang) {
                const newLang = (await getFileData(`${filePath}/${file.name}`)).toString('utf-8').replace("pack.name", "##").replace("pack.description", "##")
                await appendFile(`${copyPath}/${file.name}`, `\n${newLang}`)
            } else {
                await copyFile(`${filePath}/${file.name}`, `${copyPath}/${file.name}`)
            }
        } else if (file.name.endsWith(".json")) {
            let oldJson = await getFileData(`${copyPath}/${file.name}`)
            if (oldJson) oldJson = JSON.parse(oldJson.toString('utf-8'))
            const newJson = JSON.parse((await getFileData(`${filePath}/${file.name}`)).toString('utf-8'))
            if (oldJson) {
                console.log("old json")
                await writeFile(`${copyPath}/${file.name}`, JSON.stringify(deepMerge(oldJson, newJson)))
            } else await writeFile(`${copyPath}/${file.name}`, JSON.stringify(newJson, 'utf-8'))
        } else {
            await copyFile(`${filePath}/${file.name}`, `${copyPath}/${file.name}`)
        }
        writtenFiles++
    }

}

const start = Date.now()

await search("../../packs/data/addon_packer/behavior_packs", "BP")
await search("../../packs/data/addon_packer/resource_packs", "RP")

console.info(`Finished writing ${writtenFiles} files in ${Math.round(((Date.now() - start) / 1000) * 100) / 100} seconds`)
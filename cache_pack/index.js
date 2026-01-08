import { cp, readdir, mkdir, rm, copyFile } from "fs/promises";
/**
 * @type {{load?: boolean, excludeItems?: string[], deleteFolders?: boolean}|undefined}
 */
const settings = process.argv[2] ? JSON.parse(process.argv[2]) : undefined;

try {
    await readdir("../cache/filters/cache_pack")
} catch {
    await mkdir("../cache/filters/cache_pack")
}

if (settings?.load) {
    if (settings?.deleteFolders) {
        console.info("Deleting existing BP and RP folders")
        if (settings?.excludeItems) {
            await mkdir("./saved", {recursive: true})
            await mkdir("./saved/BP", {recursive: true})
            await mkdir("./saved/RP", {recursive: true})
            for (const item of settings.excludeItems) {
                try {
                    await cp(`./${item}`, `./saved/${item}`, {recursive: true})
                    console.info(`Saved excluded item ${item}`)
                } catch { }
            }
        }
        await rm("./BP", {
            recursive: true, filter: (src) => {
                if (settings?.excludeItems) {
                    for (const folder of settings.excludeItems) if (src.replaceAll(`\\`, "/").includes(folder)) { console.info(`excluded item ${folder}`); return false; }
                }
                return true
            }
        })
        await rm("./RP", {
            recursive: true, filter: (src) => {
                if (settings?.excludeItems) {
                    for (const folder of settings.excludeItems) if (src.replaceAll(`\\`, "/").includes(folder)) { console.info(`excluded item ${folder}`); return false; }
                }
                return true
            }
        })
    }
    try {
        await readdir("../cache/filters/cache_pack/BP")
        await cp("../cache/filters/cache_pack/BP", "./BP", {
            recursive: true, filter: (src) => {
                if (settings?.excludeItems) {
                    for (const folder of settings.excludeItems) if (src.replaceAll(`\\`, "/").includes(folder)) { console.info(`excluded item ${folder}`); return false; }
                }
                return true
            }
        })
        console.info("Loaded BP from cache")
    } catch {
        console.info("No BP to load")
    }
    try {
        await readdir("../cache/filters/cache_pack/RP")
        await cp("../cache/filters/cache_pack/RP", "./RP", {
            recursive: true, filter: (src) => {
                if (settings?.excludeItems) {
                    for (const folder of settings.excludeItems) if (src.replaceAll(`\\`, "/").includes(folder)) { console.info(`excluded item ${folder}`); return false; }
                }
                return true
            }
        })
        console.info("Loaded RP from cache")
    } catch {
        console.info("No RP to load")
    }
    if (settings?.excludeItems) {
        for (const item of settings.excludeItems) {
            try {
                await cp(`./saved/${item}`, `./${item}`, {recursive: true})
                console.info(`Restored excluded item ${item}`)
            } catch { }
        }
    }
} else {
    await cp("./BP", "../cache/filters/cache_pack/BP", {
        recursive: true, filter: (src) => {
            if (settings?.excludeItems) {
                for (const folder of settings.excludeItems) if (src.replaceAll(`\\`, "/").includes(folder)) { console.info(`excluded item ${folder}`); return false; }
            }
            return true
        }
    })
    await cp("./RP", "../cache/filters/cache_pack/RP", {
        recursive: true, filter: (src) => {
            if (settings?.excludeItems) {
                for (const folder of settings.excludeItems) if (src.replaceAll(`\\`, "/").includes(folder)) { console.info(`excluded item ${folder}`); return false; }
            }
            return true
        }
    })
}
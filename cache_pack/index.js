import { read } from "fs";
import { cp, readdir, mkdir, rm } from "fs/promises";
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
        await rm("./BP", { recursive: true })
        await rm("./RP", { recursive: true })
    }
    try {
        await readdir("../cache/filters/cache_pack/BP")
        await cp("../cache/filters/cache_pack/BP", "./BP", {
            recursive: true, filter: (src) => {
                if (settings?.excludeItems) {
                    for (const folder of settings.excludeItems) if (src.replaceAll(`\\`, "/").includes(folder)) {console.info(`excluded item ${folder}`); return false;}
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
                    for (const folder of settings.excludeItems) if (src.replaceAll(`\\`, "/").includes(folder)) {console.info(`excluded item ${folder}`); return false;}
                }
                return true
            }
        })
        console.info("Loaded RP from cache")
    } catch {
        console.info("No RP to load")
    }
} else {
    await cp("./BP", "../cache/filters/cache_pack/BP", {
        recursive: true, filter: (src) => {
            if (settings?.excludeItems) {
                for (const folder of settings.excludeItems) if (src.replaceAll(`\\`, "/").includes(folder)) {console.info(`excluded item ${folder}`); return false;}
            }
            return true
        }
    })
    await cp("./RP", "../cache/filters/cache_pack/RP", {
        recursive: true, filter: (src) => {
            if (settings?.excludeItems) {
                for (const folder of settings.excludeItems) if (src.replaceAll(`\\`, "/").includes(folder)) {console.info(`excluded item ${folder}`); return false;}
            }
            return true
        }
    })
}
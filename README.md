# Edds' Regolith Filters


### Addon Packer
This filter lets you merge many resource and behavior packs together into one mcaddon.

Put resource packs in the ``packs/data/addon_packer/resource_packs`` folder.
Put behavior packs in the ``packs/data/addon_packer/behavior_packs`` folder.

If any behavior packs use scripting, you must define where the script is in the ``packs/BP/manifest.json`` and the dependencies.

You still have to set the pack.name and pack.description like normal. Along with the resource pack.


### Image Duplicator
This filter lets you duplicate images.

This looks for json files that share the same name as images, but end with ``.duplicate.json``.
The json file should have a single array of strings called ``files`` like so:

```json
{
    "files": [
        "test",
        "test2"
    ]
}
```


### Image Merge
This filter lets you merge images together.

This filter looks for files that end in ``.merge.json``.

This is the type that can be used:

```js
/**
    * @type {{
    *  images: string[], delete?: boolean, overlay_adjustment?: {x?: number, y?: number}
    * } | {files: {images: string[], file_name: string, delete?: boolean, overlay_adjustment?: {x?: number, y?: number}}[]}}
*/
```


### Image Tint
This filter lets you make copies of an image which are tinted.

This filter looks for files that match the name of a png and end in ``.tint.json``.

This is the type that can be used:

```js
/**
    * @type {{
    *  colors?: {hex: string, name: string}[],
    *  saturation_adjustments?: {modifier?: number, start?: number, reverse?: boolean},
    * }}
*/
```


### JSON File Maker
This filter lets you make multiple json files from a single json file.

This filter looks for files that end in ``.files.json``.

This is the type that can be used:

```js
/**
    * @type {{files: {file_name: string, data: Object}[]}}
*/
```


## End

With these, these are the first filters that i have made ever. And you can do quite a bit with these, like many color variations seen in Winter Additions.

Hope y'all enjoy these. :3
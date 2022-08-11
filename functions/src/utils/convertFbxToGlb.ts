import { Blob, FileReader } from 'vblob'

// Necessary browser native classes, that are used by FBXExporter and GLTFLoader.
globalThis.Blob = Blob
globalThis.FileReader = FileReader

/**
 * Options to import:
 *
 * 1. From 'three/examples/jsm'.
 *
 *  You need to convert project to use ES6 modules ("type": "module" in package.json).
 *  Then you'll need to upload package.json with the project to AWS.
 *
 * 2. From 'three/examples/js'.
 *
 *  You will get error:
 *
 *  Package subpath './examples/js/loaders/FBXLoader.js' is not defined by "exports" in /opt/nodejs/node_modules/three/package.json
 *
 * 3. From 'three-stdlib'.
 *
 *  It will just crash with exit code 1 without telling anything.
 *
 * 4. Hard fork necessary files (originated from "three/examples/jsm").
 *
 *  This is the current way.
 */
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
// import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { FBXLoader } from '../three/loaders/FBXLoader.js'
import { GLTFExporter } from '../three/exporters/GLTFExporter.js'

export async function convertFbxToGlb(fbxContentBuffer: ArrayBuffer): Promise<Buffer> {
  // Parse FBX to threejs node/scene
  const loader = new FBXLoader()
  const scene = loader.parse(fbxContentBuffer, '/')

  // Export to GLB
  const exporter = new GLTFExporter()
  const result = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(scene, (b) => resolve(b as ArrayBuffer), reject, { binary: true })
  })

  const buffer = Buffer.from(result)

  return buffer
}

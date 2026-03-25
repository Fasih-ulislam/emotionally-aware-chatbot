import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const OUT_DIR = path.join(__dirname, 'public', 'models')

// Files required by face-api.js:
// https://github.com/justadudewhohacks/face-api.js/tree/master/weights/
const TINY_FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
]

// face-api.js v0.22.x uses the default model name: `face_expression_model`
// but your requirement asks for `face_expression_recognition_model`.
// We download the correct upstream weights, then create copies under the names you requested.
const EXPRESSION_MODEL_MANIFEST = 'face_expression_model-weights_manifest.json'
const EXPRESSION_MODEL_SHARD = 'face_expression_model-shard1'
const EXPRESSION_RECOGNITION_MANIFEST = 'face_expression_recognition_model-weights_manifest.json'
const EXPRESSION_RECOGNITION_SHARD = 'face_expression_recognition_model-shard1'

const BASE_URL =
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/'

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath)

    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          res.resume()
          reject(
            new Error(
              `Failed to download ${url}. Status: ${res.statusCode}`,
            ),
          )
          return
        }

        res.pipe(file)

        file.on('finish', () => {
          file.close(resolve)
        })

        file.on('error', (err) => {
          fs.unlink(destPath, () => reject(err))
        })
      })
      .on('error', reject)
  })
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  for (const fileName of TINY_FILES) {
    const url = `${BASE_URL}${fileName}`
    const destPath = path.join(OUT_DIR, fileName)

    // Avoid re-downloading if it already exists and has content.
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      // eslint-disable-next-line no-console
      console.log(`Skipping (already exists): ${fileName}`)
      continue
    }

    // eslint-disable-next-line no-console
    console.log(`Downloading: ${fileName}`)
    await downloadFile(url, destPath)
    // eslint-disable-next-line no-console
    console.log(`Saved: ${fileName}`)
  }

  // Download the correct expression model weights that face-api expects.
  const expressionModelManifestPath = path.join(
    OUT_DIR,
    EXPRESSION_MODEL_MANIFEST,
  )
  const expressionModelShardPath = path.join(OUT_DIR, EXPRESSION_MODEL_SHARD)

  if (
    !(fs.existsSync(expressionModelManifestPath) && fs.statSync(expressionModelManifestPath).size > 0)
  ) {
    const url = `${BASE_URL}${EXPRESSION_MODEL_MANIFEST}`
    // eslint-disable-next-line no-console
    console.log(`Downloading: ${EXPRESSION_MODEL_MANIFEST}`)
    await downloadFile(url, expressionModelManifestPath)
    // eslint-disable-next-line no-console
    console.log(`Saved: ${EXPRESSION_MODEL_MANIFEST}`)
  } else {
    // eslint-disable-next-line no-console
    console.log(`Skipping (already exists): ${EXPRESSION_MODEL_MANIFEST}`)
  }

  if (
    !(fs.existsSync(expressionModelShardPath) && fs.statSync(expressionModelShardPath).size > 0)
  ) {
    const url = `${BASE_URL}${EXPRESSION_MODEL_SHARD}`
    // eslint-disable-next-line no-console
    console.log(`Downloading: ${EXPRESSION_MODEL_SHARD}`)
    await downloadFile(url, expressionModelShardPath)
    // eslint-disable-next-line no-console
    console.log(`Saved: ${EXPRESSION_MODEL_SHARD}`)
  } else {
    // eslint-disable-next-line no-console
    console.log(`Skipping (already exists): ${EXPRESSION_MODEL_SHARD}`)
  }

  // Create your requested copies under `face_expression_recognition_model-*`.
  const recognitionManifestPath = path.join(
    OUT_DIR,
    EXPRESSION_RECOGNITION_MANIFEST,
  )
  const recognitionShardPath = path.join(OUT_DIR, EXPRESSION_RECOGNITION_SHARD)

  if (!(fs.existsSync(recognitionShardPath) && fs.statSync(recognitionShardPath).size > 0)) {
    fs.copyFileSync(expressionModelShardPath, recognitionShardPath)
    // eslint-disable-next-line no-console
    console.log(`Saved copy: ${EXPRESSION_RECOGNITION_SHARD}`)
  }

  // Manifest copy: update shard filename reference to match the requested shard name.
  if (!(fs.existsSync(recognitionManifestPath) && fs.statSync(recognitionManifestPath).size > 0)) {
    const srcManifestStr = fs.readFileSync(expressionModelManifestPath, 'utf8')
    const updatedManifestStr = srcManifestStr.replaceAll(
      EXPRESSION_MODEL_SHARD,
      EXPRESSION_RECOGNITION_SHARD,
    )
    fs.writeFileSync(recognitionManifestPath, updatedManifestStr)
    // eslint-disable-next-line no-console
    console.log(`Saved copy: ${EXPRESSION_RECOGNITION_MANIFEST}`)
  }

  // eslint-disable-next-line no-console
  console.log('Model download complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


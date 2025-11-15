import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');
const BASE_URL = 'https://github.com/justadudewhohacks/face-api.js-models/raw/master';

const MODELS = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

async function downloadModel(modelName) {
  const filePath = path.join(MODELS_DIR, modelName);

  if (fs.existsSync(filePath)) {
    console.log(`✓ ${modelName} already exists`);
    return;
  }

  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  console.log(`⬇ Downloading: ${modelName}...`);

  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/${modelName}`;
    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(filePath, () => {});
        return reject(new Error(`Failed to download ${modelName}: ${response.statusCode}`));
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          console.log(`✓ Downloaded: ${modelName}`);
          resolve();
        });
      });
    }).on('error', (error) => {
      fs.unlink(filePath, () => {});
      reject(error);
    });
  });
}

async function main() {
  console.log('📦 Downloading face recognition models...');

  try {
    await fs.promises.mkdir(MODELS_DIR, { recursive: true });

    for (const model of MODELS) {
      await downloadModel(model);
    }

    console.log('\n✅ All models downloaded successfully!');
  } catch (error) {
    console.error('\n❌ Error downloading models:', error.message);
    process.exit(1);
  }
}

main();
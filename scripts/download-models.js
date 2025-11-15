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
  console.log('📦 Checking face recognition models...');

  try {
    await fs.promises.mkdir(MODELS_DIR, { recursive: true });

    // Check if all models already exist
    const allExist = MODELS.every(model =>
      fs.existsSync(path.join(MODELS_DIR, model))
    );

    if (allExist) {
      console.log('✅ All models already present, skipping download');
      return;
    }

    console.log('⬇ Downloading missing models...');
    
    for (const model of MODELS) {
      try {
        await downloadModel(model);
      } catch (error) {
        console.error(`⚠ Failed to download ${model}: ${error.message}`);
        // Continue with other models instead of failing
      }
    }

    // Check again if all models are now present
    const allPresentAfterDownload = MODELS.every(model =>
      fs.existsSync(path.join(MODELS_DIR, model))
    );

    if (!allPresentAfterDownload) {
      console.warn('\n⚠ Warning: Some models could not be downloaded.');
      console.warn('Face recognition may not work properly.');
      console.warn('Models should be committed to Git or downloaded manually.');
      // Don't exit with error - allow build to continue
    } else {
      console.log('\n✅ All models downloaded successfully!');
    }
  } catch (error) {
    console.error('\n⚠ Error checking models:', error.message);
    console.warn('Continuing build anyway...');
    // Don't exit with error - allow build to continue
  }
}

main();
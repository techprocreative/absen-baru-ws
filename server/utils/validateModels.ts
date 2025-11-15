import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectModelsDir = path.resolve(process.cwd(), 'public', 'models');
const distModelsDir = path.resolve(__dirname, '../../public/models');

export const MODELS_DIR = fs.existsSync(projectModelsDir)
  ? projectModelsDir
  : distModelsDir;

export const REQUIRED_MODELS = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

export function validateModels(): { valid: boolean; missing: string[] } {
  const missing = REQUIRED_MODELS.filter((model) => {
    const filePath = path.join(MODELS_DIR, model);
    return !fs.existsSync(filePath);
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

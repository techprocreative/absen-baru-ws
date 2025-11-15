import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData } from 'canvas';
import { join } from 'path';
import { logger } from '../logger.js';

// Polyfill for face-api.js in Node.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData } as any);

let modelsLoaded = false;

export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) return;
  
  try {
    const modelsPath = join(process.cwd(), 'public', 'models');
    
    logger.info('Loading face-api.js models...');
    
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath),
    ]);
    
    modelsLoaded = true;
    logger.info('Face-api.js models loaded successfully');
  } catch (error) {
    logger.error('Failed to load face-api.js models:', error);
    throw new Error('Face recognition models failed to load');
  }
}

export interface FaceDetectionResult {
  descriptor: Float32Array;
  confidence: number;
  landmarks: any;
  box: { x: number; y: number; width: number; height: number };
}

export async function detectFaceFromImage(
  imageBuffer: Buffer
): Promise<FaceDetectionResult | null> {
  if (!modelsLoaded) {
    await loadFaceApiModels();
  }
  
  try {
    const img = await bufferToImage(imageBuffer);
    
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detection) {
      return null;
    }
    
    return {
      descriptor: detection.descriptor,
      confidence: detection.detection.score,
      landmarks: detection.landmarks,
      box: detection.detection.box,
    };
  } catch (error) {
    logger.error('Face detection failed:', error);
    throw new Error('Face detection failed');
  }
}

export interface FaceQualityCheck {
  valid: boolean;
  reason?: string;
  quality: number;
}

export async function validateFaceQuality(
  detection: FaceDetectionResult
): Promise<FaceQualityCheck> {
  // Check confidence
  if (detection.confidence < 0.9) {
    return {
      valid: false,
      reason: `Face detection confidence too low: ${(detection.confidence * 100).toFixed(1)}%. Please improve lighting.`,
      quality: detection.confidence,
    };
  }
  
  // Check face size (not too small)
  const { width, height } = detection.box;
  const faceArea = width * height;
  
  if (faceArea < 10000) {
    return {
      valid: false,
      reason: 'Face too small. Please move closer to the camera.',
      quality: Math.min(faceArea / 10000, 1),
    };
  }
  
  if (faceArea > 640000) {
    return {
      valid: false,
      reason: 'Face too close. Please move back slightly.',
      quality: Math.max(1 - (faceArea - 640000) / 640000, 0),
    };
  }
  
  // Check if face is roughly centered (assuming 640x480 frame)
  const centerX = detection.box.x + width / 2;
  const centerY = detection.box.y + height / 2;
  
  const xOffset = Math.abs(centerX - 320);
  const yOffset = Math.abs(centerY - 240);
  
  if (xOffset > 150 || yOffset > 120) {
    return {
      valid: false,
      reason: 'Please center your face in the frame.',
      quality: Math.max(1 - xOffset / 320, 1 - yOffset / 240),
    };
  }
  
  return {
    valid: true,
    quality: detection.confidence,
  };
}

export interface EnrollmentResult {
  success: boolean;
  descriptors?: number[][];
  error?: string;
}

export async function enrollFaceDescriptors(
  imageBuffers: Buffer[]
): Promise<EnrollmentResult> {
  if (imageBuffers.length < 5) {
    return {
      success: false,
      error: 'Need at least 5 face captures for enrollment',
    };
  }
  
  const descriptors: number[][] = [];
  
  for (let i = 0; i < imageBuffers.length; i++) {
    const detection = await detectFaceFromImage(imageBuffers[i]);
    
    if (!detection) {
      return {
        success: false,
        error: `No face detected in capture ${i + 1}. Please try again.`,
      };
    }
    
    const qualityCheck = await validateFaceQuality(detection);
    
    if (!qualityCheck.valid) {
      return {
        success: false,
        error: `Capture ${i + 1}: ${qualityCheck.reason}`,
      };
    }
    
    descriptors.push(Array.from(detection.descriptor));
  }
  
  // Verify consistency across captures
  const avgDescriptor = calculateAverageDescriptor(descriptors);
  const allSimilar = descriptors.every(desc => 
    euclideanDistance(desc, avgDescriptor) < 0.4
  );
  
  if (!allSimilar) {
    return {
      success: false,
      error: 'Face captures are too inconsistent. Please try again in consistent lighting.',
    };
  }
  
  return {
    success: true,
    descriptors,
  };
}

export interface VerificationResult {
  match: boolean;
  confidence: number;
  distance: number;
}

export async function verifyFaceDescriptor(
  imageBuffer: Buffer,
  storedDescriptors: number[][],
  threshold: number = 0.6
): Promise<VerificationResult> {
  const detection = await detectFaceFromImage(imageBuffer);
  
  if (!detection) {
    return {
      match: false,
      confidence: 0,
      distance: 1.0,
    };
  }
  
  const currentDescriptor = Array.from(detection.descriptor);
  
  // Find best match among stored descriptors
  let minDistance = Infinity;
  
  for (const storedDescriptor of storedDescriptors) {
    const distance = euclideanDistance(currentDescriptor, storedDescriptor);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }
  
  const confidence = Math.max(0, 1 - minDistance);
  
  return {
    match: minDistance < threshold,
    confidence: Math.round(confidence * 100) / 100,
    distance: Math.round(minDistance * 100) / 100,
  };
}

function calculateAverageDescriptor(descriptors: number[][]): number[] {
  const length = descriptors[0].length;
  const avg = new Array(length).fill(0);
  
  for (const desc of descriptors) {
    for (let i = 0; i < length; i++) {
      avg[i] += desc[i];
    }
  }
  
  return avg.map(val => val / descriptors.length);
}

function euclideanDistance(desc1: number[], desc2: number[]): number {
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Helper to convert buffer to image for face-api.js
async function bufferToImage(buffer: Buffer): Promise<any> {
  const img = new Image();
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = buffer;
  });
}
import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WebcamCaptureProps {
  onCapture?: (imageData: string) => void;
  onMultipleCaptures?: (images: string[]) => void;
  captureCount?: number;
  showPreview?: boolean;
}

export function WebcamCapture({ 
  onCapture, 
  onMultipleCaptures,
  captureCount = 1,
  showPreview = true 
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [captures, setCaptures] = useState<string[]>([]);
  const [currentCapture, setCurrentCapture] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please grant permission.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    
    if (captureCount === 1) {
      setCurrentCapture(imageData);
      if (onCapture) {
        onCapture(imageData);
      }
      stopCamera();
    } else {
      const newCaptures = [...captures, imageData];
      setCaptures(newCaptures);
      
      if (newCaptures.length >= captureCount && onMultipleCaptures) {
        onMultipleCaptures(newCaptures);
        stopCamera();
      }
    }
  }, [captures, captureCount, onCapture, onMultipleCaptures, stopCamera]);

  const reset = useCallback(() => {
    setCurrentCapture(null);
    setCaptures([]);
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const isComplete = captureCount === 1 ? !!currentCapture : captures.length >= captureCount;
  const progress = captureCount > 1 ? `${captures.length}/${captureCount}` : '';

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="relative bg-black aspect-video">
          {!isComplete && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
          
          {isComplete && showPreview && currentCapture && (
            <img 
              src={currentCapture} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
          )}

          {!isStreaming && !isComplete && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center space-y-2">
                <Camera className="w-12 h-12 mx-auto" />
                <p>Starting camera...</p>
              </div>
            </div>
          )}

          {captureCount > 1 && captures.length > 0 && !isComplete && (
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full">
              {progress}
            </div>
          )}

          <div className="absolute inset-0 border-4 border-blue-500/30 rounded-lg pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-64 border-2 border-blue-500 rounded-lg"></div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </Card>

      <div className="flex gap-2">
        {!isComplete && isStreaming && (
          <Button onClick={captureImage} className="flex-1">
            <Camera className="w-4 h-4 mr-2" />
            {captureCount > 1 ? `Capture (${progress})` : 'Capture Photo'}
          </Button>
        )}

        {isComplete && (
          <>
            <Button onClick={reset} variant="outline" className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            {captureCount === 1 && (
              <Button className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Use Photo
              </Button>
            )}
          </>
        )}
      </div>

      {captureCount > 1 && captures.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {captures.map((img, idx) => (
            <img 
              key={idx}
              src={img}
              alt={`Capture ${idx + 1}`}
              className="w-full aspect-square object-cover rounded border-2 border-green-500"
            />
          ))}
        </div>
      )}

      {isStreaming && (
        <div className="text-sm text-gray-600 space-y-1">
          <p>📸 Position your face within the blue frame</p>
          <p>💡 Ensure good lighting for best results</p>
          {captureCount > 1 && <p>🔄 Capture from different angles</p>}
        </div>
      )}
    </div>
  );
}
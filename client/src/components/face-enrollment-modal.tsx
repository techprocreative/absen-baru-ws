import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FaceEnrollmentModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (faceDescriptors: number[][]) => void;
}

export function FaceEnrollmentModal({ open, onClose, onCapture }: FaceEnrollmentModalProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedCount, setCapturedCount] = useState(0);
  const [faceDescriptors, setFaceDescriptors] = useState<number[][]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const targetCaptures = 5;

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to enroll your face.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;

    setIsCapturing(true);

    // Simulate face detection and descriptor extraction
    // In a real implementation, this would use face-api.js
    const mockDescriptor = Array(128).fill(0).map(() => Math.random());
    
    setFaceDescriptors(prev => [...prev, mockDescriptor]);
    setCapturedCount(prev => prev + 1);

    toast({
      title: "Face captured",
      description: `${capturedCount + 1} of ${targetCaptures} captures completed.`,
    });

    setIsCapturing(false);

    if (capturedCount + 1 >= targetCaptures) {
      setTimeout(() => {
        onCapture([...faceDescriptors, mockDescriptor]);
        resetModal();
      }, 500);
    }
  };

  const resetModal = () => {
    setCapturedCount(0);
    setFaceDescriptors([]);
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Face Enrollment</DialogTitle>
          <DialogDescription>
            We'll capture {targetCaptures} photos of your face to ensure accurate recognition.
            Please look directly at the camera and maintain good lighting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-8">
                <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Starting camera...</p>
              </div>
            )}
            
            {stream && (
              <div className="absolute inset-0 border-2 border-primary/50 rounded-full m-auto w-64 h-64 pointer-events-none" />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{capturedCount} / {targetCaptures}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(capturedCount / targetCaptures) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={captureFrame}
              disabled={!stream || isCapturing || capturedCount >= targetCaptures}
              className="flex-1"
              data-testid="button-capture-face"
            >
              {isCapturing ? "Capturing..." : "Capture Face"}
            </Button>
            <Button
              onClick={resetModal}
              variant="outline"
              data-testid="button-cancel-enrollment"
            >
              Cancel
            </Button>
          </div>

          {capturedCount >= targetCaptures && (
            <div className="flex items-center gap-2 text-chart-2 bg-chart-2/10 p-3 rounded-md">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Enrollment complete!</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

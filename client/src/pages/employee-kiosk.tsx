import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WebcamCapture } from '@/components/webcam-capture';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { Clock, LogIn, LogOut, Coffee, UserCheck, Shield, Zap } from 'lucide-react';

type ViewMode = 'home' | 'camera' | 'actions';
type AttendanceStatus = 'no-attendance' | 'checked-in' | 'checked-out';

interface AttendanceData {
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
}

export default function EmployeeKiosk() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format date and time in Indonesian locale
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  const handleCapture = async (imageData: string) => {
    setCapturedImage(imageData);
    setIsLoading(true);

    try {
      // Verify face and get today's attendance status
      const response = await fetch('/api/attendance/today', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Face-Image': imageData,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify face or fetch attendance status');
      }

      const data = await response.json();
      
      // Determine status based on response
      let status: AttendanceStatus = 'no-attendance';
      if (data.attendance) {
        status = data.attendance.checkOutTime ? 'checked-out' : 'checked-in';
      }

      setAttendanceStatus({
        status,
        checkInTime: data.attendance?.checkInTime,
        checkOutTime: data.attendance?.checkOutTime,
      });

      setViewMode('actions');
    } catch (error) {
      console.error('Error verifying face:', error);
      toast({
        title: 'Verifikasi Gagal',
        description: 'Tidak dapat memverifikasi identitas Anda. Silakan coba lagi.',
        variant: 'destructive',
      });
      setViewMode('home');
      setCapturedImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!capturedImage) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faceImage: capturedImage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Check-in failed');
      }

      const data = await response.json();
      
      toast({
        title: 'Masuk Berhasil',
        description: `Selamat datang! Masuk pada ${new Date(data.checkInTime).toLocaleTimeString()}`,
      });

      // Reset to home after successful check-in
      setTimeout(() => {
        resetToHome();
      }, 2000);
    } catch (error: any) {
      console.error('Check-in error:', error);
      toast({
        title: 'Masuk Gagal',
        description: error.message || 'Terjadi kesalahan saat masuk',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!capturedImage) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faceImage: capturedImage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Check-out failed');
      }

      const data = await response.json();
      
      toast({
        title: 'Pulang Berhasil',
        description: `Sampai jumpa! Pulang pada ${new Date(data.checkOutTime).toLocaleTimeString()}`,
      });

      // Reset to home after successful check-out
      setTimeout(() => {
        resetToHome();
      }, 2000);
    } catch (error: any) {
      console.error('Check-out error:', error);
      toast({
        title: 'Pulang Gagal',
        description: error.message || 'Terjadi kesalahan saat pulang',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBreak = () => {
    toast({
      title: 'Segera Hadir',
      description: 'Fitur istirahat akan segera tersedia!',
    });
  };

  const resetToHome = () => {
    setViewMode('home');
    setCapturedImage(null);
    setAttendanceStatus(null);
    setIsLoading(false);
  };

  // Camera view
  if (viewMode === 'camera') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Verifikasi Wajah
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Posisikan wajah Anda dalam bingkai
            </p>
          </div>

          <WebcamCapture 
            onCapture={handleCapture}
            showPreview={false}
          />

          <Button 
            onClick={resetToHome} 
            variant="outline" 
            className="w-full"
          >
            Batal
          </Button>
        </div>
      </div>
    );
  }

  // Actions view (after face verification)
  if (viewMode === 'actions' && attendanceStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center space-y-2">
            <UserCheck className="w-16 h-16 mx-auto text-green-600 dark:text-green-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Identitas Terverifikasi
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Pilih tindakan Anda
            </p>
          </div>

          {attendanceStatus.status === 'no-attendance' && (
            <Card>
              <CardHeader>
                <CardTitle>Belum Absen Hari Ini</CardTitle>
                <CardDescription>
                  Anda belum melakukan absen masuk hari ini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleCheckIn} 
                  className="w-full"
                  disabled={isLoading}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {isLoading ? 'Memproses...' : 'Masuk'}
                </Button>
              </CardContent>
            </Card>
          )}

          {attendanceStatus.status === 'checked-in' && (
            <Card>
              <CardHeader>
                <CardTitle>Sudah Masuk</CardTitle>
                <CardDescription>
                  Anda masuk pada {attendanceStatus.checkInTime
                    ? new Date(attendanceStatus.checkInTime).toLocaleTimeString()
                    : 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleBreak} 
                  variant="outline"
                  className="w-full"
                >
                  <Coffee className="w-4 h-4 mr-2" />
                  Istirahat
                </Button>
                <Button 
                  onClick={handleCheckOut} 
                  className="w-full"
                  disabled={isLoading}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLoading ? 'Memproses...' : 'Pulang'}
                </Button>
              </CardContent>
            </Card>
          )}

          {attendanceStatus.status === 'checked-out' && (
            <Card>
              <CardHeader>
                <CardTitle>Sudah Pulang</CardTitle>
                <CardDescription>
                  Anda pulang pada {attendanceStatus.checkOutTime
                    ? new Date(attendanceStatus.checkOutTime).toLocaleTimeString()
                    : 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Semoga hari Anda menyenangkan! Sampai jumpa besok.
                </p>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={resetToHome} 
            variant="ghost" 
            className="w-full"
          >
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  // Home view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl w-full space-y-8">
        {/* Company Header and Clock */}
        <div className="text-center space-y-3 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Sistem Absensi Karyawan Toserba WS Pedak
          </h1>
          <div className="space-y-1">
            <div className="text-lg md:text-xl font-semibold text-blue-600 dark:text-blue-400">
              {formatDate(currentTime)}
            </div>
            <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Kiosk Absensi Karyawan
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Absensi Cepat Masuk/Pulang dengan Pengenalan Wajah
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-center">Absensi Cepat</CardTitle>
              <CardDescription className="text-center">
                Masuk/pulang dengan pengenalan wajah
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setViewMode('camera')}
              >
                <UserCheck className="w-5 h-5 mr-2" />
                Absen
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-center">Portal Karyawan</CardTitle>
              <CardDescription className="text-center">
                Akses dashboard dan riwayat absensi Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={() => setLocation('/login')}
              >
                <LogIn className="w-5 h-5 mr-2" />
                Login
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-8 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Aman</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verifikasi wajah memastikan absensi yang akurat
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Cepat</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selesaikan absensi dalam hitungan detik
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
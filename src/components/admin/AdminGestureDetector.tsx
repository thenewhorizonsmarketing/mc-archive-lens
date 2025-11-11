import React, { useState, useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * AdminGestureDetector Component
 * 
 * Detects 3-second tap-and-hold in upper-left corner to trigger admin access
 * Shows PIN entry dialog and validates against configured PIN
 * 
 * Requirements:
 * - 3.3: Detect 3-second tap-and-hold in upper-left corner
 * - 10.1: Show PIN entry dialog and validate PIN from config
 */

interface AdminGestureDetectorProps {
  adminPin: string;
  onAdminAccess: () => void;
  isAdminOpen: boolean;
}

const HOLD_DURATION = 3000; // 3 seconds
const GESTURE_ZONE_SIZE = 100; // 100px square in upper-left

export const AdminGestureDetector: React.FC<AdminGestureDetectorProps> = ({
  adminPin,
  onAdminAccess,
  isAdminOpen
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const holdTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Reset PIN dialog when admin overlay closes
  useEffect(() => {
    if (!isAdminOpen) {
      setShowPinDialog(false);
      setPinInput('');
      setPinError(false);
    }
  }, [isAdminOpen]);

  const isInGestureZone = (x: number, y: number): boolean => {
    return x <= GESTURE_ZONE_SIZE && y <= GESTURE_ZONE_SIZE;
  };

  const startHold = (x: number, y: number) => {
    if (!isInGestureZone(x, y) || isAdminOpen) return;

    console.log('[AdminGesture] Hold started in gesture zone');
    setIsHolding(true);
    setHoldProgress(0);
    holdStartTimeRef.current = Date.now();
    touchStartPosRef.current = { x, y };

    // Update progress every 50ms
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
    }, 50);

    // Trigger PIN dialog after hold duration
    holdTimerRef.current = window.setTimeout(() => {
      console.log('[AdminGesture] Hold completed, showing PIN dialog');
      setIsHolding(false);
      setHoldProgress(0);
      setShowPinDialog(true);
      
      // Clear progress interval
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }, HOLD_DURATION);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setIsHolding(false);
    setHoldProgress(0);
    touchStartPosRef.current = null;
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      startHold(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isHolding || !touchStartPosRef.current) return;

    const touch = e.touches[0];
    if (touch) {
      // Cancel if moved too far from start position
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = touch.clientY - touchStartPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 20) {
        console.log('[AdminGesture] Hold cancelled - moved too far');
        cancelHold();
      }
    }
  };

  const handleTouchEnd = () => {
    if (isHolding) {
      console.log('[AdminGesture] Hold cancelled - touch ended early');
      cancelHold();
    }
  };

  // Mouse event handlers (for testing on desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    startHold(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isHolding || !touchStartPosRef.current) return;

    const dx = e.clientX - touchStartPosRef.current.x;
    const dy = e.clientY - touchStartPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 20) {
      cancelHold();
    }
  };

  const handleMouseUp = () => {
    if (isHolding) {
      cancelHold();
    }
  };

  // PIN validation
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pinInput === adminPin) {
      console.log('[AdminGesture] PIN validated successfully');
      setShowPinDialog(false);
      setPinInput('');
      setPinError(false);
      onAdminAccess();
    } else {
      console.warn('[AdminGesture] Invalid PIN entered');
      setPinError(true);
      setPinInput('');
      
      // Clear error after 2 seconds
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handlePinCancel = () => {
    setShowPinDialog(false);
    setPinInput('');
    setPinError(false);
  };

  return (
    <>
      {/* Invisible gesture detection zone */}
      <div
        className="fixed top-0 left-0 z-40"
        style={{
          width: `${GESTURE_ZONE_SIZE}px`,
          height: `${GESTURE_ZONE_SIZE}px`,
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Hold progress indicator */}
      {isHolding && (
        <div
          className="fixed top-4 left-4 z-50 pointer-events-none"
          style={{
            width: '60px',
            height: '60px'
          }}
        >
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="30"
              cy="30"
              r="25"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="4"
            />
            <circle
              cx="30"
              cy="30"
              r="25"
              fill="none"
              stroke="rgba(59, 130, 246, 0.8)"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 25}`}
              strokeDashoffset={`${2 * Math.PI * 25 * (1 - holdProgress / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      )}

      {/* PIN Entry Dialog */}
      {showPinDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 text-slate-100 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Admin Access
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter PIN to access admin controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter PIN"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className={`bg-slate-800 border-slate-600 text-center text-2xl tracking-widest ${
                      pinError ? 'border-red-500 animate-shake' : ''
                    }`}
                    autoFocus
                    maxLength={6}
                  />
                  {pinError && (
                    <p className="text-sm text-red-400 text-center">
                      Invalid PIN. Please try again.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePinCancel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={pinInput.length === 0}
                  >
                    Submit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
};

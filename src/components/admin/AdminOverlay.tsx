import React, { useState, useEffect } from 'react';
import { X, Settings, Activity, Clock, Zap, Eye, EyeOff } from 'lucide-react';
import { usePerformanceStore } from '@/store/performanceStore';
import { useIdleStore } from '@/store/idleStore';
import { useKioskStore } from '@/store/kioskStore';
import type { KioskConfig } from '@/types/kiosk-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BootMetricsDisplay } from '@/components/system/BootMetricsDisplay';

/**
 * AdminOverlay Component
 * 
 * Hidden administrative interface accessible via gesture + PIN
 * 
 * Requirements:
 * - 10.1: Open via admin gesture and PIN validation
 * - 10.2: Provide controls for idle timers configuration
 * - 10.3: Provide controls for Motion Tier override
 * - 10.4: Provide reduced motion toggle
 * - 10.5: Display performance metrics and diagnostics
 */

interface AdminOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  config: KioskConfig;
  onConfigChange: (config: Partial<KioskConfig>) => void;
}

export const AdminOverlay: React.FC<AdminOverlayProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange
}) => {
  // Store state
  const {
    motionTier,
    initialMotionTier,
    autoTierEnabled,
    currentFPS,
    averageFPS,
    metrics,
    gpuCapabilities,
    webGLAvailable,
    setMotionTier,
    setAutoTier
  } = usePerformanceStore();

  const {
    idleTimeout,
    attractTimeout,
    isIdle,
    isInAttractMode,
    setIdleTimeout,
    setAttractTimeout,
    resetAll: resetIdleTimers
  } = useIdleStore();

  const { currentRoute, isTransitioning } = useKioskStore();

  // Local state for configuration editing
  const [localIdleTimeout, setLocalIdleTimeout] = useState(idleTimeout / 1000); // Convert to seconds
  const [localAttractTimeout, setLocalAttractTimeout] = useState(attractTimeout / 1000);
  const [localMotionTier, setLocalMotionTier] = useState(motionTier);
  const [localAutoTier, setLocalAutoTier] = useState(autoTierEnabled);
  const [reducedMotion, setReducedMotion] = useState(config.reducedMotion || false);

  // Update local state when store changes
  useEffect(() => {
    setLocalIdleTimeout(idleTimeout / 1000);
    setLocalAttractTimeout(attractTimeout / 1000);
  }, [idleTimeout, attractTimeout]);

  useEffect(() => {
    setLocalMotionTier(motionTier);
    setLocalAutoTier(autoTierEnabled);
  }, [motionTier, autoTierEnabled]);

  // Apply configuration changes
  const handleApplyIdleTimers = () => {
    setIdleTimeout(localIdleTimeout * 1000);
    setAttractTimeout(localAttractTimeout * 1000);
    resetIdleTimers();
    onConfigChange({
      idleTimeout: localIdleTimeout * 1000,
      attractTimeout: localAttractTimeout * 1000
    });
  };

  const handleApplyMotionTier = () => {
    setMotionTier(localMotionTier);
    setAutoTier(localAutoTier);
    onConfigChange({
      motionTier: localMotionTier,
      autoTierEnabled: localAutoTier
    });
  };

  const handleToggleReducedMotion = (enabled: boolean) => {
    setReducedMotion(enabled);
    onConfigChange({ reducedMotion: enabled });
    
    // If reduced motion is enabled, force static tier
    if (enabled) {
      setMotionTier('static');
      setAutoTier(false);
    }
  };

  const handleResetToDefaults = () => {
    setLocalIdleTimeout(45);
    setLocalAttractTimeout(120);
    setLocalMotionTier(initialMotionTier);
    setLocalAutoTier(true);
    setReducedMotion(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 text-slate-100 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Admin Control Panel
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure kiosk settings and monitor performance
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="timers">Timers</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            </TabsList>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6 mt-6">
              {/* Motion Tier Control */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Motion Tier Configuration
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Control visual quality and performance level
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-tier" className="text-sm font-medium">
                      Auto-Tier Adjustment
                    </Label>
                    <Switch
                      id="auto-tier"
                      checked={localAutoTier}
                      onCheckedChange={setLocalAutoTier}
                      disabled={reducedMotion}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Motion Tier</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['full', 'lite', 'static'] as const).map((tier) => (
                        <Button
                          key={tier}
                          variant={localMotionTier === tier ? 'default' : 'outline'}
                          onClick={() => setLocalMotionTier(tier)}
                          disabled={reducedMotion}
                          className="capitalize"
                        >
                          {tier}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      {localMotionTier === 'full' && 'Board tilt + parallax + emissive pulses'}
                      {localMotionTier === 'lite' && 'Parallax only, no tilt'}
                      {localMotionTier === 'static' && 'Cross-fade highlights only'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-sm font-medium">Current Tier</p>
                      <Badge variant="secondary" className="mt-1 capitalize">
                        {motionTier}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Initial Tier</p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {initialMotionTier}
                      </Badge>
                    </div>
                  </div>

                  <Button onClick={handleApplyMotionTier} className="w-full">
                    Apply Motion Tier Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Reduced Motion */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {reducedMotion ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    Reduced Motion
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Disable animations for accessibility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reduced-motion" className="text-sm font-medium">
                      Enable Reduced Motion
                    </Label>
                    <Switch
                      id="reduced-motion"
                      checked={reducedMotion}
                      onCheckedChange={handleToggleReducedMotion}
                    />
                  </div>
                  {reducedMotion && (
                    <p className="text-xs text-amber-400 mt-2">
                      ⚠️ Reduced motion forces static tier and disables auto-tier
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Current Performance Metrics */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Current FPS</p>
                      <p className="text-2xl font-bold">{currentFPS.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Average FPS</p>
                      <p className="text-2xl font-bold">{averageFPS.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Frame Time</p>
                      <p className="text-lg font-semibold">{metrics.frameTime.toFixed(2)}ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Draw Calls</p>
                      <p className="text-lg font-semibold">{metrics.drawCalls}</p>
                    </div>
                  </div>
                  <Separator className="bg-slate-700" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Triangles</p>
                      <p className="text-sm font-medium">{metrics.triangles.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Memory</p>
                      <p className="text-sm font-medium">
                        {(metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timers Tab */}
            <TabsContent value="timers" className="space-y-6 mt-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Idle Timer Configuration
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure automatic idle and reset behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="idle-timeout" className="text-sm font-medium">
                      Idle Timeout (seconds)
                    </Label>
                    <Input
                      id="idle-timeout"
                      type="number"
                      min="10"
                      max="300"
                      value={localIdleTimeout}
                      onChange={(e) => setLocalIdleTimeout(Number(e.target.value))}
                      className="bg-slate-900 border-slate-600"
                    />
                    <p className="text-xs text-slate-400">
                      Time before attract loop starts (default: 45s)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attract-timeout" className="text-sm font-medium">
                      Auto-Reset Timeout (seconds)
                    </Label>
                    <Input
                      id="attract-timeout"
                      type="number"
                      min="30"
                      max="600"
                      value={localAttractTimeout}
                      onChange={(e) => setLocalAttractTimeout(Number(e.target.value))}
                      className="bg-slate-900 border-slate-600"
                    />
                    <p className="text-xs text-slate-400">
                      Time before auto-reset to home (default: 120s)
                    </p>
                  </div>

                  <Separator className="bg-slate-700" />

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Current Status</p>
                    <div className="flex gap-2">
                      <Badge variant={isIdle ? 'default' : 'outline'}>
                        {isIdle ? 'Idle' : 'Active'}
                      </Badge>
                      <Badge variant={isInAttractMode ? 'default' : 'outline'}>
                        {isInAttractMode ? 'Attract Mode' : 'Normal'}
                      </Badge>
                    </div>
                  </div>

                  <Button onClick={handleApplyIdleTimers} className="w-full">
                    Apply Timer Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Diagnostics Tab */}
            <TabsContent value="diagnostics" className="space-y-6 mt-6">
              {/* Boot Performance Metrics */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Boot Performance (Requirement 8.1)
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Application must boot to full-screen within 5 seconds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BootMetricsDisplay />
                </CardContent>
              </Card>

              {/* System Information */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">WebGL Available</p>
                      <p className="font-medium">{webGLAvailable ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Current Route</p>
                      <p className="font-medium capitalize">{currentRoute}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Transitioning</p>
                      <p className="font-medium">{isTransitioning ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Config PIN</p>
                      <p className="font-mono text-xs">{config.adminPin || 'Not Set'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GPU Information */}
              {gpuCapabilities && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg">GPU Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <p className="text-slate-400">Vendor</p>
                      <p className="font-medium">{gpuCapabilities.vendor}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Renderer</p>
                      <p className="font-medium text-xs">{gpuCapabilities.renderer}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">GPU Tier</p>
                      <Badge variant="secondary" className="capitalize">
                        {gpuCapabilities.gpuTier}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-slate-400">WebGL Version</p>
                      <p className="font-medium">{gpuCapabilities.webglVersion}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Max Texture Size</p>
                      <p className="font-medium">{gpuCapabilities.maxTextureSize}px</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={handleResetToDefaults}
                    variant="outline"
                    className="w-full"
                  >
                    Reset to Defaults
                  </Button>
                  <Button
                    onClick={resetIdleTimers}
                    variant="outline"
                    className="w-full"
                  >
                    Reset Idle Timers
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

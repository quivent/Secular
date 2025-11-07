import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Sliders } from 'lucide-react';
import {
  ParameterKnob,
  ParameterFader,
  MetricMeter,
  StatusLED,
  StatusLEDGroup,
  WaveformGraph,
  LEDStatus,
} from '../components/controls';

/**
 * ComponentShowcase - Interactive demonstration of all studio control components
 */
export default function ComponentShowcase() {
  // Knob state
  const [knobValue, setKnobValue] = useState(50);
  const [frequencyKnob, setFrequencyKnob] = useState(440);
  const [gainKnob, setGainKnob] = useState(0);

  // Fader state
  const [faderValue, setFaderValue] = useState(70);
  const [volumeFader, setVolumeFader] = useState(80);

  // Meter state
  const [meterValue, setMeterValue] = useState(45);
  const [cpuUsage, setCpuUsage] = useState(30);

  // LED state
  const [ledStatus, setLedStatus] = useState<LEDStatus>('idle');

  // Waveform state
  const [waveformData, setWaveformData] = useState<number[]>(
    Array.from({ length: 50 }, () => Math.random() * 100)
  );

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update meter value
      setMeterValue(prev => {
        const change = (Math.random() - 0.5) * 20;
        return Math.max(0, Math.min(100, prev + change));
      });

      // Update CPU usage
      setCpuUsage(prev => {
        const change = (Math.random() - 0.5) * 10;
        return Math.max(0, Math.min(100, prev + change));
      });

      // Update waveform
      setWaveformData(prev => {
        const newData = [...prev.slice(1), Math.random() * 100];
        return newData;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Cycle LED status
  const cycleLEDStatus = () => {
    const statuses: LEDStatus[] = ['idle', 'running', 'warning', 'error'];
    const currentIndex = statuses.indexOf(ledStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    setLedStatus(statuses[nextIndex]);
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sliders className="w-8 h-8 text-primary-400" />
            <h1 className="text-3xl font-bold">Studio Control Components</h1>
          </div>
          <p className="text-white/60">
            Interactive demonstration of custom control components with audio mixer aesthetic.
            All components feature smooth animations, accessible interactions, and professional styling.
          </p>
        </motion.div>

        {/* ParameterKnob Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-primary-400" />
            <h2 className="text-xl font-bold">ParameterKnob</h2>
          </div>
          <p className="text-white/60 mb-6 text-sm">
            Rotary knob with -135° to +135° rotation. Click-drag vertically to adjust, scroll for fine-tuning, double-click to type value.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="flex flex-col items-center">
              <ParameterKnob
                label="Volume"
                value={knobValue}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={setKnobValue}
                colorZones={[
                  { start: 0, end: 60, color: 'rgb(34, 197, 94)' },
                  { start: 60, end: 85, color: 'rgb(250, 204, 21)' },
                  { start: 85, end: 100, color: 'rgb(239, 68, 68)' },
                ]}
                presets={[0, 25, 50, 75, 100]}
              />
              <div className="mt-4 text-xs text-white/40 text-center">
                With color zones and presets
              </div>
            </div>

            <div className="flex flex-col items-center">
              <ParameterKnob
                label="Frequency"
                value={frequencyKnob}
                min={20}
                max={20000}
                step={10}
                unit="Hz"
                onChange={setFrequencyKnob}
                size="lg"
              />
              <div className="mt-4 text-xs text-white/40 text-center">
                Large size, wide range
              </div>
            </div>

            <div className="flex flex-col items-center">
              <ParameterKnob
                label="Gain"
                value={gainKnob}
                min={-12}
                max={12}
                step={0.1}
                unit="dB"
                onChange={setGainKnob}
                size="sm"
              />
              <div className="mt-4 text-xs text-white/40 text-center">
                Small size, decimal steps
              </div>
            </div>
          </div>
        </motion.section>

        {/* ParameterFader Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-primary-400" />
            <h2 className="text-xl font-bold">ParameterFader</h2>
          </div>
          <p className="text-white/60 mb-6 text-sm">
            Vertical slider with LED-style level indicator. Smooth track interaction with snap-to-value behavior.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start justify-items-center">
            <div className="flex flex-col items-center">
              <ParameterFader
                label="Master"
                value={faderValue}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={setFaderValue}
                height={250}
                showScale={true}
              />
              <div className="mt-4 text-xs text-white/40 text-center">
                With scale markers
              </div>
            </div>

            <div className="flex flex-col items-center">
              <ParameterFader
                label="Volume"
                value={volumeFader}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={setVolumeFader}
                height={250}
                snapValues={[0, 25, 50, 75, 100]}
                showScale={false}
              />
              <div className="mt-4 text-xs text-white/40 text-center">
                With snap values
              </div>
            </div>

            <div className="flex flex-col items-center">
              <ParameterFader
                label="Input"
                value={50}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={() => {}}
                height={250}
                disabled={true}
              />
              <div className="mt-4 text-xs text-white/40 text-center">
                Disabled state
              </div>
            </div>
          </div>
        </motion.section>

        {/* MetricMeter Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-primary-400" />
            <h2 className="text-xl font-bold">MetricMeter</h2>
          </div>
          <p className="text-white/60 mb-6 text-sm">
            VU meter style horizontal bar with animated gradient fill. Shows peak hold indicator and optional sparkline history.
          </p>

          <div className="space-y-8">
            <MetricMeter
              label="Audio Level"
              value={meterValue}
              min={0}
              max={100}
              unit="dB"
              showPeak={true}
              thresholds={[
                { value: 60, label: 'Safe', color: 'rgb(34, 197, 94)' },
                { value: 85, label: 'Warn', color: 'rgb(250, 204, 21)' },
                { value: 95, label: 'Peak', color: 'rgb(239, 68, 68)' },
              ]}
            />

            <MetricMeter
              label="CPU Usage"
              value={cpuUsage}
              min={0}
              max={100}
              unit="%"
              showPeak={true}
              showSparkline={true}
              size="lg"
            />

            <MetricMeter
              label="Memory"
              value={75}
              min={0}
              max={100}
              unit="%"
              showPeak={false}
              size="sm"
            />
          </div>
        </motion.section>

        {/* StatusLED Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-primary-400" />
            <h2 className="text-xl font-bold">StatusLED</h2>
          </div>
          <p className="text-white/60 mb-6 text-sm">
            Binary status indicator with glow effects. States: idle (gray), running (green pulse), warning (amber blink), error (red blink).
          </p>

          <div className="space-y-8">
            <div>
              <div className="text-sm text-white/50 mb-4">Individual LEDs:</div>
              <div className="flex flex-wrap gap-6">
                <StatusLED status="idle" label="Idle" />
                <StatusLED status="running" label="Running" />
                <StatusLED status="warning" label="Warning" />
                <StatusLED status="error" label="Error" />
              </div>
            </div>

            <div>
              <div className="text-sm text-white/50 mb-4">Size variants:</div>
              <div className="flex flex-wrap gap-6 items-center">
                <StatusLED status={ledStatus} label="Small" size="sm" />
                <StatusLED status={ledStatus} label="Medium" size="md" />
                <StatusLED status={ledStatus} label="Large" size="lg" />
              </div>
              <button
                onClick={cycleLEDStatus}
                className="mt-4 px-4 py-2 glass rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                Cycle Status
              </button>
            </div>

            <div>
              <div className="text-sm text-white/50 mb-4">LED Group:</div>
              <StatusLEDGroup
                items={[
                  { status: 'running', label: 'Server' },
                  { status: 'running', label: 'Database' },
                  { status: 'warning', label: 'Cache' },
                  { status: 'error', label: 'Queue' },
                ]}
                size="md"
              />
            </div>
          </div>
        </motion.section>

        {/* WaveformGraph Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-primary-400" />
            <h2 className="text-xl font-bold">WaveformGraph</h2>
          </div>
          <p className="text-white/60 mb-6 text-sm">
            SVG-based line chart with real-time data updates. Supports multiple series, zoom/pan, and optional glow effects.
          </p>

          <div className="space-y-8">
            <WaveformGraph
              series={[
                {
                  id: 'signal',
                  data: waveformData,
                  color: 'rgb(59, 130, 246)',
                  label: 'Signal',
                  glow: true,
                },
              ]}
              width={600}
              height={200}
              min={0}
              max={100}
              showGrid={true}
              showAxes={true}
              showLegend={false}
            />

            <WaveformGraph
              series={[
                {
                  id: 'input',
                  data: waveformData.map(v => v * 0.8),
                  color: 'rgb(34, 197, 94)',
                  label: 'Input',
                  glow: false,
                },
                {
                  id: 'output',
                  data: waveformData.map(v => v * 1.2),
                  color: 'rgb(239, 68, 68)',
                  label: 'Output',
                  glow: false,
                },
              ]}
              width={600}
              height={200}
              min={0}
              max={120}
              showGrid={true}
              showAxes={true}
              showLegend={true}
              zoomable={true}
              pannable={true}
            />
          </div>
        </motion.section>

        {/* Code Examples Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-8"
        >
          <h2 className="text-xl font-bold mb-4">Usage Examples</h2>

          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
              <div className="text-green-400">// Import components</div>
              <div className="text-white/80">
                import {'{'}
                <div className="ml-4">ParameterKnob,</div>
                <div className="ml-4">ParameterFader,</div>
                <div className="ml-4">MetricMeter,</div>
                <div className="ml-4">StatusLED,</div>
                <div className="ml-4">WaveformGraph,</div>
                {'}'} from '@/components/controls';
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
              <div className="text-green-400">// Basic knob usage</div>
              <div className="text-white/80">
                {'<'}ParameterKnob
                <div className="ml-4">label="Volume"</div>
                <div className="ml-4">value={'{'}volume{'}'}</div>
                <div className="ml-4">min={'{'}0{'}'}</div>
                <div className="ml-4">max={'{'}100{'}'}</div>
                <div className="ml-4">onChange={'{'}setVolume{'}'}</div>
                {'/>'}
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

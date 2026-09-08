// frontend/src/services/mediaStreamHelper.js

export function createMockMediaStream(label = "User") {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");

  const isDoctor = label.toLowerCase().includes("doc") || label.toLowerCase().includes("provider");
  const baseHue = isDoctor ? 215 : 155;
  let angle = 0;

  const intervalId = setInterval(() => {
    angle += 0.04;

    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, `hsl(${baseHue}, 50%, 15%)`);
    grad.addColorStop(1, `hsl(${baseHue}, 60%, 8%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    const pulse = Math.sin(angle) * 12;
    ctx.beginPath();
    ctx.arc(320, 200, 75 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${baseHue}, 80%, 60%, 0.4)`;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(320, 200, 65, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${baseHue}, 75%, 42%)`;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 320, 200);

    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#f59e0b";
    ctx.fillText("🧪 Laptop Test Stream (Click Screen Share)", 320, 310);

    ctx.font = "15px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(new Date().toLocaleTimeString(), 320, 350);
  }, 1000 / 30);

  const stream = canvas.captureStream(30);

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.0001;
      const dest = audioCtx.createMediaStreamDestination();
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
    }
  } catch (err) {
    console.warn("Mock audio not supported:", err);
  }

  stream._cleanup = () => clearInterval(intervalId);
  return stream;
}

export async function getCameraOrMockStream(label = "User") {
  // Step 1: Try real camera + mic
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: true,
    });
    console.log(`✅ [${label}] Camera & Mic acquired.`);
    return { stream, isMock: false };
  } catch (err) {
    // Step 2: If mic fails, try Camera ONLY
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      console.log(`✅ [${label}] Video only acquired (mic unavailable).`);
      return { stream, isMock: false };
    } catch (err2) {
      // Step 3: Camera is locked by the other tab -> Use animated Mock
      console.warn(`⚠️ [${label}] Camera busy on this laptop. Using Mock Stream for Tab 2.`);
      const mockStream = createMockMediaStream(label);
      return { stream: mockStream, isMock: true };
    }
  }
}
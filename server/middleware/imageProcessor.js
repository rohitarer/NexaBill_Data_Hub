// server/middleware/imageProcessor.js
import dotenv from 'dotenv';
dotenv.config();

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

function getConfig() {
  return {
    BGM: (process.env.IMG_BGM_REMOVE || 'on').toLowerCase(),        // off | on
    UPSCALE: (process.env.IMG_UPSCALE || 'off').toLowerCase(),       // off | realsr | waifu2x
    SIZE: Number(process.env.IMG_TARGET_SIZE || 800),
    JPEG_Q: Number(process.env.IMG_JPEG_QUALITY || 90),
    CONTENT_RATIO: Number(process.env.IMG_CONTENT_RATIO || 0.62),    // smaller product by default
    REMBG_CLI: process.env.REMBG_CLI || 'rembg',
    REALSR_CLI: process.env.REALSR_CLI || 'realesrgan-ncnn-vulkan',
    WAIFU2X_CLI: process.env.WAIFU2X_CLI || 'waifu2x-ncnn-vulkan',
    // macOS-ish sky gradient (top → bottom)
    GRAD_TOP: process.env.IMG_BG_GRADIENT_TOP || '#cfefff',
    GRAD_BOTTOM: process.env.IMG_BG_GRADIENT_BOTTOM || '#8ecaff',
    RADIAL_HIGHLIGHT: (process.env.IMG_BG_RADIAL || 'on').toLowerCase() // on|off
  };
}

async function ensureDir(p) { await fs.mkdir(path.dirname(p), { recursive: true }); }

// ---------- Background removal ----------
async function bgRemoveNode(inputPath, outputPath) {
  const { removeBackground } = await import('background-removal');
  const buf = await fs.readFile(inputPath);
  const out = await removeBackground(buf); // PNG with alpha
  await ensureDir(outputPath);
  await fs.writeFile(outputPath, out);
}

async function bgRemoveRembgCLI(rembgPath, inputPath, outputPath) {
  console.log('   Using rembg CLI:', rembgPath);
  await ensureDir(outputPath);
  await execFileAsync(rembgPath, ['i', inputPath, outputPath]);
}

// ---------- Optional upscalers ----------
async function upscaleCLI(cli, args) { await execFileAsync(cli, args); }

// ---------- Helpers for gradient + fit-without-crop ----------
function gradientSVG(size, top, bottom, withRadial = true) {
  const radial = withRadial
    ? `<radialGradient id="r" cx="50%" cy="35%" r="60%">
         <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
         <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
       </radialGradient>`
    : '';
  const radialRect = withRadial ? `<rect width="100%" height="100%" fill="url(#r)"/>` : '';

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${top}"/>
          <stop offset="100%" stop-color="${bottom}"/>
        </linearGradient>
        ${radial}
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      ${radialRect}
    </svg>`
  );
}

/**
 * Compose trimmed product onto macOS-like sky-blue gradient, centered, no crop.
 * Also adds a subtle brightness/saturation boost and mild sharpening.
 */
async function composeOnGradient(inputPath, finalJpegPath, cfg) {
  await ensureDir(finalJpegPath);

  // 1) Trim transparent/flat edges (Sharp >=0.33 requires object)
  let trimmedBuf;
  try {
    trimmedBuf = await sharp(inputPath).trim({ threshold: 10 }).toBuffer();
  } catch {
    trimmedBuf = await fs.readFile(inputPath);
  }

  // 2) Resize to fit inside a max box (never crop) + gentle enhancement
  const maxSide = Math.floor(cfg.SIZE * cfg.CONTENT_RATIO);
  const productBuf = await sharp(trimmedBuf)
    .resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: false })
    .modulate({ brightness: 1.06, saturation: 1.08 }) // subtle lift
    .sharpen(0.5)                                     // mild sharpening
    .toBuffer();

  // 3) Gradient background + centered composite
  const bg = gradientSVG(cfg.SIZE, cfg.GRAD_TOP, cfg.GRAD_BOTTOM, cfg.RADIAL_HIGHLIGHT === 'on');
  await sharp(bg)
    .composite([{ input: productBuf, gravity: 'center' }])
    .jpeg({ quality: cfg.JPEG_Q, mozjpeg: true })
    .toFile(finalJpegPath);
}

// ---------- Orchestration pipeline ----------
export async function processImagePipeline(tempInputPath, finalJpegPath) {
  const cfg = getConfig();
  const workDir = path.join(path.dirname(finalJpegPath), '__tmp');
  await fs.mkdir(workDir, { recursive: true });
  let current = tempInputPath;

  try {
    // 1) Background removal → PNG with alpha
    if (cfg.BGM === 'on') {
      const bgOut = path.join(workDir, 'bg-removed.png');
      try {
        if (cfg.REMBG_CLI && cfg.REMBG_CLI !== 'rembg') {
          await bgRemoveRembgCLI(cfg.REMBG_CLI, current, bgOut);
        } else {
          try { await bgRemoveRembgCLI('rembg', current, bgOut); }
          catch { console.warn('   rembg not found on PATH, trying Node ONNX…'); await bgRemoveNode(current, bgOut); }
        }
        current = bgOut;
      } catch (e) {
        console.warn('⚠️ Background removal failed, continuing without it:', e.message);
      }
    }

    // 2) Optional upscaling (before compose)
    if (cfg.UPSCALE === 'realsr' || cfg.UPSCALE === 'waifu2x') {
      const upOut = path.join(workDir, 'upscaled.png');
      try {
        if (cfg.UPSCALE === 'realsr') await upscaleCLI(cfg.REALSR_CLI, ['-i', current, '-o', upOut, '-s', '2']);
        else await upscaleCLI(cfg.WAIFU2X_CLI, ['-i', current, '-o', upOut, '-s', '2', '-n', '2']);
        current = upOut;
      } catch (e) {
        console.warn('⚠️ Upscale failed, continuing without it:', e.message);
      }
    }

    // 3) Final compose on gradient (centered, no crop)
    await composeOnGradient(current, finalJpegPath, cfg);
  } finally {
    try { await fs.rm(workDir, { recursive: true, force: true }); } catch {}
  }
}





// // server/middleware/imageProcessor.js
// import dotenv from 'dotenv';
// dotenv.config();

// import sharp from 'sharp';
// import path from 'path';
// import fs from 'fs/promises';
// import { execFile } from 'child_process';
// import { promisify } from 'util';
// const execFileAsync = promisify(execFile);

// function getConfig() {
//   return {
//     BGM: (process.env.IMG_BGM_REMOVE || 'off').toLowerCase(),       // off | on
//     UPSCALE: (process.env.IMG_UPSCALE || 'off').toLowerCase(),       // off | realsr | waifu2x
//     SIZE: Number(process.env.IMG_TARGET_SIZE || 800),
//     JPEG_Q: Number(process.env.IMG_JPEG_QUALITY || 90),
//     REMBG_CLI: process.env.REMBG_CLI || 'rembg',
//     REALSR_CLI: process.env.REALSR_CLI || 'realesrgan-ncnn-vulkan',
//     WAIFU2X_CLI: process.env.WAIFU2X_CLI || 'waifu2x-ncnn-vulkan',
//     BG_CHOICE: (process.env.IMG_BG_COLOR || 'green').toLowerCase(),
//   };
// }

// function parseBgColor(choice) {
//   if (choice.startsWith('#') && (choice.length === 7 || choice.length === 4)) {
//     const hex = choice.length === 4
//       ? '#' + [...choice.slice(1)].map(c => c + c).join('')
//       : choice;
//     const r = parseInt(hex.slice(1, 3), 16);
//     const g = parseInt(hex.slice(3, 5), 16);
//     const b = parseInt(hex.slice(5, 7), 16);
//     return { r, g, b, alpha: 1 };
//   }
//   if (choice === 'blue')  return { r: 0,   g: 102, b: 204, alpha: 1 };
//   return { r: 0, g: 128, b: 0, alpha: 1 }; // default green
// }

// async function ensureDir(p) { await fs.mkdir(path.dirname(p), { recursive: true }); }

// // ---- Background removal strategies ----
// async function bgRemoveNode(inputPath, outputPath) {
//   const { removeBackground } = await import('background-removal');
//   const buf = await fs.readFile(inputPath);
//   const out = await removeBackground(buf);
//   await ensureDir(outputPath);
//   await fs.writeFile(outputPath, out);
// }

// async function bgRemoveRembgCLI(rembgPath, inputPath, outputPath) {
//   console.log('   Using rembg CLI:', rembgPath);
//   await ensureDir(outputPath);
//   await execFileAsync(rembgPath, ['i', inputPath, outputPath]);
// }

// // ---- Upscaling strategies (optional) ----
// async function upscaleCLI(cli, args) {
//   await execFileAsync(cli, args);
// }

// // ---- Final normalization to square canvas with solid bg, no cropping ----
// async function normalizeToSquare(inputPath, finalJpegPath, SIZE, JPEG_Q, BG_COLOR) {
//   await ensureDir(finalJpegPath);
//   await sharp(inputPath)
//     .rotate()
//     .resize(SIZE, SIZE, { fit: 'contain', background: BG_COLOR }) // FIT, no crop
//     .flatten({ background: BG_COLOR }) // fill any transparency from cutout
//     .jpeg({ quality: JPEG_Q, mozjpeg: true })
//     .toFile(finalJpegPath);
// }

// // ---- Orchestration pipeline ----
// export async function processImagePipeline(tempInputPath, finalJpegPath) {
//   const cfg = getConfig();
//   const BG_COLOR = parseBgColor(cfg.BG_CHOICE);

//   const workDir = path.join(path.dirname(finalJpegPath), '__tmp');
//   await fs.mkdir(workDir, { recursive: true });
//   let current = tempInputPath;

//   try {
//     // 1) Optional background removal -> PNG with alpha
//     if (cfg.BGM === 'on') {
//       const bgOut = path.join(workDir, 'bg-removed.png');
//       try {
//         if (cfg.REMBG_CLI && cfg.REMBG_CLI !== 'rembg') {
//           await bgRemoveRembgCLI(cfg.REMBG_CLI, current, bgOut);
//         } else {
//           // try env, else fall back to Node ONNX
//           try {
//             await bgRemoveRembgCLI('rembg', current, bgOut);
//           } catch {
//             console.warn('   rembg not found on PATH, trying Node ONNX background-removal…');
//             await bgRemoveNode(current, bgOut);
//           }
//         }
//         current = bgOut;
//       } catch (e) {
//         console.warn('⚠️ Background removal failed, continuing without it:', e.message);
//       }
//     }

//     // 2) Optional upscaling
//     if (cfg.UPSCALE === 'realsr' || cfg.UPSCALE === 'waifu2x') {
//       const upOut = path.join(workDir, 'upscaled.png');
//       try {
//         if (cfg.UPSCALE === 'realsr') {
//           await ensureDir(upOut);
//           await upscaleCLI(cfg.REALSR_CLI, ['-i', current, '-o', upOut, '-s', '2']);
//         } else {
//           await ensureDir(upOut);
//           await upscaleCLI(cfg.WAIFU2X_CLI, ['-i', current, '-o', upOut, '-s', '2', '-n', '2']);
//         }
//         current = upOut;
//       } catch (e) {
//         console.warn('⚠️ Upscale failed, continuing without it:', e.message);
//       }
//     }

//     // 3) Final: square pad with chosen bg color, JPEG
//     await normalizeToSquare(current, finalJpegPath, cfg.SIZE, cfg.JPEG_Q, BG_COLOR);
//   } finally {
//     try { await fs.rm(workDir, { recursive: true, force: true }); } catch {}
//   }
// }

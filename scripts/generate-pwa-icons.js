#!/usr/bin/env node

/**
 * PWA Icon Generation Script
 * 
 * This script generates all required PWA icon sizes from a source image.
 * Uses sharp for image processing.
 * 
 * Usage:
 *   bun run scripts/generate-pwa-icons.js [source-image]
 * 
 * If no source image is provided, it will generate a placeholder icon.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Colors (Algerian theme)
const COLORS = {
  primary: '#006233',
  white: '#FFFFFF',
};

/**
 * Generate a placeholder SVG icon with AlgeriaTrade branding
 */
function generatePlaceholderSVG(size) {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${COLORS.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#008f47;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
      
      <!-- Handshake/Trade Symbol (simplified) -->
      <g transform="translate(${size * 0.5}, ${size * 0.5})">
        <!-- Circle background -->
        <circle cx="0" cy="-${size * 0.05}" r="${size * 0.25}" fill="${COLORS.white}" opacity="0.15"/>
        
        <!-- AT Text -->
        <text
          x="0"
          y="${size * 0.05}"
          font-family="Arial, sans-serif"
          font-size="${size * 0.35}"
          font-weight="bold"
          fill="${COLORS.white}"
          text-anchor="middle"
          dominant-baseline="middle"
        >AT</text>
      </g>
    </svg>
  `;
  
  return Buffer.from(svg);
}

/**
 * Generate icons from a source image or placeholder
 */
async function generateIcons(sourceImagePath = null) {
  console.log('🚀 Starting PWA icon generation...\n');

  // Ensure icons directory exists
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
    console.log(`📁 Created icons directory: ${ICONS_DIR}\n`);
  }

  // Generate each size
  for (const size of SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    
    try {
      if (sourceImagePath && fs.existsSync(sourceImagePath)) {
        // Generate from source image
        await sharp(sourceImagePath)
          .resize(size, size)
          .png()
          .toFile(outputPath);
        
        console.log(`✅ Generated ${size}x${size} from source image`);
      } else {
        // Generate placeholder SVG and convert to PNG
        const svgBuffer = generatePlaceholderSVG(size);
        
        await sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toFile(outputPath);
        
        console.log(`✅ Generated ${size}x${size} placeholder`);
      }
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size}:`, error.message);
    }
  }

  console.log('\n🎉 Icon generation complete!');
  console.log(`\n📂 Icons saved to: ${ICONS_DIR}`);
  console.log('\nGenerated sizes:');
  SIZES.forEach((size) => {
    const filePath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    const exists = fs.existsSync(filePath);
    console.log(`   ${exists ? '✓' : '✗'} icon-${size}x${size}.png (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
  });
}

/**
 * Generate favicon.ico (16x16, 32x32, 48x48)
 */
async function generateFavicon() {
  console.log('\n🔄 Generating favicon...');
  
  try {
    // Generate multi-size ICO file using the 192px icon as base
    const sourceIcon = path.join(ICONS_DIR, 'icon-192x192.png');
    
    if (fs.existsSync(sourceIcon)) {
      // Create simple PNG favicon at 32x32 and 180x180 for apple-touch-icon
      const publicDir = path.join(__dirname, '..', 'public');
      
      // Generate 32x32 favicon
      await sharp(sourceIcon)
        .resize(32, 32)
        .png()
        .toFile(path.join(publicDir, 'favicon-32x32.png'));
      
      // Generate 180x180 apple-touch-icon
      await sharp(sourceIcon)
        .resize(180, 180)
        .png()
        .toFile(path.join(publicDir, 'apple-touch-icon.png'));
      
      console.log('✅ Generated favicon-32x32.png');
      console.log('✅ Generated apple-touch-icon.png');
    }
  } catch (error) {
    console.error('❌ Error generating favicon:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const sourceImage = args[0] || null;

  console.log('=' .repeat(50));
  console.log('AlgeriaTrade PWA Icon Generator');
  console.log('=' .repeat(50));
  console.log('');

  if (sourceImage) {
    console.log(`📷 Source image: ${sourceImage}`);
    if (!fs.existsSync(sourceImage)) {
      console.error(`\n❌ Source image not found: ${sourceImage}`);
      console.log('   Using placeholder instead...\n');
    }
  } else {
    console.log('📷 No source image specified - generating placeholders\n');
  }

  await generateIcons(fs.existsSync(sourceImage) ? sourceImage : null);
  await generateFavicon();

  console.log('\n' + '=' .repeat(50));
  console.log('Done! 🎉');
  console.log('=' .repeat(50));
}

// Run
main().catch(console.error);

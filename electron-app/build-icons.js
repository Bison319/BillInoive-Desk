const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
const svgPath = path.join(assetsDir, 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generateIcons() {
  // Generate 256x256 PNG
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('Created icon.png (256x256)');

  // Generate 512x512 for high-DPI
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(assetsDir, 'icon-512.png'));
  console.log('Created icon-512.png (512x512)');

  // Generate ICO with multiple sizes
  const sizes = [16, 32, 48, 64, 128, 256];
  const icoBuffers = [];
  
  for (const size of sizes) {
    const buf = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    icoBuffers.push({ size, buffer: buf });
  }

  // Build ICO file manually
  const icoBuffer = buildIco(icoBuffers);
  fs.writeFileSync(path.join(assetsDir, 'icon.ico'), icoBuffer);
  console.log('Created icon.ico (multi-size)');
}

function buildIco(images) {
  // ICO format: header + directory entries + image data
  const headerSize = 6;
  const dirEntrySize = 16;
  const numImages = images.length;
  
  let dataOffset = headerSize + (dirEntrySize * numImages);
  const directory = [];
  const imageDataParts = [];
  
  for (const img of images) {
    const size = img.size >= 256 ? 0 : img.size;
    directory.push({
      width: size,
      height: size,
      colors: 0,
      reserved: 0,
      planes: 1,
      bitsPerPixel: 32,
      dataSize: img.buffer.length,
      dataOffset: dataOffset
    });
    imageDataParts.push(img.buffer);
    dataOffset += img.buffer.length;
  }
  
  const totalSize = dataOffset;
  const ico = Buffer.alloc(totalSize);
  
  // Header
  ico.writeUInt16LE(0, 0);      // Reserved
  ico.writeUInt16LE(1, 2);      // Type: ICO
  ico.writeUInt16LE(numImages, 4); // Number of images
  
  // Directory entries
  let offset = headerSize;
  for (const entry of directory) {
    ico.writeUInt8(entry.width, offset);
    ico.writeUInt8(entry.height, offset + 1);
    ico.writeUInt8(entry.colors, offset + 2);
    ico.writeUInt8(entry.reserved, offset + 3);
    ico.writeUInt16LE(entry.planes, offset + 4);
    ico.writeUInt16LE(entry.bitsPerPixel, offset + 6);
    ico.writeUInt32LE(entry.dataSize, offset + 8);
    ico.writeUInt32LE(entry.dataOffset, offset + 12);
    offset += dirEntrySize;
  }
  
  // Image data
  for (const part of imageDataParts) {
    part.copy(ico, offset);
    offset += part.length;
  }
  
  return ico;
}

generateIcons().then(() => {
  console.log('All icons generated successfully!');
}).catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

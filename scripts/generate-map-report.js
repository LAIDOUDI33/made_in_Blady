/**
 * AlgeriaTrade - Map Location Statistics Report
 * 
 * Generates comprehensive geographic analysis of all companies
 * with GPS coordinates, including:
 * - Geographic distribution by wilaya
 * - Coordinate ranges (bounding box)
 * - Regional clustering
 * - Export-ready GeoJSON for map integration
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Wilaya names mapping
const WILAYA_NAMES = {
  '01': 'Adrar', '02': 'Chlef', '03': 'Laghouat', '04': 'Oum El Bouaghi',
  '05': 'Batna', '06': 'Béjaïa', '07': 'Biskra', '08': 'Béchar',
  '09': 'Blida', '10': 'Bouira', '11': 'Tamanrasset', '12': 'Tébessa',
  '13': 'Tlemcen', '14': 'Tiaret', '15': 'Tizi Ouzou', '16': 'Alger',
  '17': 'El Bayadh', '18': 'Djelfa', '19': 'Jijel', '20': 'Sétif',
  '21': 'Saïda', '22': 'Skikda', '23': 'Sidi Bel Abbès', '24': 'Annaba',
  '25': 'Guelma', '26': 'Constantine', '27': 'Médéa', '28': 'Mostaganem',
  "29": "M'sila", '30': 'Mascara', '31': 'Ouargla', '32': 'Oran',
  '33': 'El Tarf', '34': 'Tindouf', '35': 'Tissemsilt', '36': 'El Oued',
  '37': 'Khenchela', '38': 'Souk Ahras', '39': 'Tipaza', '40': 'Mila',
  '41': 'Aïn Defla', '42': 'Naâma', '43': 'Aïn Témouchent', '44': 'Ghardaïa',
  '45': 'Relizane', '46': "El M'Ghair", '47': 'El Meniaa', '48': 'Ouled Djellal',
  '49': 'Bordj Badji Mokhtar', '50': 'Béni Abbès', '51': 'Timimoun',
  '52': 'Touggourt', '53': 'Djanet', '54': 'In Salah', '55': 'In Guezzam'
};

// Region classification
function getRegion(wilayaCode) {
  const code = parseInt(wilayaCode);
  
  // North (Coastal)
  if ([2, 6, 9, 10, 13, 15, 16, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 35, 37, 38, 39, 40, 41, 43, 45].includes(code)) {
    return 'Nord (Côtier)';
  }
  // High Plateaus
  if ([4, 5, 12, 14, 17, 20, 34, 42, 44].includes(code)) {
    return 'Hauts Plateaux';
  }
  // South (Sahara)
  return 'Sud (Saharien)';
}

async function main() {
  console.log('🗺️  AlgeriaTrade - Map Location Report Generator');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Get all companies with coordinates
    const companies = await prisma.company.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        wilaya: true,
        commune: true,
        address: true,
        latitude: true,
        longitude: true,
        employeeCount: true,
        verificationStatus: true,
        website: true
      }
    });
    
    console.log(`📊 Total companies with GPS: ${companies.length}`);
    console.log('');
    
    // ============================================
    // SECTION 1: GEOGRAPHIC DISTRIBUTION
    // ============================================
    console.log('📍 GEOGRAPHIC DISTRIBUTION BY WILAYA');
    console.log('-'.repeat(60));
    
    const byWilaya = {};
    companies.forEach(c => {
      const w = c.wilaya || 'unknown';
      if (!byWilaya[w]) byWilaya[w] = [];
      byWilaya[w].push(c);
    });
    
    // Sort by count descending
    const sortedWilayas = Object.entries(byWilaya)
      .sort((a, b) => b[1].length - a[1].length);
    
    console.log('');
    console.log('Rank | Wilaya              | Code | Companies | Region');
    console.log('-'.repeat(65));
    
    sortedWilayas.forEach(([wilaya, comps], idx) => {
      const name = WILAYA_NAMES[wilaya] || 'Unknown';
      const region = getRegion(wilaya);
      const rank = (idx + 1).toString().padStart(3);
      const wName = name.substring(0, 18).padEnd(18);
      const code = wilaya.padStart(4);
      const count = comps.length.toString().padStart(9);
      
      console.log(`${rank} | ${wName} | ${code} | ${count} | ${region}`);
    });
    
    // ============================================
    // SECTION 2: REGIONAL BREAKDOWN
    // ============================================
    console.log('');
    console.log('');
    console.log('🌍 REGIONAL BREAKDOWN');
    console.log('-'.repeat(40));
    
    const regions = {};
    companies.forEach(c => {
      const region = getRegion(c.wilaya);
      if (!regions[region]) regions[region] = 0;
      regions[region]++;
    });
    
    Object.entries(regions).forEach(([region, count]) => {
      const pct = (count / companies.length * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(count / 20));
      console.log(`   ${region.padEnd(18)} ${count.toString().padStart(5)} (${pct}%) ${bar}`);
    });
    
    // ============================================
    // SECTION 3: COORDINATE BOUNDING BOX
    // ============================================
    console.log('');
    console.log('');
    console.log('📐 ALGERIA B2B MAP BOUNDING BOX');
    console.log('-'.repeat(50));
    
    const lats = companies.map(c => c.latitude);
    const lngs = companies.map(c => c.longitude);
    
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
      centerLat: (Math.max(...lats) + Math.min(...lats)) / 2,
      centerLng: (Math.max(...lngs) + Math.min(...lngs)) / 2
    };
    
    console.log(`   Northernmost point: ${bounds.north.toFixed(4)}°`);
    console.log(`   Southernmost point: ${bounds.south.toFixed(4)}°`);
    console.log(`   Easternmost point:  ${bounds.east.toFixed(4)}°`);
    console.log(`   Westernmost point:  ${bounds.west.toFixed(4)}°`);
    console.log('');
    console.log(`   Map Center: (${bounds.centerLat.toFixed(4)}°, ${bounds.centerLng.toFixed(4)}°)`);
    console.log(`   Lat Span: ${(bounds.north - bounds.south).toFixed(2)}° (~${((bounds.north - bounds.south) * 111).toFixed(0)} km)`);
    console.log(`   Lng Span: ${(bounds.east - bounds.west).toFixed(2)}°`);
    
    // ============================================
    // SECTION 4: TOP COMPANIES BY SIZE WITH LOCATION
    // ============================================
    console.log('');
    console.log('');
    console.log('🏭 TOP 20 LARGEST EMPLOYERS (with GPS)');
    console.log('-'.repeat(70));
    
    const topEmployers = companies
      .filter(c => c.employeeCount && c.employeeCount > 0)
      .sort((a, b) => b.employeeCount - a.employeeCount)
      .slice(0, 20);
    
    console.log('');
    console.log('#  | Company Name                              | Emp. | Location');
    console.log('-'.repeat(75));
    
    topEmployers.forEach((c, idx) => {
      const rank = (idx + 1).toString().padStart(2);
      const name = c.name.substring(0, 40).padEnd(42);
      const emp = (c.employeeCount || 0).toString().padStart(5);
      const loc = `(${c.latitude?.toFixed(2)}, ${c.longitude?.toFixed(2)})`;
      console.log(`${rank}.| ${name} | ${emp} | ${loc}`);
    });
    
    // ============================================
    // SECTION 5: VERIFIED COMPANIES BY REGION
    // ============================================
    console.log('');
    console.log('');
    console.log('✅ VERIFIED COMPANIES DISTRIBUTION');
    console.log('-'.repeat(45));
    
    const verifiedByWilaya = {};
    companies.filter(c => c.verificationStatus === 'VERIFIED').forEach(c => {
      const w = c.wilaya;
      if (!verifiedByWilaya[w]) verifiedByWilaya[w] = 0;
      verifiedByWilaya[w]++;
    });
    
    const topVerified = Object.entries(verifiedByWilaya)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    topVerified.forEach(([wilaya, count]) => {
      const name = WILAYA_NAMES[wilaya] || wilaya;
      const total = byWilaya[wilaya]?.length || 0;
      const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
      console.log(`   ${name.padEnd(22)} ${count.toString().padStart(4)} verified (${pct}% of wilaya)`);
    });
    
    // ============================================
    // SECTION 6: GENERATE GEOJSON FOR MAP INTEGRATION
    // ============================================
    console.log('');
    console.log('');
    console.log('📦 GENERATING GEOJSON EXPORT...');
    
    const geojson = {
      type: 'FeatureCollection',
      features: companies.map(c => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [c.longitude, c.latitude]
        },
        properties: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          wilaya: c.wilaya,
          wilayaName: WILAYA_NAMES[c.wilaya] || c.wilaya,
          commune: c.commune,
          address: c.address,
          employeeCount: c.employeeCount,
          verificationStatus: c.verificationStatus,
          hasWebsite: !!c.website
        }
      }))
    };
    
    // Save GeoJSON file
    const outputPath = path.join(__dirname, '../data/algeria_companies_map.geojson');
    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
    
    console.log(`   ✅ Saved to: ${outputPath}`);
    console.log(`   📊 Features: ${geojson.features.length} points`);
    console.log(`   💾 Size: ${(JSON.stringify(geojson).length / 1024 / 1024).toFixed(2)} MB`);
    
    // ============================================
    // SECTION 7: MAP INTEGRATION GUIDE
    // ============================================
    console.log('');
    console.log('');
    console.log('🔧 MAP INTEGRATION GUIDE');
    console.log('=' .repeat(50));
    console.log('');
    console.log('Database Fields Available:');
    console.log('   • company.latitude  -> Float (GPS North)');
    console.log('   • company.longitude -> Float (GPS East)');
    console.log('');
    console.log('Recommended Map Libraries:');
    console.log('   • Leaflet.js (OpenStreetMap) - Free & Open Source');
    console.log('   • Mapbox GL JS - Customizable & Beautiful');
    console.log('   • Google Maps JavaScript API - Comprehensive');
    console.log('   • OpenLayers - Enterprise-grade');
    console.log('');
    console.log('Map Center Point (Algeria):');
    console.log(`   center: [${bounds.centerLng.toFixed(4)}, ${bounds.centerLat.toFixed(4)}]`);
    console.log(`   zoom: 5-6 (country view), 8-10 (regional view)`);
    console.log('');
    console.log('Bounding Box (for auto-fit):');
    console.log(`   [[${bounds.south}, ${bounds.west}], [${bounds.north}, ${bounds.east}]]`);
    
    // Final summary
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ MAP LOCATION REPORT COMPLETE!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Summary:');
    console.log(`   📌 Total geocoded enterprises: ${companies.length}`);
    console.log(`   🗺️  Wilayas covered: ${Object.keys(byWilaya).length}/58`);
    console.log(`   📐 Bounding box: ${bounds.north.toFixed(2)}°N to ${bounds.south.toFixed(2)}°S`);
    console.log(`   📄 GeoJSON export: Ready for map integration`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

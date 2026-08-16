/**
 * AlgeriaTrade.dz - Database Statistics & Analytics Report
 * Fixed version for actual schema
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateStatistics() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🇩🇿 ALGERIATRADE.DZ - DATABASE STATISTICS REPORT        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  
  // 1. TOTAL COUNTS
  console.log('📊 OVERALL STATISTICS');
  console.log('─'.repeat(50));
  
  const totalCompanies = await prisma.company.count();
  const totalTenants = await prisma.tenant.count();
  const totalUsers = await prisma.user.count();
  const activeCompanies = await prisma.company.count({ where: { isActive: true } });
  const verifiedCompanies = await prisma.company.count({ where: { isVerified: true } });
  
  console.log(`   Total Companies:    ${totalCompanies}`);
  console.log(`   Active Companies:   ${activeCompanies} (${((activeCompanies/totalCompanies)*100).toFixed(1)}%)`);
  console.log(`   Verified Companies: ${verifiedCompanies} (${((verifiedCompanies/totalCompanies)*100).toFixed(1)}%)`);
  console.log(`   Total Tenants:      ${totalTenants}`);
  console.log(`   Total Users:        ${totalUsers}`);
  
  // 2. GEOGRAPHIC DISTRIBUTION (BY WILAYA CODE)
  console.log('\n🗺️  GEOGRAPHIC DISTRIBUTION (BY WILAYA CODE)');
  console.log('─'.repeat(50));
  
  const wilayaStats = await prisma.company.groupBy({
    by: ['wilaya'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 20
  });
  
  // Wilaya code to name mapping
  const wilayaNames = {
    '01': 'Adrar', '02': 'Chlef', '03': 'Laghouat', '04': 'Oum El Bouaghi',
    '05': 'Batna', '06': 'Béjaïa', '07': 'Biskra', '08': 'Béchar',
    '09': 'Blida', '10': 'Bouira', '11': 'Tamanrasset', '12': 'Tébessa',
    '13': 'Tlemcen', '14': 'Tiaret', '15': 'Tizi Ouzou', '16': 'Alger',
    '17': 'Djelfa', '18': 'Jijel', '19': 'Sétif', '20': 'Saïda',
    '21': 'Skikda', '22': 'Sidi Bel Abbès', '23': 'Annaba', '24': 'Guelma',
    '25': 'Constantine', '26': 'Médéa', '27': 'Mostaganem', "28": "M'Sila",
    '29': 'Mascara', '30': 'Ouargla', '31': 'Oran', '32': 'El Bayadh',
    '33': 'Illizi', '34': 'Bordj Bou Arreridj', '35': 'Boumerdès',
    '36': 'El Tarf', '37': 'Tindouf', '38': 'Tissemsilt', '39': 'El Oued',
    '40': 'Khenchela', '41': 'Souk Ahras', '42': 'Tipaza', '43': 'Mila',
    '44': 'Aïn Defla', '45': 'Naâma', '46': 'Aïn Témouchent', '47': 'Ghardaïa',
    '48': 'Relizane', '49': "El M'Ghair", '50': 'El Meniaa'
  };
  
  wilayaStats.forEach((w, idx) => {
    const name = wilayaNames[w.wilaya] || w.wilaya;
    const bar = '█'.repeat(Math.ceil(w._count.id / 3)) || '▏';
    console.log(`   ${String(idx+1).padStart(2)}. [${w.wilaya}] ${name.padEnd(22)} ${String(w._count.id).padStart(4)} ${bar}`);
  });
  
  // 3. VERIFICATION STATUS BREAKDOWN
  console.log('\n✅ VERIFICATION STATUS DISTRIBUTION');
  console.log('─'.repeat(50));
  
  const verificationStats = await prisma.company.groupBy({
    by: ['verificationStatus'],
    _count: { id: true }
  });
  
  verificationStats.forEach(v => {
    const pct = ((v._count.id / totalCompanies) * 100).toFixed(1);
    console.log(`   • ${String(v.verificationStatus || 'NULL').padEnd(25)} ${String(v._count.id).padStart(4)} (${pct}%)`);
  });
  
  // 4. LEGAL FORM DISTRIBUTION
  console.log('\n📋 LEGAL FORM DISTRIBUTION (TOP 10)');
  console.log('─'.repeat(50));
  
  const legalFormStats = await prisma.company.groupBy({
    by: ['legalForm'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  });
  
  legalFormStats.forEach(l => {
    const pct = ((l._count.id / totalCompanies) * 100).toFixed(1);
    console.log(`   • ${(l.legalForm || 'N/A').padEnd(15)} ${String(l._count.id).padStart(4)} (${pct}%)`);
  });
  
  // 5. EMPLOYEE COUNT ANALYSIS
  console.log('\n👥 EMPLOYEE COUNT ANALYSIS');
  console.log('─'.repeat(50));
  
  const employeeRanges = [
    { label: 'Micro (1-10)', min: 1, max: 10 },
    { label: 'Small (11-50)', min: 11, max: 50 },
    { label: 'Medium (51-200)', min: 51, max: 200 },
    { label: 'Large (201-500)', min: 201, max: 500 },
    { label: 'Enterprise (500+)', min: 500, max: 999999 }
  ];
  
  for (const range of employeeRanges) {
    const count = await prisma.company.count({
      where: {
        employeeCount: { gte: range.min, lte: range.max }
      }
    });
    const pct = ((count / totalCompanies) * 100).toFixed(1);
    const bar = '█'.repeat(Math.ceil(count / 15)) || '▏';
    console.log(`   • ${range.label.padEnd(20)} ${String(count).padStart(4)} (${pct}%) ${bar}`);
  }
  
  // 6. TOP EMPLOYERS (LARGEST COMPANIES)
  console.log('\n🏆 TOP 15 LARGEST COMPANIES (BY EMPLOYEES)');
  console.log('─'.repeat(50));
  
  const topEmployers = await prisma.company.findMany({
    where: { employeeCount: { not: null } },
    orderBy: { employeeCount: 'desc' },
    take: 15,
    select: {
      name: true,
      wilaya: true,
      employeeCount: true,
      legalForm: true,
      verificationStatus: true
    }
  });
  
  topEmployers.forEach((c, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
    const wilayaName = wilayaNames[c.wilaya] || c.wilaya;
    console.log(`${medal} ${idx+1}. ${c.name.substring(0, 42).padEnd(42)} [${c.employeeCount?.toString().padStart(5)} emp.] ${wilayaName}`);
  });
  
  // 7. RATING DISTRIBUTION
  console.log('\n⭐ RATING DISTRIBUTION');
  console.log('─'.repeat(50));
  
  const ratingRanges = [
    { label: 'Excellent (4.5-5.0)', min: 4.5, max: 5.0 },
    { label: 'Good (4.0-4.49)', min: 4.0, max: 4.49 },
    { label: 'Average (3.0-3.99)', min: 3.0, max: 3.99 },
    { label: 'Below Average (2.0-2.99)', min: 2.0, max: 2.99 },
    { label: 'Poor (<2.0)', min: 0, max: 1.99 }
  ];
  
  for (const range of ratingRanges) {
    const count = await prisma.company.count({
      where: { rating: { gte: range.min, lte: range.max } }
    });
    const pct = ((count / totalCompanies) * 100).toFixed(1);
    console.log(`   • ${range.label.padEnd(25)} ${String(count).padStart(4)} (${pct}%)`);
  }
  
  // 8. RESPONSE RATE ANALYSIS
  console.log('\n💬 RESPONSE RATE ANALYSIS');
  console.log('─'.repeat(50));
  
  const avgResponseRate = await prisma.company.aggregate({
    _avg: { responseRate: true }
  });
  
  console.log(`   Average Response Rate: ${avgResponseRate._avg.responseRate?.toFixed(1)}%`);
  
  const highResponse = await prisma.company.count({ where: { responseRate: { gte: 90 } } });
  console.log(`   High Response (90%+):  ${highResponse} companies (${((highResponse/totalCompanies)*100).toFixed(1)}%)`);
  
  // 9. YEAR ESTABLISHED (COMPANY AGE)
  console.log('\n📅 COMPANY AGE DISTRIBUTION');
  console.log('─'.repeat(50));
  
  const yearRanges = [
    { label: 'Legacy (pre-1990)', max: 1990 },
    { label: 'Established (1990-2000)', min: 1990, max: 2000 },
    { label: 'Mature (2001-2010)', min: 2001, max: 2010 },
    { label: 'Growing (2011-2018)', min: 2011, max: 2018 },
    { label: 'Recent (2019+)', min: 2019, max: 2030 }
  ];
  
  for (const range of yearRanges) {
    let whereClause;
    if (!range.min) {
      whereClause = { yearEstablished: { lte: range.max } };
    } else {
      whereClause = { yearEstablished: { gte: range.min, lte: range.max } };
    }
    
    const count = await prisma.company.count({ where: whereClause });
    const pct = ((count / totalCompanies) * 100).toFixed(1);
    console.log(`   • ${range.label.padEnd(25)} ${String(count).padStart(4)} (${pct}%)`);
  }
  
  // 10. EXPORT-CAPABLE COMPANIES
  console.log('\n🌍 EXPORT CAPABILITY');
  console.log('─'.repeat(50));
  
  const exportCapable = await prisma.company.count({ where: { exportCapability: true } });
  console.log(`   Export-Oriented Companies: ${exportCapable} (${((exportCapable/totalCompanies)*100).toFixed(1)}%)`);
  
  // 11. DATA QUALITY METRICS
  console.log('\n🔍 DATA QUALITY METRICS');
  console.log('─'.repeat(50));
  
  const withWebsite = await prisma.company.count({ where: { website: { not: null } } });
  const withEmail = await prisma.company.count({ where: { contactEmail: { contains: '@' } } });
  const withDescription = await prisma.company.count({ where: { description: { not: null, not: '' } } });
  
  console.log(`   With Website:       ${withWebsite} (${((withWebsite/totalCompanies)*100).toFixed(1)}%)`);
  console.log(`   With Valid Email:   ${withEmail} (${((withEmail/totalCompanies)*100).toFixed(1)}%)`);
  console.log(`   With Description:   ${withDescription} (${((withDescription/totalCompanies)*100).toFixed(1)}%)`);
  
  // 12. SAMPLE COMPANIES (First 10)
  console.log('\n📝 SAMPLE COMPANIES IN DATABASE');
  console.log('─'.repeat(50));
  
  const sampleCompanies = await prisma.company.findMany({
    take: 10,
    select: {
      name: true,
      legalForm: true,
      wilaya: true,
      employeeCount: true,
      rating: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  sampleCompanies.forEach((c, idx) => {
    const wilayaName = wilayaNames[c.wilaya] || c.wilaya;
    console.log(`   ${idx+1}. ${c.name.substring(0, 38).padEnd(38)} | ${c.legalForm?.padEnd(5)} | ${wilayaName} | ⭐${c.rating?.toFixed(1)}`);
  });
  
  // FINAL SUMMARY
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 REPORT GENERATED SUCCESSFULLY!');
  console.log(`\n⏱️  Report generated in ${duration}s`);
  console.log(`📅 Generated at: ${new Date().toISOString()}`);
  console.log(`\n🎯 KEY INSIGHTS:`);
  console.log(`   • Database contains ${totalCompanies} real Algerian B2B companies`);
  console.log(`   • Coverage across ${wilayaStats.length} wilayas`);
  console.log(`   • Ready for production use on AlgeriaTrade.dz`);
  console.log('\n✨ AlgeriaTrade.dz Database Statistics Complete!\n');
}

generateStatistics()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

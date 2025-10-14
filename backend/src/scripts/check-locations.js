const XLSX = require('xlsx');

const filePath = '../현장별실행내역서.xlsx';
const workbook = XLSX.readFile(filePath);

// 위치 키워드 목록
const locationKeywords = ['주방', '거실', '안방', '방', '화장실', '욕실', '베란다', '발코니', '현관', '복도', '드레스룸', '서재', '창고', '다용도실'];

let itemsWithLocation = [];
let allItems = new Set();

// 모든 시트 확인
for (let i = 0; i < Math.min(50, workbook.SheetNames.length); i++) {
  const sheet = workbook.Sheets[workbook.SheetNames[i]];
  const data = XLSX.utils.sheet_to_json(sheet, { range: 5 });

  data.forEach(row => {
    const itemName = row['공 종'];
    const remark = row['비고'];
    const amount = row['결제액'];

    if (itemName) {
      allItems.add(itemName);

      // 항목명에 위치 키워드 포함 여부
      const locationInName = locationKeywords.find(loc =>
        itemName.includes(loc) || itemName.includes(`(${loc})`) || itemName.includes(`[${loc}]`)
      );

      // 비고에 위치 키워드 포함 여부
      const locationInRemark = remark && locationKeywords.find(loc =>
        String(remark).includes(loc)
      );

      if (locationInName || locationInRemark) {
        itemsWithLocation.push({
          sheet: workbook.SheetNames[i],
          itemName: itemName,
          remark: remark,
          amount: amount,
          locationInName: locationInName,
          locationInRemark: locationInRemark
        });
      }
    }
  });
}

console.log(`📊 전체 고유 항목 개수: ${allItems.size}개`);
console.log(`📍 위치 정보가 있는 항목: ${itemsWithLocation.length}개\n`);

console.log('📋 위치 정보 포함된 항목들 (처음 30개):');
itemsWithLocation.slice(0, 30).forEach((item, i) => {
  console.log(`${i+1}. ${item.itemName}${item.remark ? ` (비고: ${item.remark})` : ''}`);
  if (item.locationInName) console.log(`   → 항목명에서 발견: "${item.locationInName}"`);
  if (item.locationInRemark) console.log(`   → 비고에서 발견: "${item.locationInRemark}"`);
});

// 위치별 빈도수
const locationCount = {};
itemsWithLocation.forEach(item => {
  const loc = item.locationInName || item.locationInRemark;
  locationCount[loc] = (locationCount[loc] || 0) + 1;
});

console.log('\n\n📊 위치별 빈도수:');
Object.entries(locationCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([loc, count]) => {
    console.log(`  ${loc}: ${count}건`);
  });

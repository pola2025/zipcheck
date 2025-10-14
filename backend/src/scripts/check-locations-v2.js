const XLSX = require('xlsx');

const filePath = '../현장별실행내역서.xlsx';
const workbook = XLSX.readFile(filePath);

// 위치 키워드와 제외 패턴
const locationPatterns = [
  { keyword: '주방', exclude: [] },
  { keyword: '거실', exclude: [] },
  { keyword: '안방', exclude: [] },
  { keyword: '화장실', exclude: [] },
  { keyword: '욕실', exclude: [] },
  { keyword: '베란다', exclude: [] },
  { keyword: '발코니', exclude: [] },
  { keyword: '현관', exclude: [] },
  { keyword: '복도', exclude: [] },
  { keyword: '드레스룸', exclude: [] },
  { keyword: '서재', exclude: [] },
  { keyword: '창고', exclude: [] },
  { keyword: '다용도실', exclude: [] },
  { keyword: '방', exclude: ['방수', '방문', '방충', '방음', '방범', '방열'] } // "방"은 제외 패턴 많음
];

function extractLocation(text) {
  if (!text) return null;

  for (const pattern of locationPatterns) {
    // 제외 패턴 체크
    if (pattern.exclude.some(ex => text.includes(ex))) {
      continue;
    }

    // 키워드 체크
    if (text.includes(pattern.keyword)) {
      return pattern.keyword;
    }
  }

  return null;
}

let itemsWithLocation = [];
let categoryLocationMap = new Map(); // 카테고리별 위치 그룹화

// 모든 시트 확인
for (let i = 0; i < workbook.SheetNames.length; i++) {
  const sheet = workbook.Sheets[workbook.SheetNames[i]];
  const data = XLSX.utils.sheet_to_json(sheet, { range: 5 });

  data.forEach(row => {
    const itemName = row['공 종'];
    const remark = row['비고'];
    const amount = row['결제액'];

    if (itemName && typeof itemName === 'string') {
      const locationInName = extractLocation(itemName);
      const locationInRemark = extractLocation(String(remark || ''));
      const location = locationInName || locationInRemark;

      if (location) {
        itemsWithLocation.push({
          sheet: workbook.SheetNames[i],
          itemName: itemName,
          remark: remark,
          amount: amount,
          location: location,
          source: locationInName ? 'name' : 'remark'
        });

        // 카테고리에서 위치 제거한 기본 항목명 추출
        let baseCategory = itemName;
        if (locationInName) {
          // "화장실기구" → "기구", "주방타일" → "타일"
          baseCategory = itemName.replace(location, '').trim();
        }

        const key = `${baseCategory}|${location}`;
        if (!categoryLocationMap.has(key)) {
          categoryLocationMap.set(key, { category: baseCategory, location: location, count: 0, amounts: [] });
        }
        const entry = categoryLocationMap.get(key);
        entry.count++;
        if (typeof amount === 'number') {
          entry.amounts.push(amount);
        }
      }
    }
  });
}

console.log(`📊 전체 시트: ${workbook.SheetNames.length}개`);
console.log(`📍 위치 정보가 있는 항목: ${itemsWithLocation.length}개\n`);

console.log('📋 위치 정보 포함된 항목들 (처음 40개):');
itemsWithLocation.slice(0, 40).forEach((item, i) => {
  console.log(`${i+1}. ${item.itemName} → [${item.location}]${item.remark ? ` (비고: ${item.remark})` : ''}`);
});

// 위치별 빈도수
const locationCount = {};
itemsWithLocation.forEach(item => {
  locationCount[item.location] = (locationCount[item.location] || 0) + 1;
});

console.log('\n\n📊 위치별 빈도수:');
Object.entries(locationCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([loc, count]) => {
    console.log(`  ${loc}: ${count}건`);
  });

// 카테고리-위치 조합 통계
console.log('\n\n📊 카테고리-위치 조합 통계 (데이터 5건 이상):');
Array.from(categoryLocationMap.entries())
  .filter(([key, data]) => data.count >= 5)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 20)
  .forEach(([key, data]) => {
    const avg = data.amounts.length > 0
      ? Math.round(data.amounts.reduce((sum, a) => sum + a, 0) / data.amounts.length)
      : 0;
    console.log(`  ${data.category} - ${data.location}: ${data.count}건, 평균 ${avg.toLocaleString()}원`);
  });

const { pool } = require('../../dist/lib/db.js');

// 위치 추출 함수
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
  { keyword: '방', exclude: ['방수', '방문', '방충', '방음', '방범', '방열'] }
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

function extractBaseName(itemName, location) {
  if (!location) return itemName;
  return itemName.replace(location, '').trim();
}

async function updateLocations() {
  try {
    console.log('📊 Fetching all construction records...');

    // 모든 레코드 가져오기
    const records = await pool.query(`
      SELECT cr.id, cr.raw_data, i.id as item_id, i.name as item_name
      FROM construction_records cr
      JOIN items i ON i.id = cr.item_id
    `);

    console.log(`총 ${records.rows.length}개 레코드 처리 시작...\n`);

    let updatedRecords = 0;
    let updatedItems = new Map(); // item_id -> { base_name, location }

    for (const record of records.rows) {
      const itemName = record.item_name;

      // 항목명에서 위치 추출
      const location = extractLocation(itemName);

      if (location) {
        // construction_records 업데이트
        await pool.query(`
          UPDATE construction_records
          SET location = $1
          WHERE id = $2
        `, [location, record.id]);

        updatedRecords++;

        // items의 base_name 업데이트 (중복 방지)
        if (!updatedItems.has(record.item_id)) {
          const baseName = extractBaseName(itemName, location);
          await pool.query(`
            UPDATE items
            SET base_name = $1
            WHERE id = $2
          `, [baseName, record.item_id]);

          updatedItems.set(record.item_id, { baseName, location });
        }

        if (updatedRecords % 50 === 0) {
          console.log(`  진행 중... ${updatedRecords}개 업데이트 완료`);
        }
      }
    }

    console.log(`\n✅ 완료!`);
    console.log(`  - Construction Records 업데이트: ${updatedRecords}개`);
    console.log(`  - Items base_name 업데이트: ${updatedItems.size}개`);

    // 통계 확인
    const stats = await pool.query(`
      SELECT location, COUNT(*) as count
      FROM construction_records
      WHERE location IS NOT NULL
      GROUP BY location
      ORDER BY count DESC
    `);

    console.log('\n📊 위치별 레코드 개수:');
    stats.rows.forEach(row => {
      console.log(`  ${row.location}: ${row.count}개`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

updateLocations();

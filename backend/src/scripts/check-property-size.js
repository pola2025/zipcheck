const { pool } = require('../../dist/lib/db.js');

async function checkPropertySize() {
  try {
    // property_size가 있는 레코드 확인
    const withSize = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(property_size) as with_size,
        COUNT(*) - COUNT(property_size) as without_size
      FROM construction_records
    `);

    console.log('📊 Property Size 데이터:');
    console.log(`  - 전체 레코드: ${withSize.rows[0].total}개`);
    console.log(`  - property_size 있음: ${withSize.rows[0].with_size}개`);
    console.log(`  - property_size 없음: ${withSize.rows[0].without_size}개`);

    // property_size 샘플 확인
    const samples = await pool.query(`
      SELECT
        cr.id,
        i.name as item_name,
        cr.total_cost,
        cr.property_size,
        cr.property_type,
        CASE
          WHEN cr.property_size > 0 THEN ROUND(cr.total_cost / cr.property_size)
          ELSE NULL
        END as price_per_pyeong
      FROM construction_records cr
      JOIN items i ON i.id = cr.item_id
      WHERE cr.property_size IS NOT NULL
        AND cr.property_size > 0
        AND cr.total_cost > 0
      LIMIT 10
    `);

    console.log('\n📋 평수 있는 레코드 샘플:');
    samples.rows.forEach(row => {
      console.log(`  ${row.item_name}: ${row.total_cost.toLocaleString()}원 / ${row.property_size}평 = 평당 ${(row.price_per_pyeong || 0).toLocaleString()}원`);
    });

    // 항목별 평당 가격 통계
    const stats = await pool.query(`
      SELECT
        i.name as item_name,
        COUNT(*) as record_count,
        ROUND(AVG(cr.total_cost / NULLIF(cr.property_size, 0))) as avg_price_per_pyeong,
        MIN(cr.property_size) as min_size,
        MAX(cr.property_size) as max_size
      FROM construction_records cr
      JOIN items i ON i.id = cr.item_id
      WHERE cr.property_size IS NOT NULL
        AND cr.property_size > 0
        AND cr.total_cost > 0
      GROUP BY i.name
      HAVING COUNT(*) >= 5
      ORDER BY COUNT(*) DESC
      LIMIT 15
    `);

    console.log('\n📊 항목별 평당 단가 (데이터 5건 이상):');
    stats.rows.forEach(row => {
      console.log(`  ${row.item_name}: 평당 평균 ${(row.avg_price_per_pyeong || 0).toLocaleString()}원 (${row.record_count}건, ${row.min_size}~${row.max_size}평)`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkPropertySize();

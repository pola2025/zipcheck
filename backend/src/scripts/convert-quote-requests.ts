/**
 * quote-requests.ts 파일의 Supabase → PostgreSQL 변환 스크립트
 * 이 스크립트는 자동 변환된 코드를 생성합니다
 */

// 변환이 필요한 패턴들:
const conversions = `
1. INSERT (Line 245-263):
   OLD: const { data, error } = await supabase.from('quote_requests').insert({...}).select().single()
   NEW: const data = await insertOne<any>('quote_requests', {...})

2. SELECT by phone (Line 304-308):
   OLD: const { data, error } = await supabase.from('quote_requests').select('*').eq('customer_phone', phone).order('created_at', { ascending: false })
   NEW: const result = await query('SELECT * FROM quote_requests WHERE customer_phone = $1 ORDER BY created_at DESC', [phone])

3. SELECT user (Line 333-337):
   OLD: const { data: userData, error: userError } = await supabase.from('users').select('phone, email').eq('id', userId).single()
   NEW: const userData = await findOne<any>('users', { id: userId })

4. SELECT with OR (Line 344-355):
   OLD: Complex OR query
   NEW: Direct SQL with OR condition

5. SELECT by id (Line 377-381):
   OLD: const { data, error } = await supabase.from('quote_requests').select('*').eq('id', id).single()
   NEW: const data = await findOne<any>('quote_requests', { id })

6. SELECT all with pagination (Line 415-426):
   OLD: Complex Supabase query with count
   NEW: Two queries: SELECT + COUNT

7-14: Similar patterns for UPDATE and DELETE
`

console.log(conversions)
console.log('\n✅ 이 스크립트는 참고용입니다.')
console.log('실제 변환은 수동으로 진행해야 합니다.\n')

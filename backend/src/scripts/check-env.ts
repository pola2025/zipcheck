import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

console.log('환경변수 확인:')
const slackEnabled = process.env.ENABLE_SLACK_NOTIFICATIONS === 'true'
const mask = (value?: string) => {
	if (!value) return '없음'
	if (value.length <= 8) return '***'
	return `${value.slice(0, 4)}***${value.slice(-4)}`
}

console.log('ENABLE_SLACK_NOTIFICATIONS:', slackEnabled ? '활성화' : '비활성화')
console.log('DEV_WEBHOOK:', process.env.SLACK_DEV_WEBHOOK_URL ? '✅ 설정됨' : '❌ 없음')
console.log('ADMIN_WEBHOOK:', process.env.SLACK_ADMIN_WEBHOOK_URL ? '✅ 설정됨' : '❌ 없음')
console.log('\n마스킹된 값:')
if (!slackEnabled) {
	console.log('Slack notifications disabled → webhook 값은 사용되지 않습니다.')
} else {
	console.log('DEV:', mask(process.env.SLACK_DEV_WEBHOOK_URL))
	console.log('ADMIN:', mask(process.env.SLACK_ADMIN_WEBHOOK_URL))
}

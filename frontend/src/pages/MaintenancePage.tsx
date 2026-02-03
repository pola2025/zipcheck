import { Home, Mail, Phone } from 'lucide-react'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'

interface MaintenancePageProps {
	errorCode?: 404 | 403 | 500
	message?: string
}

export default function MaintenancePage({
	errorCode = 500,
	message = '집첵 서비스 점검중입니다. 점검 완료 후 서비스 예정입니다.'
}: MaintenancePageProps) {
	const errorMessages: Record<number, string> = {
		404: '페이지를 찾을 수 없습니다',
		403: '접근 권한이 없습니다',
		500: '서버 오류가 발생했습니다'
	}

	const defaultMessage = errorMessages[errorCode] || message

	return (
		<div className="min-h-screen bg-sand-50">
			<NordicNavigation />

			{/* Content */}
			<div className="flex items-center justify-center min-h-screen px-5 py-32">
				<div className="max-w-2xl mx-auto text-center">
					{/* Error Code */}
					{errorCode && (
						<h1 className="font-outfit text-[120px] md:text-[180px] font-bold text-forest-600/20 leading-none mb-2">
							{errorCode}
						</h1>
					)}

					{/* Main Message Card */}
					<div className="nordic-card rounded-2xl p-10 md:p-14">
						<h2 className="text-2xl md:text-3xl font-bold text-sand-900 mb-4">
							{defaultMessage}
						</h2>

						<p className="text-base md:text-lg text-sand-500 mb-8 leading-relaxed">
							{message !== defaultMessage && message}
							{!message && errorCode === 404 && (
								<span>요청하신 페이지를 찾을 수 없습니다.<br />URL을 확인해주세요.</span>
							)}
							{!message && errorCode === 403 && (
								<span>이 페이지에 접근할 권한이 없습니다.<br />로그인이 필요하거나 권한이 제한되었습니다.</span>
							)}
							{!message && errorCode === 500 && (
								<span>현재 서비스 점검 중입니다.<br />빠른 시일 내에 정상화하겠습니다.</span>
							)}
						</p>

						{/* Back Button */}
						<button
							onClick={() => window.location.href = '/'}
							className="px-8 py-4 bg-forest-600 text-white hover:bg-forest-700 rounded-xl font-semibold text-lg transition-all inline-flex items-center gap-3 shadow-lg shadow-forest-600/15"
						>
							<Home className="w-5 h-5" />
							홈으로 돌아가기
						</button>

						{/* Contact Info */}
						<div className="mt-10 pt-6 border-t border-sand-200">
							<p className="text-sm text-sand-400 mb-4">
								문제가 지속되면 고객센터로 문의해주세요
							</p>
							<div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-forest-600">
								<a
									href="mailto:zipcheck2025@gmail.com"
									className="hover:text-forest-700 transition-colors flex items-center gap-2 text-sm"
								>
									<Mail className="w-4 h-4" />
									zipcheck2025@gmail.com
								</a>
								<span className="hidden sm:inline text-sand-300">|</span>
								<a
									href="tel:032-345-9834"
									className="hover:text-forest-700 transition-colors flex items-center gap-2 text-sm"
								>
									<Phone className="w-4 h-4" />
									032-345-9834
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>

			<NordicFooter />
		</div>
	)
}

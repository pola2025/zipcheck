import { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '../ui/dialog'

type LegalType = 'privacy' | 'terms' | null

export default function NordicFooter() {
	const [openLegal, setOpenLegal] = useState<LegalType>(null)

	return (
		<>
			<footer className="bg-sand-900 text-white py-16">
				<div className="max-w-7xl mx-auto px-8">
					<div className="grid md:grid-cols-4 gap-12">
						<div className="md:col-span-2">
							<div className="mb-4">
								<img src="/logo_white.png" alt="집첵" className="h-7 w-auto" />
							</div>
							<p className="text-sand-500 text-sm leading-relaxed max-w-sm">
								인테리어 견적, 데이터로 편안하게. 3,000건의 실제 시공·유통 데이터를 기반으로
								당신의 견적서를 분석합니다.
							</p>
						</div>

						<div>
							<h4 className="font-semibold text-sm mb-4 text-sand-400">서비스</h4>
							<ul className="space-y-2 text-sm text-sand-500">
								<li>
									<a href="/plan-selection" className="hover:text-white transition">
										견적 분석 신청
									</a>
								</li>
								<li>
									<a href="#examples" className="hover:text-white transition">
										분석 예시
									</a>
								</li>
								<li>
									<a href="#pricing" className="hover:text-white transition">
										이용 요금
									</a>
								</li>
								<li>
									<a href="/community" className="hover:text-white transition">
										커뮤니티
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h4 className="font-semibold text-sm mb-4 text-sand-400">고객 지원</h4>
							<ul className="space-y-2 text-sm text-sand-500">
								<li>zipcheck2025@gmail.com</li>
								<li>032-345-9834</li>
							</ul>
						</div>
					</div>

					<div className="mt-12 pt-8 border-t border-white/10 text-xs text-sand-600">
						<p>polarad | 대표: 이재호 | 사업자등록번호: 808-03-00327</p>
						<p className="mt-1">
							서울시 금천구 가산디지털2로 98, 2동 11층 1107호(가산동, IT캐슬)
						</p>
						<div className="mt-3 flex items-center gap-3">
							<button
								onClick={() => setOpenLegal('privacy')}
								className="text-sand-500 hover:text-white transition underline underline-offset-2"
							>
								개인정보처리방침
							</button>
							<span className="text-sand-700">|</span>
							<button
								onClick={() => setOpenLegal('terms')}
								className="text-sand-500 hover:text-white transition underline underline-offset-2"
							>
								이용약관
							</button>
						</div>
						<p className="mt-2 text-sand-700">&copy; 2025 ZipCheck. All rights reserved.</p>
					</div>
				</div>
			</footer>

			<Dialog open={openLegal !== null} onOpenChange={(open) => !open && setOpenLegal(null)}>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white text-neutral-800">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold">
							{openLegal === 'privacy' ? '개인정보처리방침' : '이용약관'}
						</DialogTitle>
					</DialogHeader>
					<div className="text-sm leading-relaxed space-y-6 pr-2">
						{openLegal === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}

function PrivacyPolicy() {
	return (
		<>
			<Section title="제1조 (목적)">
				<p>
					집첵(이하 "회사")은 개인정보보호법, 정보통신망법 등 관련 법령을 준수하며
					이용자의 개인정보를 안전하게 보호하기 위해 최선을 다합니다.
				</p>
			</Section>

			<Section title="제2조 (수집하는 개인정보 항목 및 방법)">
				<p className="font-medium mb-1">1. 필수 수집 항목</p>
				<ul className="list-disc pl-5 space-y-1">
					<li>회원 가입: 이름, 이메일, 휴대전화 번호</li>
					<li>소셜 로그인(Google): 이메일, 프로필 이름</li>
					<li>서비스 이용: 견적서 업로드 데이터, 분석 요청 기록</li>
					<li>결제: PG사 거래 ID, 결제·환불 내역</li>
				</ul>
				<p className="font-medium mt-3 mb-1">2. 자동 수집 항목</p>
				<ul className="list-disc pl-5 space-y-1">
					<li>접속 IP, 브라우저 유형, 접속 일시, 서비스 이용 기록</li>
				</ul>
			</Section>

			<Section title="제3조 (개인정보의 이용 목적)">
				<ol className="list-decimal pl-5 space-y-1">
					<li>견적 분석 서비스 제공 및 리포트 발송</li>
					<li>회원 관리, 본인 확인, 서비스 관련 공지</li>
					<li>서비스 개선을 위한 통계 분석</li>
					<li>고객 문의 응대 및 분쟁 해결</li>
				</ol>
			</Section>

			<Section title="제4조 (개인정보의 보유 및 이용 기간)">
				<ol className="list-decimal pl-5 space-y-1">
					<li>회원 탈퇴 시 지체 없이 파기합니다. 단, 관련 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 보관합니다.</li>
					<li>전자상거래법에 따른 보존: 계약·청약철회 기록 5년, 결제 기록 5년, 소비자 불만 처리 기록 3년</li>
				</ol>
			</Section>

			<Section title="제5조 (개인정보의 제3자 제공)">
				<p>
					회사는 이용자의 사전 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
					다만, 법령에 의해 요구되는 경우는 예외로 합니다.
				</p>
			</Section>

			<Section title="제6조 (개인정보 처리 위탁)">
				<ul className="list-disc pl-5 space-y-1">
					<li>결제 처리: 토스페이먼츠 등 PG사</li>
					<li>클라우드 서버: Cloudflare, Neon Database</li>
					<li>이메일 발송: Gmail API</li>
				</ul>
			</Section>

			<Section title="제7조 (이용자의 권리와 행사 방법)">
				<ol className="list-decimal pl-5 space-y-1">
					<li>이용자는 언제든지 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다.</li>
					<li>동의 철회(회원 탈퇴) 시 개인정보를 지체 없이 파기합니다.</li>
					<li>요청은 이메일(zipcheck2025@gmail.com) 또는 웹사이트 내 설정을 통해 가능합니다.</li>
				</ol>
			</Section>

			<Section title="제8조 (개인정보의 파기)">
				<ol className="list-decimal pl-5 space-y-1">
					<li>파기 시점: 보유 기간 경과 후 또는 처리 목적 달성 후 지체 없이 파기합니다.</li>
					<li>파기 방법: 전자적 파일은 복구 불가능한 방법으로 삭제하며, 종이 문서는 분쇄합니다.</li>
				</ol>
			</Section>

			<Section title="제9조 (개인정보의 안전성 확보 조치)">
				<ul className="list-disc pl-5 space-y-1">
					<li>기술적 조치: 비밀번호 암호화, 접근 통제, 침입 탐지 시스템</li>
					<li>관리적 조치: 최소 권한 원칙, 접근 기록 모니터링</li>
				</ul>
			</Section>

			<Section title="제10조 (개인정보 보호책임자)">
				<ul className="list-none space-y-1">
					<li>개인정보 보호책임자: 이재호</li>
					<li>연락처: 032-345-9834</li>
					<li>이메일: zipcheck2025@gmail.com</li>
				</ul>
			</Section>

			<Section title="제11조 (권익침해 구제 방법)">
				<p>
					이용자는 개인정보 침해에 대한 신고나 상담이 필요한 경우
					개인정보침해신고센터(privacy.kisa.or.kr, 118),
					대검찰청 사이버수사과(spo.go.kr, 1301),
					경찰청 사이버안전국(cyberbureau.police.go.kr, 182)에
					문의할 수 있습니다.
				</p>
			</Section>

			<Section title="제12조 (시행일)">
				<p>이 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.</p>
			</Section>
		</>
	)
}

function TermsOfService() {
	return (
		<>
			<Section title="제1조 (목적)">
				<p>
					이 약관은 집첵(이하 "회사")이 제공하는 견적 분석 서비스(이하 "서비스")의 이용에 있어
					회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
				</p>
			</Section>

			<Section title="제2조 (정의)">
				<ol className="list-decimal pl-5 space-y-1">
					<li>"서비스"란 이용자가 업로드한 인테리어 견적서를 AI 및 데이터 분석을 통해 리포트 형태로 제공하는 견적 분석 서비스입니다.</li>
					<li>"이용자"란 이 약관에 따라 서비스를 이용하는 개인 또는 법인을 의미합니다.</li>
					<li>"리포트"란 AI 분석 결과와 상세 코멘트가 포함된 결과 자료 및 PDF를 의미합니다.</li>
				</ol>
			</Section>

			<Section title="제3조 (약관의 게시와 개정)">
				<ol className="list-decimal pl-5 space-y-1">
					<li>회사는 이 약관의 내용을 서비스 초기 화면 또는 연결 화면에 게시합니다.</li>
					<li>회사는 관련 법령에 위배되지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일 최소 7일 전에 공지합니다.</li>
					<li>이용자가 개정 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
				</ol>
			</Section>

			<Section title="제4조 (서비스의 제공 및 변경)">
				<ol className="list-decimal pl-5 space-y-1">
					<li>회사는 견적서 업로드, AI 데이터 기반 분석, 리포트 생성 서비스를 제공합니다.</li>
					<li>회사는 운영상, 기술상 필요에 따라 서비스를 변경할 수 있으며, 사전에 공지합니다.</li>
				</ol>
			</Section>

			<Section title="제5조 (이용 신청의 제한)">
				<p>회사는 다음 각 호에 해당하는 신청에 대해 승낙을 거절할 수 있습니다.</p>
				<ol className="list-decimal pl-5 space-y-1">
					<li>타인의 명의로 신청한 경우</li>
					<li>허위 정보를 입력한 경우</li>
					<li>기타 서비스 운영에 지장을 초래하는 경우</li>
				</ol>
			</Section>

			<Section title="제6조 (이용자의 의무)">
				<p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
				<ol className="list-decimal pl-5 space-y-1">
					<li>허위 또는 저작물 침해 견적서 업로드</li>
					<li>분석 리포트의 무단 재배포 또는 상업적 이용</li>
					<li>서비스 시스템에 대한 해킹, 스크래핑 등 부정한 접근</li>
				</ol>
			</Section>

			<Section title="제7조 (결제 및 요금)">
				<ol className="list-decimal pl-5 space-y-1">
					<li>서비스는 플랜(Standard, Express, Urgent 등)에 따라 요금이 상이합니다.</li>
					<li>결제는 PG사(토스페이먼츠 등)를 통해 처리되며, 결제 수수료는 이용자가 부담합니다.</li>
				</ol>
			</Section>

			<Section title="제8조 (리포트 제공 및 환불)">
				<ol className="list-decimal pl-5 space-y-1">
					<li>리포트가 발송된 이후에는 분석 자료의 특성상 환불이 불가합니다.</li>
					<li>이용자는 리포트 내용에 이의가 있는 경우 수령일로부터 7일 이내에 재검토를 요청할 수 있습니다.</li>
					<li>회사 귀책 사유로 서비스 제공이 불가한 경우 전액 환불합니다.</li>
				</ol>
			</Section>

			<Section title="제9조 (휴면 계정 및 서비스 해지)">
				<ol className="list-decimal pl-5 space-y-1">
					<li>이용자가 12개월 이상 서비스를 이용하지 않는 경우 회사는 휴면 계정으로 전환할 수 있습니다.</li>
					<li>이용자는 언제든지 탈퇴를 요청하여 서비스 이용을 종료할 수 있습니다.</li>
				</ol>
			</Section>

			<Section title="제10조 (개인정보 보호)">
				<p>
					회사는 관련 법령 및 개인정보처리방침에 따라 이용자의 개인정보를 보호하며,
					자세한 사항은 개인정보처리방침에서 확인할 수 있습니다.
				</p>
			</Section>

			<Section title="제11조 (면책)">
				<ol className="list-decimal pl-5 space-y-1">
					<li>회사는 천재지변, 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
					<li>분석 리포트는 참고 자료이며, 이를 기반으로 한 의사결정의 결과에 대해 회사는 법적 책임을 지지 않습니다.</li>
					<li>이용자가 약관을 위반하여 회사 또는 제3자에게 손해를 끼친 경우 이용자가 배상해야 합니다.</li>
				</ol>
			</Section>

			<Section title="제12조 (분쟁 해결)">
				<ol className="list-decimal pl-5 space-y-1">
					<li>회사와 이용자 간 분쟁은 상호 협의하여 해결하기 위해 노력합니다.</li>
					<li>협의가 이루어지지 않는 경우 회사 소재지 관할 법원을 제1심 관할 법원으로 합니다.</li>
				</ol>
			</Section>

			<Section title="부칙">
				<p>이 약관은 2025년 1월 1일부터 시행됩니다.</p>
			</Section>
		</>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div>
			<h3 className="font-semibold text-neutral-900 mb-2">{title}</h3>
			<div className="text-neutral-600">{children}</div>
		</div>
	)
}

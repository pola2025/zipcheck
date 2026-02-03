import { NordicFooter } from '../../components/nordic'

export default function PrivacyPolicyPage() {
	return (
		<>
			<div className="min-h-screen bg-white">
				<div className="max-w-3xl mx-auto px-6 py-16">
					<h1 className="text-2xl font-bold text-neutral-900 mb-2">개인정보처리방침</h1>
					<p className="text-sm text-neutral-400 mb-10">시행일: 2025년 1월 1일</p>

					<div className="space-y-8 text-sm leading-relaxed text-neutral-700">
						<Section title="제1조 (목적)">
							<p>
								집첵(이하 "회사")은 개인정보보호법, 정보통신망법 등 관련 법령을 준수하며
								이용자의 개인정보를 안전하게 보호하기 위해 최선을 다합니다.
							</p>
						</Section>

						<Section title="제2조 (수집하는 개인정보 항목 및 방법)">
							<p className="font-medium text-neutral-900 mb-1">1. 필수 수집 항목</p>
							<ul className="list-disc pl-5 space-y-1">
								<li>회원 가입: 이름, 이메일, 휴대전화 번호</li>
								<li>소셜 로그인(Google): 이메일, 프로필 이름</li>
								<li>서비스 이용: 견적서 업로드 데이터, 분석 요청 기록</li>
								<li>결제: PG사 거래 ID, 결제·환불 내역</li>
							</ul>
							<p className="font-medium text-neutral-900 mt-3 mb-1">2. 자동 수집 항목</p>
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
					</div>
				</div>
			</div>
			<NordicFooter />
		</>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div>
			<h3 className="font-semibold text-neutral-900 mb-2">{title}</h3>
			<div>{children}</div>
		</div>
	)
}

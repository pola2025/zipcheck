import { NordicNavigation, NordicFooter } from '../../components/nordic'

export default function TermsOfServicePage() {
	return (
		<>
			<NordicNavigation />
			<div className="min-h-screen bg-white">
				<div className="max-w-3xl mx-auto px-6 pt-28 pb-16">
					<h1 className="text-2xl font-bold text-neutral-900 mb-2">이용약관</h1>
					<p className="text-sm text-neutral-400 mb-10">시행일: 2025년 1월 1일</p>

					<div className="space-y-8 text-sm leading-relaxed text-neutral-700">
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

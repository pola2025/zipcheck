import { Shield, AlertTriangle } from 'lucide-react'

interface LegalDisclaimerProps {
	agreed: boolean
	onAgreeChange: (agreed: boolean) => void
	/** Header title – defaults to "등록 주의사항" */
	title?: string
}

const DISCLAIMER_ITEMS = [
	'본 게시물에 기재된 내용은 작성자 개인의 주관적 경험 및 의견이며, 집첵의 공식 입장이나 서비스 의견과는 무관합니다.',
	'본 게시물의 모든 내용에 대한 법적 책임은 작성자 본인에게 있습니다.',
	'제목 또는 본문에 업체명·연락처(전화번호, 이메일 등)를 직접 공개하면 해당 글은 즉시 비공개 처리됩니다.',
	'집첵은 게시물의 사실 여부를 보증하지 않으며, 정보통신망법 제44조의2에 따른 임시조치(게시물 접근차단) 요청이 있을 경우 해당 절차를 진행합니다.',
	'타인의 명예를 훼손하거나 허위사실을 유포하는 경우 형법 제307조(명예훼손) 및 정보통신망법 제70조에 따라 법적 처벌을 받을 수 있습니다.',
	'권리침해를 주장하는 자의 게재제한 요청 시, 작성자에게 소명 기회를 부여하며 30일 이내 소명이 없을 경우 게시물이 비공개 처리됩니다.',
	'작성자의 IP 주소는 법적 분쟁 해결을 위해 기록되며, 관련 법령에 따라 수사기관 또는 법원의 요청 시 제공될 수 있습니다.',
] as const

export default function LegalDisclaimer({
	agreed,
	onAgreeChange,
	title = '등록 주의사항',
}: LegalDisclaimerProps) {
	return (
		<div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
			{/* Header */}
			<div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
				<Shield className="w-5 h-5 text-amber-600 shrink-0" />
				<h4 className="text-sm font-bold text-amber-800">[{title}]</h4>
			</div>

			{/* Scrollable legal text */}
			<div
				className="mx-5 mb-4 max-h-[200px] overflow-y-auto border border-amber-200/60 rounded-lg bg-white/60 p-4"
				tabIndex={0}
				role="region"
				aria-label={`${title} 내용`}
			>
				<ol className="space-y-3">
					{DISCLAIMER_ITEMS.map((item, idx) => (
						<li
							key={idx}
							className="text-xs text-amber-800 leading-relaxed flex gap-2"
						>
							<span className="text-amber-500 font-semibold shrink-0">
								{idx + 1}.
							</span>
							<span>{item}</span>
						</li>
					))}
				</ol>
			</div>

			{/* Warning banner */}
			<div className="mx-5 mb-4 flex items-start gap-2 bg-amber-100/80 border border-amber-300/50 rounded-lg px-3.5 py-2.5">
				<AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
				<p className="text-[11px] text-amber-700 leading-relaxed">
					허위 사실 작성 시 민·형사상 법적 책임이 발생할 수 있습니다. 사실에
					기반하여 작성해 주세요.
				</p>
			</div>

			{/* Checkbox agreement */}
			<div className="px-5 pb-5">
				<label className="flex items-start gap-3 cursor-pointer group min-h-[44px] py-1">
					<input
						type="checkbox"
						checked={agreed}
						onChange={(e) => onAgreeChange(e.target.checked)}
						className="mt-0.5 w-4 h-4 min-w-[16px] text-[#0A9DAA] border-gray-300 rounded focus:ring-[#0A9DAA] focus:ring-2 cursor-pointer accent-[#0A9DAA]"
						aria-describedby="legal-disclaimer-label"
					/>
					<span
						id="legal-disclaimer-label"
						className={`text-sm font-medium transition-colors select-none ${
							agreed
								? 'text-[#0A9DAA]'
								: 'text-gray-600 group-hover:text-gray-800'
						}`}
					>
						위 내용을 모두 확인하였으며 동의합니다.{' '}
						<span className="text-red-500 font-semibold">(필수)</span>
					</span>
				</label>
			</div>
		</div>
	)
}

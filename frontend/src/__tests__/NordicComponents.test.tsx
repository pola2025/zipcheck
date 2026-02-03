import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import SectionLabel from 'components/nordic/SectionLabel'
import NordicNavigation from 'components/nordic/NordicNavigation'
import NordicFooter from 'components/nordic/NordicFooter'
import NordicHero from 'components/nordic/NordicHero'
import ConceptGallery from 'components/nordic/ConceptGallery'
import WhyZipCheck from 'components/nordic/WhyZipCheck'
import QuoteExampleBanner from 'components/nordic/QuoteExampleBanner'
import ProcessSteps from 'components/nordic/ProcessSteps'
import StyleStrip from 'components/nordic/StyleStrip'
import NordicPricing from 'components/nordic/NordicPricing'
import CtaBanner from 'components/nordic/CtaBanner'

function withRouter(ui: React.ReactElement) {
	return render(ui, { wrapper: BrowserRouter })
}

// ── SectionLabel ──
describe('SectionLabel', () => {
	it('renders english label and korean title', () => {
		render(<SectionLabel label="Why ZipCheck" title="왜 견적 분석이 필요할까요" />)
		expect(screen.getByText('Why ZipCheck')).toBeInTheDocument()
		expect(screen.getByText('왜 견적 분석이 필요할까요')).toBeInTheDocument()
	})

	it('renders subtitle when provided', () => {
		render(
			<SectionLabel
				label="Pricing"
				title="분석 요금"
				subtitle="3만 원 투자로 수백만 원을 지켜요"
			/>
		)
		expect(screen.getByText('3만 원 투자로 수백만 원을 지켜요')).toBeInTheDocument()
	})

	it('applies center alignment when specified', () => {
		const { container } = render(
			<SectionLabel label="Test" title="테스트" align="center" />
		)
		expect(container.firstChild).toHaveClass('text-center')
	})
})

// ── NordicNavigation ──
describe('NordicNavigation', () => {
	it('renders ZipCheck logo image', () => {
		withRouter(<NordicNavigation />)
		expect(screen.getByAltText('집첵')).toBeInTheDocument()
	})

	it('renders navigation menu items', () => {
		withRouter(<NordicNavigation />)
		expect(screen.getByText('서비스')).toBeInTheDocument()
		expect(screen.getByText('분석 예시')).toBeInTheDocument()
		expect(screen.getByText('요금')).toBeInTheDocument()
	})

	it('renders CTA button', () => {
		withRouter(<NordicNavigation />)
		expect(screen.getByText('견적 분석 신청')).toBeInTheDocument()
	})
})

// ── NordicFooter ──
describe('NordicFooter', () => {
	it('renders company info', () => {
		withRouter(<NordicFooter />)
		expect(screen.getByText(/polarad/)).toBeInTheDocument()
		expect(screen.getByText(/808-03-00327/)).toBeInTheDocument()
	})

	it('renders contact info', () => {
		withRouter(<NordicFooter />)
		expect(screen.getByText('zipcheck2025@gmail.com')).toBeInTheDocument()
		expect(screen.getByText('032-345-9834')).toBeInTheDocument()
	})

	it('renders service links', () => {
		withRouter(<NordicFooter />)
		expect(screen.getByText('견적 분석 신청')).toBeInTheDocument()
		expect(screen.getByText('분석 예시')).toBeInTheDocument()
		expect(screen.getByText('이용 요금')).toBeInTheDocument()
	})
})

// ── NordicHero ──
describe('NordicHero', () => {
	it('renders main heading text', () => {
		withRouter(<NordicHero />)
		expect(screen.getByText(/인테리어 견적/)).toBeInTheDocument()
		expect(screen.getByText(/편안하게/)).toBeInTheDocument()
	})

	it('renders three stats', () => {
		withRouter(<NordicHero />)
		expect(screen.getByText('3,000')).toBeInTheDocument()
		expect(screen.getByText('48')).toBeInTheDocument()
		expect(screen.getByText('9.2')).toBeInTheDocument()
	})

	it('renders CTA buttons', () => {
		withRouter(<NordicHero />)
		expect(screen.getByText(/견적 분석 신청하기/)).toBeInTheDocument()
		expect(screen.getByText(/분석 예시 보기/)).toBeInTheDocument()
	})

	it('renders floating savings card', () => {
		withRouter(<NordicHero />)
		expect(screen.getByText('350만원')).toBeInTheDocument()
		expect(screen.getByText(/평균 절감액/)).toBeInTheDocument()
	})
})

// ── ConceptGallery ──
describe('ConceptGallery', () => {
	it('renders section heading', () => {
		render(<ConceptGallery />)
		expect(screen.getByText('이런 공간을 꿈꾸시나요?')).toBeInTheDocument()
	})

	it('renders all concept cards', () => {
		render(<ConceptGallery />)
		expect(screen.getByText('따뜻한 우드톤 리빙룸')).toBeInTheDocument()
		expect(screen.getByText('오픈형 주방')).toBeInTheDocument()
		expect(screen.getByText('편안한 침실')).toBeInTheDocument()
	})

	it('renders style badges', () => {
		render(<ConceptGallery />)
		expect(screen.getByText('모던 내추럴')).toBeInTheDocument()
		expect(screen.getByText('내추럴 키친')).toBeInTheDocument()
		expect(screen.getByText('스칸디나비안')).toBeInTheDocument()
	})
})

// ── WhyZipCheck ──
describe('WhyZipCheck', () => {
	it('renders section heading', () => {
		render(<WhyZipCheck />)
		expect(screen.getByText('왜 견적 분석이 필요할까요')).toBeInTheDocument()
	})

	it('renders four feature cards', () => {
		render(<WhyZipCheck />)
		expect(screen.getByText('실데이터 비교')).toBeInTheDocument()
		expect(screen.getByText('항목별 분석')).toBeInTheDocument()
		expect(screen.getByText('상세 코멘트')).toBeInTheDocument()
		expect(screen.getByText('투명한 리포트')).toBeInTheDocument()
	})
})

// ── QuoteExampleBanner ──
describe('QuoteExampleBanner', () => {
	it('renders section heading', () => {
		render(<QuoteExampleBanner />)
		expect(screen.getByText('실제 분석 예시')).toBeInTheDocument()
	})

	it('renders summary amounts', () => {
		render(<QuoteExampleBanner />)
		expect(screen.getByText('3,800')).toBeInTheDocument()
		expect(screen.getByText('3,450')).toBeInTheDocument()
		expect(screen.getByText('350')).toBeInTheDocument()
	})

	it('renders quote items', () => {
		render(<QuoteExampleBanner />)
		expect(screen.getByText('싱크대 교체')).toBeInTheDocument()
		expect(screen.getByText('타일 시공')).toBeInTheDocument()
		expect(screen.getByText('전기 배선')).toBeInTheDocument()
		expect(screen.getByText('도배 / 페인트')).toBeInTheDocument()
	})
})

// ── ProcessSteps ──
describe('ProcessSteps', () => {
	it('renders section heading', () => {
		render(<ProcessSteps />)
		expect(screen.getByText('간단한 3단계')).toBeInTheDocument()
	})

	it('renders all three steps with numbers', () => {
		render(<ProcessSteps />)
		expect(screen.getByText('01')).toBeInTheDocument()
		expect(screen.getByText('02')).toBeInTheDocument()
		expect(screen.getByText('03')).toBeInTheDocument()
	})

	it('renders step titles', () => {
		render(<ProcessSteps />)
		expect(screen.getByText('견적서 업로드')).toBeInTheDocument()
		expect(screen.getByText('유통망 기반 견적 분석')).toBeInTheDocument()
		expect(screen.getByText('리포트 전달')).toBeInTheDocument()
	})
})

// ── StyleStrip ──
describe('StyleStrip', () => {
	it('renders section heading', () => {
		render(<StyleStrip />)
		expect(screen.getByText('모든 스타일의 견적을 분석합니다')).toBeInTheDocument()
	})

	it('renders five style cards', () => {
		render(<StyleStrip />)
		expect(screen.getByText('모던 내추럴')).toBeInTheDocument()
		expect(screen.getByText('클래식 엘레강스')).toBeInTheDocument()
		expect(screen.getByText('스칸디나비안')).toBeInTheDocument()
		expect(screen.getByText('인더스트리얼')).toBeInTheDocument()
		expect(screen.getByText('모던 럭셔리')).toBeInTheDocument()
	})
})

// ── NordicPricing ──
describe('NordicPricing', () => {
	it('renders section heading', () => {
		render(<NordicPricing />)
		expect(screen.getByText('분석 요금')).toBeInTheDocument()
	})

	it('renders two plan cards with prices', () => {
		render(<NordicPricing />)
		expect(screen.getByText('기본 분석')).toBeInTheDocument()
		expect(screen.getByText('빠른 분석')).toBeInTheDocument()
		expect(screen.getByText(/30,000/)).toBeInTheDocument()
		expect(screen.getByText(/45,000/)).toBeInTheDocument()
	})

	it('renders recommended badge', () => {
		render(<NordicPricing />)
		expect(screen.getByText('추천')).toBeInTheDocument()
	})
})

// ── CtaBanner ──
describe('CtaBanner', () => {
	it('renders main heading', () => {
		withRouter(<CtaBanner />)
		expect(screen.getByText(/우리 집 인테리어/)).toBeInTheDocument()
		expect(screen.getByText(/제대로 시작하세요/)).toBeInTheDocument()
	})

	it('renders CTA button', () => {
		withRouter(<CtaBanner />)
		expect(screen.getByText(/지금 분석 신청하기/)).toBeInTheDocument()
	})
})

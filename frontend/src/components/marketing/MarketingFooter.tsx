import { Link } from 'react-router-dom'

export default function MarketingFooter() {
	return (
		<footer className='mt-20 border-t border-[hsla(var(--glass-border),0.18)] bg-[rgba(5,9,18,0.9)]'>
			<div className='container mx-auto grid gap-10 px-6 py-14 text-sm text-muted-foreground md:grid-cols-[2fr_1fr_1fr] md:px-10'>
				<div className='space-y-4'>
					<h3 className='text-base font-semibold text-foreground'>ZipCheck</h3>
					<p className='max-w-md leading-relaxed'>
						견적과 공사 관리를 하나의 워크플로로 연결해 주는 ZipCheck는 데이터 기반 리포트와 전문가 네트워크로 일정을 앞당깁니다.
					</p>
					<p className='text-xs text-muted-foreground'>사업자등록번호 000-00-00000 · 대표자 홍길동</p>
					<p className='text-xs text-muted-foreground'>
						문의: <a className='text-accent' href='mailto:contact@zipcheck.kr'>contact@zipcheck.kr</a> / 02-000-0000
					</p>
				</div>
				<div className='space-y-3'>
					<h4 className='text-sm font-semibold text-foreground'>바로가기</h4>
					<ul className='space-y-2'>
						<li>
							<Link to='/quote-request' className='neon-link hover:text-accent'>견적 요청</Link>
						</li>
						<li>
							<a className='neon-link hover:text-accent' href='/#pricing'>요금제</a>
						</li>
						<li>
							<Link to='/ai' className='neon-link hover:text-accent'>AI 워크스페이스</Link>
						</li>
					</ul>
				</div>
				<div className='space-y-3'>
					<h4 className='text-sm font-semibold text-foreground'>정책</h4>
					<ul className='space-y-2'>
						<li>
							<Link to='/legal/privacy' className='neon-link hover:text-accent'>개인정보 처리방침</Link>
						</li>
						<li>
							<Link to='/legal/terms' className='neon-link hover:text-accent'>서비스 이용약관</Link>
						</li>
						<li>
							<a className='neon-link hover:text-accent' href='mailto:legal@zipcheck.kr'>법률 문의</a>
						</li>
					</ul>
				</div>
			</div>
			<div className='border-t border-[hsla(var(--glass-border),0.14)] bg-[rgba(4,8,16,0.95)] px-6 py-4 text-center text-xs text-muted-foreground md:px-10'>
				© {new Date().getFullYear()} ZipCheck. All rights reserved.
			</div>
		</footer>
	)
}

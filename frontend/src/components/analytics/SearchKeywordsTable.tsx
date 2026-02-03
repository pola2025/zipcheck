interface SearchKeyword {
	query: string
	clicks: number
	impressions: number
	ctr: number
	position: number
}

interface SearchKeywordsTableProps {
	keywords: SearchKeyword[]
	totals?: {
		clicks: number
		impressions: number
		ctr: number
		position: number
	}
}

export default function SearchKeywordsTable({ keywords, totals }: SearchKeywordsTableProps) {
	return (
		<div className="bg-white rounded-2xl p-5 border border-sand-200">
			<h3 className="text-base font-semibold text-sand-900 mb-4">검색 키워드</h3>

			{totals && (
				<div className="grid grid-cols-4 gap-3 mb-4">
					<div className="text-center">
						<p className="text-xs text-sand-500">클릭</p>
						<p className="text-lg font-bold text-sand-900">{totals.clicks.toLocaleString()}</p>
					</div>
					<div className="text-center">
						<p className="text-xs text-sand-500">노출</p>
						<p className="text-lg font-bold text-sand-900">{totals.impressions.toLocaleString()}</p>
					</div>
					<div className="text-center">
						<p className="text-xs text-sand-500">CTR</p>
						<p className="text-lg font-bold text-sand-900">{(totals.ctr * 100).toFixed(1)}%</p>
					</div>
					<div className="text-center">
						<p className="text-xs text-sand-500">평균 순위</p>
						<p className="text-lg font-bold text-sand-900">{totals.position.toFixed(1)}</p>
					</div>
				</div>
			)}

			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-sand-200">
							<th className="text-left text-sand-500 py-2 pr-4">#</th>
							<th className="text-left text-sand-500 py-2 pr-4">키워드</th>
							<th className="text-right text-sand-500 py-2 pr-4">클릭</th>
							<th className="text-right text-sand-500 py-2 pr-4">노출</th>
							<th className="text-right text-sand-500 py-2 pr-4">CTR</th>
							<th className="text-right text-sand-500 py-2">순위</th>
						</tr>
					</thead>
					<tbody>
						{keywords.length === 0 ? (
							<tr>
								<td colSpan={6} className="text-center text-sand-400 py-8">
									검색 데이터가 없습니다
								</td>
							</tr>
						) : (
							keywords.slice(0, 15).map((kw, i) => (
								<tr key={kw.query} className="border-b border-sand-100 hover:bg-sand-50">
									<td className="py-2 pr-4 text-sand-400">{i + 1}</td>
									<td className="py-2 pr-4 text-sand-800 font-medium">{kw.query}</td>
									<td className="py-2 pr-4 text-right text-forest-600 font-medium">{kw.clicks}</td>
									<td className="py-2 pr-4 text-right text-sand-600">{kw.impressions.toLocaleString()}</td>
									<td className="py-2 pr-4 text-right text-forest-500">{(kw.ctr * 100).toFixed(1)}%</td>
									<td className="py-2 text-right text-wood-500">{kw.position.toFixed(1)}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}

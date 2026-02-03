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
		<div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700">
			<h3 className="text-lg font-semibold text-white mb-4">검색 키워드</h3>

			{totals && (
				<div className="grid grid-cols-4 gap-3 mb-4">
					<div className="text-center">
						<p className="text-xs text-gray-400">클릭</p>
						<p className="text-lg font-bold text-white">{totals.clicks.toLocaleString()}</p>
					</div>
					<div className="text-center">
						<p className="text-xs text-gray-400">노출</p>
						<p className="text-lg font-bold text-white">{totals.impressions.toLocaleString()}</p>
					</div>
					<div className="text-center">
						<p className="text-xs text-gray-400">CTR</p>
						<p className="text-lg font-bold text-white">{(totals.ctr * 100).toFixed(1)}%</p>
					</div>
					<div className="text-center">
						<p className="text-xs text-gray-400">평균 순위</p>
						<p className="text-lg font-bold text-white">{totals.position.toFixed(1)}</p>
					</div>
				</div>
			)}

			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-gray-700">
							<th className="text-left text-gray-400 py-2 pr-4">#</th>
							<th className="text-left text-gray-400 py-2 pr-4">키워드</th>
							<th className="text-right text-gray-400 py-2 pr-4">클릭</th>
							<th className="text-right text-gray-400 py-2 pr-4">노출</th>
							<th className="text-right text-gray-400 py-2 pr-4">CTR</th>
							<th className="text-right text-gray-400 py-2">순위</th>
						</tr>
					</thead>
					<tbody>
						{keywords.length === 0 ? (
							<tr>
								<td colSpan={6} className="text-center text-gray-500 py-8">
									검색 데이터가 없습니다
								</td>
							</tr>
						) : (
							keywords.slice(0, 15).map((kw, i) => (
								<tr key={kw.query} className="border-b border-gray-700/50 hover:bg-gray-700/20">
									<td className="py-2 pr-4 text-gray-500">{i + 1}</td>
									<td className="py-2 pr-4 text-gray-200 font-medium">{kw.query}</td>
									<td className="py-2 pr-4 text-right text-blue-400">{kw.clicks}</td>
									<td className="py-2 pr-4 text-right text-gray-300">{kw.impressions.toLocaleString()}</td>
									<td className="py-2 pr-4 text-right text-green-400">{(kw.ctr * 100).toFixed(1)}%</td>
									<td className="py-2 text-right text-orange-400">{kw.position.toFixed(1)}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}

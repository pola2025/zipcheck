interface TopPage {
	pagePath: string
	pageTitle: string
	views: number
	users: number
}

interface TopPagesTableProps {
	pages: TopPage[]
}

export default function TopPagesTable({ pages }: TopPagesTableProps) {
	return (
		<div className="bg-white rounded-2xl p-5 border border-sand-300">
			<h3 className="text-base font-semibold text-sand-900 mb-4">인기 페이지</h3>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-sand-300">
							<th className="text-left py-2 pr-4 text-sand-700 font-medium">페이지</th>
							<th className="text-right py-2 px-3 text-sand-700 font-medium">조회</th>
							<th className="text-right py-2 pl-3 text-sand-700 font-medium">사용자</th>
						</tr>
					</thead>
					<tbody>
						{pages.length === 0 ? (
							<tr>
								<td colSpan={3} className="text-center text-sand-600 py-8">
									페이지 데이터가 없습니다
								</td>
							</tr>
						) : (
							pages.slice(0, 10).map((page, i) => (
								<tr key={i} className="border-b border-sand-200">
									<td className="py-2.5 pr-4">
										<div className="text-sand-900 font-medium truncate max-w-[200px]" title={page.pagePath}>
											{page.pagePath}
										</div>
									</td>
									<td className="py-2.5 px-3 text-right text-sand-800 tabular-nums">
										{page.views.toLocaleString()}
									</td>
									<td className="py-2.5 pl-3 text-right text-sand-800 tabular-nums">
										{page.users.toLocaleString()}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}

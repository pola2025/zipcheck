import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface GeoItem {
	name: string
	users: number
	sessions: number
}

interface GeoChartProps {
	regions?: GeoItem[]
	cities: GeoItem[]
}

type TabKey = 'regions' | 'cities'

export default function GeoChart({ regions = [], cities }: GeoChartProps) {
	const [tab, setTab] = useState<TabKey>(regions.length > 0 ? 'regions' : 'cities')

	const data = tab === 'regions' ? regions : cities
	const title = tab === 'regions' ? '시/도' : '도시'

	return (
		<div className="bg-white rounded-2xl p-5 border border-sand-300">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-base font-semibold text-sand-900">접속 지역</h3>
				{regions.length > 0 && (
					<div className="flex gap-1 bg-sand-100 rounded-lg p-0.5">
						<button
							onClick={() => setTab('regions')}
							className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
								tab === 'regions'
									? 'bg-white text-forest-700 shadow-sm'
									: 'text-sand-600 hover:text-sand-800'
							}`}
						>
							시/도
						</button>
						<button
							onClick={() => setTab('cities')}
							className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
								tab === 'cities'
									? 'bg-white text-forest-700 shadow-sm'
									: 'text-sand-600 hover:text-sand-800'
							}`}
						>
							도시
						</button>
					</div>
				)}
			</div>
			{data.length === 0 ? (
				<div className="flex items-center justify-center h-[300px] text-sand-600 text-sm">
					{title} 데이터가 없습니다
				</div>
			) : (
				<ResponsiveContainer width="100%" height={300}>
					<BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="#EDEAE5" horizontal={false} />
						<XAxis type="number" tick={{ fill: '#6B6B6B', fontSize: 12 }} />
						<YAxis
							type="category"
							dataKey="name"
							tick={{ fill: '#3D3D3D', fontSize: 12 }}
							width={100}
						/>
						<Tooltip
							contentStyle={{ backgroundColor: '#fff', border: '1px solid #EDEAE5', borderRadius: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
							labelStyle={{ color: '#1A1A1A' }}
							itemStyle={{ color: '#6B6B6B' }}
						/>
						<Bar dataKey="users" name="사용자" fill="#A87B4F" radius={[0, 6, 6, 0]} barSize={20} />
					</BarChart>
				</ResponsiveContainer>
			)}
		</div>
	)
}

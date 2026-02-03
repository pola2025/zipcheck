import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState } from 'react'

interface GeoItem {
	name: string
	users: number
	sessions: number
}

interface GeoChartProps {
	countries: GeoItem[]
	cities: GeoItem[]
}

export default function GeoChart({ countries, cities }: GeoChartProps) {
	const [tab, setTab] = useState<'countries' | 'cities'>('countries')
	const data = tab === 'countries' ? countries : cities

	return (
		<div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-white">지역 분석</h3>
				<div className="flex gap-1 bg-gray-700/50 rounded-lg p-0.5">
					<button
						onClick={() => setTab('countries')}
						className={`px-3 py-1 text-sm rounded-md transition-colors ${
							tab === 'countries'
								? 'bg-gray-600 text-white'
								: 'text-gray-400 hover:text-gray-200'
						}`}
					>
						국가
					</button>
					<button
						onClick={() => setTab('cities')}
						className={`px-3 py-1 text-sm rounded-md transition-colors ${
							tab === 'cities'
								? 'bg-gray-600 text-white'
								: 'text-gray-400 hover:text-gray-200'
						}`}
					>
						도시
					</button>
				</div>
			</div>
			<ResponsiveContainer width="100%" height={300}>
				<BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
					<XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
					<YAxis
						type="category"
						dataKey="name"
						tick={{ fill: '#D1D5DB', fontSize: 12 }}
						width={100}
					/>
					<Tooltip
						contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
						labelStyle={{ color: '#F3F4F6' }}
						itemStyle={{ color: '#D1D5DB' }}
					/>
					<Bar dataKey="users" name="사용자" fill="#8B5CF6" radius={[0, 6, 6, 0]} barSize={20} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	)
}

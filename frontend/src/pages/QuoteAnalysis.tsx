import { useState } from 'react'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card'
import QuoteAnalysisVisual from 'components/QuoteAnalysis/QuoteAnalysisVisual'

interface QuoteItem {
	category: string
	itemName: string
	quantity: number
	unit: string
	unitPrice: number
	totalPrice: number
	notes?: string
}

interface AnalysisResult {
	overallEvaluation: string
	totalQuotedPrice: number
	estimatedMarketPrice: number
	potentialSavings: number
	itemComparisons: Array<{
		itemName: string
		quotedPrice: number
		marketAverage: number
		marketMin: number
		marketMax: number
		priceEvaluation: 'low' | 'fair' | 'high'
		priceDifference: number
		priceDifferencePercent: number
	}>
	aiInsights: string
	recommendations: string[]
}

// Transform backend result to visualization format
function transformToVisualFormat(result: AnalysisResult) {
	// Calculate overall score based on price comparison
	const priceRatio = result.totalQuotedPrice / result.estimatedMarketPrice
	let overallScore = 100
	if (priceRatio > 1.3) overallScore = 40  // 30% over market
	else if (priceRatio > 1.15) overallScore = 60  // 15% over market
	else if (priceRatio > 1.05) overallScore = 80  // 5% over market
	else if (priceRatio <= 1.05) overallScore = 90  // At or below market

	// Determine price level
	let priceLevel: 'low' | 'fair' | 'high' | 'very-high' = 'fair'
	if (priceRatio <= 0.9) priceLevel = 'low'
	else if (priceRatio <= 1.1) priceLevel = 'fair'
	else if (priceRatio <= 1.3) priceLevel = 'high'
	else priceLevel = 'very-high'

	// Transform item comparisons
	const itemAnalysis = result.itemComparisons.map(item => ({
		category: items.find(i => i.itemName === item.itemName)?.category || '기타',
		item: item.itemName,
		estimatePrice: item.quotedPrice,
		marketAverage: item.marketAverage,
		difference: item.priceDifference,
		differencePercent: item.priceDifferencePercent,
		evaluation: item.priceEvaluation === 'low' ? 'good' as const :
		           item.priceEvaluation === 'high' ? 'expensive' as const :
		           'fair' as const
	}))

	// Calculate criteria scores (synthetic for now, will be AI-generated later)
	const avgItemScore = itemAnalysis.reduce((sum, item) => {
		if (item.evaluation === 'good') return sum + 90
		if (item.evaluation === 'fair') return sum + 70
		return sum + 50
	}, 0) / itemAnalysis.length

	const criteriaScores = [
		{ criteria: '가격경쟁력', score: overallScore, market: 70 },
		{ criteria: '품질', score: Math.min(100, avgItemScore + 10), market: 75 },
		{ criteria: '시공성', score: avgItemScore, market: 70 },
		{ criteria: '내구성', score: Math.min(100, avgItemScore + 5), market: 72 },
		{ criteria: '디자인', score: avgItemScore, market: 68 }
	]

	// Parse AI insights
	const aiInsightLines = result.aiInsights.split('\n').filter(line => line.trim())
	const warnings: string[] = []
	const recommendations: string[] = result.recommendations || []

	// Extract warnings from insights if they exist
	aiInsightLines.forEach(line => {
		if (line.includes('주의') || line.includes('높은') || line.includes('위험')) {
			warnings.push(line)
		}
	})

	return {
		overallScore,
		priceLevel,
		totalEstimate: result.totalQuotedPrice,
		marketAverage: result.estimatedMarketPrice,
		recommendedPrice: result.estimatedMarketPrice,
		savings: result.potentialSavings,
		itemAnalysis,
		criteriaScores,
		aiInsights: {
			summary: result.overallEvaluation,
			warnings,
			recommendations
		}
	}
}

export default function QuoteAnalysis() {
	const [items, setItems] = useState<QuoteItem[]>([
		{ category: '', itemName: '', quantity: 1, unit: '개', unitPrice: 0, totalPrice: 0 }
	])
	const [propertyType, setPropertyType] = useState('')
	const [propertySize, setPropertySize] = useState('')
	const [region, setRegion] = useState('')
	const [analyzing, setAnalyzing] = useState(false)
	const [result, setResult] = useState<AnalysisResult | null>(null)

	const addItem = () => {
		setItems([...items, { category: '', itemName: '', quantity: 1, unit: '개', unitPrice: 0, totalPrice: 0 }])
	}

	const removeItem = (index: number) => {
		setItems(items.filter((_, i) => i !== index))
	}

	const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
		const newItems = [...items]
		newItems[index] = { ...newItems[index], [field]: value }

		// Auto-calculate totalPrice
		if (field === 'quantity' || field === 'unitPrice') {
			newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice
		}

		setItems(newItems)
	}

	const analyzeQuote = async () => {
		setAnalyzing(true)
		try {
			const response = await fetch('http://localhost:3001/api/analyze-quote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					items,
					propertyType,
					propertySize: propertySize ? Number(propertySize) : undefined,
					region
				})
			})

			const data = await response.json()
			setResult(data)
		} catch (error) {
			console.error('Analysis failed:', error)
			alert('견적 분석에 실패했습니다.')
		} finally {
			setAnalyzing(false)
		}
	}

	return (
		<div className='container mx-auto px-4 py-8 max-w-6xl'>
			<div className='mb-8'>
				<h1 className='text-4xl font-bold mb-2'>AI 견적 분석</h1>
				<p className='text-muted-foreground'>
					견적서를 입력하면 시장 데이터를 기반으로 AI가 분석해드립니다
				</p>
			</div>

			{/* Input Form */}
			<Card className='mb-6'>
				<CardHeader>
					<CardTitle>견적 정보 입력</CardTitle>
					<CardDescription>견적 항목과 매물 정보를 입력하세요</CardDescription>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* Property Info */}
					<div className='grid grid-cols-3 gap-4'>
						<div>
							<label className='text-sm font-medium mb-2 block'>건물 유형</label>
							<Input
								placeholder='아파트, 빌라, 주택 등'
								value={propertyType}
								onChange={(e) => setPropertyType(e.target.value)}
							/>
						</div>
						<div>
							<label className='text-sm font-medium mb-2 block'>평수</label>
							<Input
								type='number'
								placeholder='32'
								value={propertySize}
								onChange={(e) => setPropertySize(e.target.value)}
							/>
						</div>
						<div>
							<label className='text-sm font-medium mb-2 block'>지역</label>
							<Input
								placeholder='서울, 경기 등'
								value={region}
								onChange={(e) => setRegion(e.target.value)}
							/>
						</div>
					</div>

					{/* Quote Items */}
					<div className='space-y-4'>
						<div className='flex items-center justify-between'>
							<h3 className='text-lg font-semibold'>견적 항목</h3>
							<Button onClick={addItem} variant='outline' size='sm'>
								+ 항목 추가
							</Button>
						</div>

						{items.map((item, index) => (
							<div key={index} className='border rounded-lg p-4 space-y-3'>
								<div className='grid grid-cols-6 gap-3'>
									<Input
										placeholder='카테고리'
										value={item.category}
										onChange={(e) => updateItem(index, 'category', e.target.value)}
									/>
									<Input
										placeholder='항목명'
										value={item.itemName}
										onChange={(e) => updateItem(index, 'itemName', e.target.value)}
									/>
									<Input
										type='number'
										placeholder='수량'
										value={item.quantity}
										onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
									/>
									<Input
										placeholder='단위'
										value={item.unit}
										onChange={(e) => updateItem(index, 'unit', e.target.value)}
									/>
									<Input
										type='number'
										placeholder='단가'
										value={item.unitPrice}
										onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
									/>
									<div className='flex items-center gap-2'>
										<Input
											type='number'
											placeholder='총액'
											value={item.totalPrice}
											readOnly
											className='bg-muted'
										/>
										{items.length > 1 && (
											<Button
												onClick={() => removeItem(index)}
												variant='ghost'
												size='sm'
												className='text-red-600'
											>
												삭제
											</Button>
										)}
									</div>
								</div>
								<Input
									placeholder='비고 (선택사항)'
									value={item.notes || ''}
									onChange={(e) => updateItem(index, 'notes', e.target.value)}
								/>
							</div>
						))}
					</div>

					<Button onClick={analyzeQuote} disabled={analyzing} className='w-full' size='lg'>
						{analyzing ? '분석 중...' : 'AI 분석 시작'}
					</Button>
				</CardContent>
			</Card>

			{/* Analysis Result - New Visual Component */}
			{result && <QuoteAnalysisVisual analysis={transformToVisualFormat(result)} />}
		</div>
	)
}

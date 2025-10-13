import { useState, useEffect, RefObject } from 'react'

interface MousePosition {
	x: number
	y: number
	elementX: number
	elementY: number
}

/**
 * 마우스 위치를 추적하는 Hook
 * @param elementRef 추적할 요소의 ref
 * @returns 마우스 위치 정보
 */
export function useMousePosition(elementRef: RefObject<HTMLElement>): MousePosition {
	const [mousePosition, setMousePosition] = useState<MousePosition>({
		x: 0,
		y: 0,
		elementX: 0,
		elementY: 0
	})

	useEffect(() => {
		const element = elementRef.current
		if (!element) return

		const updateMousePosition = (e: MouseEvent) => {
			const rect = element.getBoundingClientRect()
			setMousePosition({
				x: e.clientX,
				y: e.clientY,
				elementX: e.clientX - rect.left,
				elementY: e.clientY - rect.top
			})
		}

		element.addEventListener('mousemove', updateMousePosition)

		return () => {
			element.removeEventListener('mousemove', updateMousePosition)
		}
	}, [elementRef])

	return mousePosition
}

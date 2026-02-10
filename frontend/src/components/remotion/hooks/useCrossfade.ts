import { useCurrentFrame, interpolate } from 'remotion'
import { CROSSFADE_FRAMES } from '../constants'

/**
 * Returns a multiplied opacity value for crossfade transitions.
 * Apply to the scene's root element: `style={{ opacity: crossfade }}`
 *
 * @param duration - Total duration of the scene in frames
 * @param noFadeOut - If true, skip fade-out (e.g. last scene CTA)
 */
export function useCrossfade(duration: number, noFadeOut = false) {
	const frame = useCurrentFrame()

	const fadeIn = interpolate(frame, [0, CROSSFADE_FRAMES], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	if (noFadeOut) return fadeIn

	const fadeOut = interpolate(frame, [duration - CROSSFADE_FRAMES, duration], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	return fadeIn * fadeOut
}

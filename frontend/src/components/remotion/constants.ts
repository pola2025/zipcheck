// ─── Spring Configs ───
// Shared animation presets for consistent motion language
export const SPRING_CONFIGS = {
	elegant: { damping: 28, stiffness: 60 },
	confident: { damping: 22, stiffness: 70 },
	gentle: { damping: 20, stiffness: 80 },
	bouncy: { damping: 12, stiffness: 80 },
	snappy: { damping: 15, stiffness: 150 },
	alert: { damping: 10, stiffness: 200 },
	cta: { damping: 15, stiffness: 80 },
} as const

// ─── Scene Timings ───
// All values in frames (30fps). Total = 900 frames = 30 seconds.
// Scenes overlap by ~15f for crossfade transitions.
//
// Timeline (frames, 30fps):
// question:     |====90====|
// priceCompare:       |========160========|
// overpriced:                    |=====155=====|
// underpriced:                            |=====155=====|
// message:                                         |======160======|
// result:                                                   |===120===|
// cta:                                                          |=====145=====|
//               0   80  90     225 240    365 380   505 520  650 665  755 770    900

const OVERLAP = 15

export const SCENE_TIMINGS = {
	question:     { from: 0,   duration: 90 },
	priceCompare: { from: 80,  duration: 160 },
	overpriced:   { from: 225, duration: 155 },
	underpriced:  { from: 365, duration: 155 },
	message:      { from: 505, duration: 160 },
	result:       { from: 650, duration: 120 },
	cta:          { from: 755, duration: 145 },
} as const

export const CROSSFADE_FRAMES = OVERLAP

// ─── Variant / Viewport ───
export type Variant = 'mobile' | 'desktop'

export interface SceneProps {
	variant?: Variant
}

export const VIEWPORTS = {
	mobile:  { width: 360,  height: 640, label: '9:16' as const },
	desktop: { width: 1280, height: 720, label: '16:9' as const },
} as const

// ─── Status Colors (typed) ───
export type StatusType = 'danger' | 'warning' | 'ok'

export const STATUS_COLORS: Record<StatusType, { bg: string; text: string; border: string }> = {
	danger:  { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-300' },
	warning: { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-300' },
	ok:      { bg: 'bg-forest-50',  text: 'text-forest-600',  border: 'border-forest-200' },
}

// ─── Video Config (PC 1280x720 우선, 모바일 보류) ───
export const VIDEO_FPS = 30
export const VIDEO_DURATION_IN_FRAMES = 900
export const VIDEO_WIDTH = 1280
export const VIDEO_HEIGHT = 720

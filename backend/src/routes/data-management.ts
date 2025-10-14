/**
 * 데이터 관리 API (시공 데이터, 유통사 가격 데이터 업로드)
 */

import express, { Request, Response } from 'express'
import multer from 'multer'
import {
	uploadConstructionData,
	uploadDistributorData,
	uploadConstructionSheets
} from '../services/data-upload'

const router = express.Router()

// Multer 설정 (메모리에 저장)
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 50 * 1024 * 1024 // 50MB
	},
	fileFilter: (req, file, cb) => {
		// Excel 파일만 허용
		const allowedMimes = [
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'text/csv'
		]

		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true)
		} else {
			cb(new Error('엑셀 파일(.xlsx, .xls, .csv)만 업로드 가능합니다'))
		}
	}
})

/**
 * POST /api/data-management/upload/construction
 * 시공 데이터 업로드 (일반 테이블 형식)
 */
router.post('/upload/construction', upload.single('file'), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				error: '파일이 없습니다'
			})
		}

		console.log(`📤 Uploading construction data: ${req.file.originalname}`)

		const result = await uploadConstructionData(req.file)

		res.json({
			success: true,
			message: '시공 데이터 업로드 완료',
			data: result
		})
	} catch (error: any) {
		console.error('❌ Upload error:', error)
		res.status(500).json({
			success: false,
			error: error.message || '업로드 실패'
		})
	}
})

/**
 * POST /api/data-management/upload/construction-sheets
 * 현장별 실행내역서 업로드 (173개 시트 형식)
 */
router.post('/upload/construction-sheets', upload.single('file'), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				error: '파일이 없습니다'
			})
		}

		console.log(`📤 Uploading construction sheets: ${req.file.originalname}`)

		const result = await uploadConstructionSheets(req.file)

		res.json({
			success: true,
			message: '현장별 실행내역서 업로드 완료',
			data: result
		})
	} catch (error: any) {
		console.error('❌ Upload error:', error)
		res.status(500).json({
			success: false,
			error: error.message || '업로드 실패'
		})
	}
})

/**
 * POST /api/data-management/upload/distributor
 * 유통사 가격 데이터 업로드
 */
router.post('/upload/distributor', upload.single('file'), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				error: '파일이 없습니다'
			})
		}

		console.log(`📤 Uploading distributor data: ${req.file.originalname}`)

		const result = await uploadDistributorData(req.file)

		res.json({
			success: true,
			message: '유통사 가격 데이터 업로드 완료',
			data: result
		})
	} catch (error: any) {
		console.error('❌ Upload error:', error)
		res.status(500).json({
			success: false,
			error: error.message || '업로드 실패'
		})
	}
})

export default router

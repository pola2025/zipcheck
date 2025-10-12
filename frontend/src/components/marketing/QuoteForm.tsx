import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from 'components/ui/input'
import { Textarea } from 'components/ui/textarea'
import { Checkbox } from 'components/ui/checkbox'
import { Label } from 'components/ui/label'
import { Button } from 'components/ui/button'
import { cn } from 'lib/utils'
import type { ContactCopy } from 'data/marketing'
import { submitQuoteRequest } from 'api/marketing'

export const quoteFormSchema = z.object({
	name: z
		.string()
		.min(2, '이름을 2자 이상 입력해 주세요.')
		.max(50, '이름은 50자 이하로 입력해 주세요.'),
	email: z.string().email('올바른 이메일 주소를 입력해 주세요.'),
	phone: z
		.string()
		.optional()
		.refine(
			value => !value || /^[0-9+\-\s()]{8,20}$/.test(value),
			'전화번호 형식이 올바르지 않습니다.'
		),
	message: z
		.string()
		.min(10, '프로젝트 내용을 10자 이상 입력해 주세요.')
		.max(2000, '프로젝트 내용은 2000자 이하로 입력해 주세요.'),
	privacy: z.literal(true, {
		errorMap: () => ({
			message: '개인정보 수집 및 이용에 동의해 주세요.'
		})
	}),
	terms: z.literal(true, {
		errorMap: () => ({
			message: '서비스 이용약관에 동의해 주세요.'
		})
	})
})

export type QuoteFormValues = z.infer<typeof quoteFormSchema>

type QuoteFormProps = {
	className?: string
	copy: ContactCopy
	onSubmit?: (values: QuoteFormValues) => Promise<void> | void
}

export default function QuoteForm({ className, copy, onSubmit }: QuoteFormProps) {
	const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
	const [errorMessage, setErrorMessage] = useState<string | undefined>()

	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting }
	} = useForm<QuoteFormValues>({
		resolver: zodResolver(quoteFormSchema),
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			message: '',
			privacy: false,
			terms: false
		}
	})

	const handleFormSubmit = async (values: QuoteFormValues) => {
		try {
			setStatus('idle')
			setErrorMessage(undefined)

			if (onSubmit) {
				await onSubmit(values)
			} else {
				await submitQuoteRequest({
					name: values.name,
					email: values.email,
					phone: values.phone,
					message: values.message
				})
			}

			reset()
			setStatus('success')
		} catch (error) {
			setStatus('error')
			if (error instanceof Error) {
				setErrorMessage(error.message)
			} else {
				setErrorMessage('요청을 처리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
			}
		}
	}

	const inputClass = 'border-[hsla(var(--glass-border),0.24)] bg-[rgba(14,22,36,0.6)] text-foreground placeholder:text-slate-300/40 focus-visible:ring-accent focus-visible:ring-offset-0'

	return (
		<form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-8', className)} noValidate>
			<div className='grid gap-6 md:grid-cols-2'>
				<div className='flex flex-col gap-2'>
					<Label htmlFor='quote-name' className='text-sm font-semibold text-foreground'>
						이름
					</Label>
					<Input
						id='quote-name'
						placeholder='홍길동'
						aria-invalid={errors.name ? 'true' : 'false'}
						aria-describedby={errors.name ? 'quote-name-error' : undefined}
						className={inputClass}
						{...register('name')}
					/>
					{errors.name ? (
						<p id='quote-name-error' className='text-xs text-red-400'>
							{errors.name.message}
						</p>
					) : null}
				</div>
				<div className='flex flex-col gap-2'>
					<Label htmlFor='quote-email' className='text-sm font-semibold text-foreground'>
						이메일
					</Label>
					<Input
						id='quote-email'
						type='email'
						placeholder='you@example.com'
						aria-invalid={errors.email ? 'true' : 'false'}
						aria-describedby={errors.email ? 'quote-email-error' : undefined}
						className={inputClass}
						{...register('email')}
					/>
					{errors.email ? (
						<p id='quote-email-error' className='text-xs text-red-400'>
							{errors.email.message}
						</p>
					) : null}
				</div>
				<div className='flex flex-col gap-2'>
					<Label htmlFor='quote-phone' className='text-sm font-semibold text-foreground'>
						연락처 (선택)
					</Label>
					<Input
						id='quote-phone'
						type='tel'
						placeholder='010-1234-5678'
						aria-invalid={errors.phone ? 'true' : 'false'}
						aria-describedby={errors.phone ? 'quote-phone-error' : undefined}
						className={inputClass}
						{...register('phone')}
					/>
					{errors.phone ? (
						<p id='quote-phone-error' className='text-xs text-red-400'>
							{errors.phone.message}
						</p>
					) : null}
				</div>
				<div className='flex flex-col gap-2 md:col-span-2'>
					<Label htmlFor='quote-message' className='text-sm font-semibold text-foreground'>
						프로젝트 소개
					</Label>
					<Textarea
						id='quote-message'
						rows={6}
						placeholder='진행 예정인 프로젝트나 현재 상황을 간략히 공유해 주세요.'
						aria-invalid={errors.message ? 'true' : 'false'}
						aria-describedby={errors.message ? 'quote-message-error' : undefined}
						className={cn('resize-none', inputClass)}
						{...register('message')}
					/>
					{errors.message ? (
						<p id='quote-message-error' className='text-xs text-red-400'>
							{errors.message.message}
						</p>
					) : null}
				</div>
			</div>

			{/* 약관 동의 섹션 */}
			<div className='flex flex-col gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5'>
				{/* 서비스 약관 안내 */}
				<div className='flex items-start gap-2 text-xs text-amber-200/90'>
					<span className='text-amber-400 text-sm'>⚠️</span>
					<p className='leading-relaxed'>
						본 견적 분석은 시장 데이터 기반 참고 자료이며, 시공업체 평가나 디자인 품질 평가가 아닙니다.
						시공사 선정 시 여러 요소를 종합적으로 고려하시기 바라며,
						시공 과정 및 결과에 대한 분쟁은 해당 시공사에 직접 문의하셔야 합니다.
					</p>
				</div>

				{/* 개인정보 동의 */}
				<div className='flex flex-col gap-2'>
					<div className='flex items-start gap-3'>
						<Controller
							name='privacy'
							control={control}
							render={({ field }) => (
								<Checkbox
									id='quote-privacy'
									className='mt-1 border-[hsla(var(--glass-border),0.35)] data-[state=checked]:border-transparent data-[state=checked]:bg-accent'
									aria-describedby={errors.privacy ? 'quote-privacy-error' : undefined}
									data-testid='quote-privacy-checkbox'
									checked={field.value}
									onCheckedChange={value => field.onChange(Boolean(value))}
									onBlur={field.onBlur}
								/>
							)}
						/>
						<Label htmlFor='quote-privacy' className='text-xs text-muted-foreground cursor-pointer'>
							개인정보 수집 및 이용에 동의합니다. (
							<a className='text-accent underline underline-offset-4' href={copy.privacyUrl}>
								자세히 보기
							</a>
							)
						</Label>
					</div>
					{errors.privacy ? (
						<p id='quote-privacy-error' className='text-xs text-red-400 ml-7'>
							{errors.privacy.message}
						</p>
					) : null}
				</div>

				{/* 서비스 약관 동의 */}
				<div className='flex flex-col gap-2'>
					<div className='flex items-start gap-3'>
						<Controller
							name='terms'
							control={control}
							render={({ field }) => (
								<Checkbox
									id='quote-terms'
									className='mt-1 border-[hsla(var(--glass-border),0.35)] data-[state=checked]:border-transparent data-[state=checked]:bg-accent'
									aria-describedby={errors.terms ? 'quote-terms-error' : undefined}
									data-testid='quote-terms-checkbox'
									checked={field.value}
									onCheckedChange={value => field.onChange(Boolean(value))}
									onBlur={field.onBlur}
								/>
							)}
						/>
						<Label htmlFor='quote-terms' className='text-xs text-muted-foreground cursor-pointer'>
							견적 분석 서비스 이용약관 및 면책조항에 동의합니다. (
							<a className='text-accent underline underline-offset-4' href='/terms'>
								자세히 보기
							</a>
							)
						</Label>
					</div>
					{errors.terms ? (
						<p id='quote-terms-error' className='text-xs text-red-400 ml-7'>
							{errors.terms.message}
						</p>
					) : null}
				</div>
			</div>

			<div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
				<p className='text-xs text-muted-foreground'>
					문의: <a className='text-accent' href={`mailto:${copy.supportEmail}`}>{copy.supportEmail}</a>
				</p>
				<Button
					 type='submit'
					 size='lg'
					 disabled={isSubmitting}
					 className='marketing-glow marketing-cta-gradient px-8 py-3 text-base font-semibold'
				>
					{isSubmitting ? '전송 중...' : '상담 요청 보내기'}
				</Button>
			</div>

			<div aria-live='polite' className='space-y-2'>
				{status === 'success' ? (
					<p className='text-sm font-medium text-accent'>요청이 접수되었습니다. 담당 컨설턴트가 곧 연락드릴게요.</p>
				) : null}
				{status === 'error' ? (
					<p className='text-sm text-red-400' role='alert'>
						{errorMessage ?? '요청을 처리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'}
					</p>
				) : null}
			</div>
		</form>
	)
}

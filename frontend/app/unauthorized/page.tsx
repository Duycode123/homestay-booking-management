import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-500">Không có quyền</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Bạn không được phép vào trang này</h1>
        <p className="mt-2 text-sm text-slate-500">Vui lòng đăng nhập bằng tài khoản có đúng vai trò.</p>
        <Link
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          href="/login"
        >
          Quay lại đăng nhập
        </Link>
      </section>
    </main>
  )
}

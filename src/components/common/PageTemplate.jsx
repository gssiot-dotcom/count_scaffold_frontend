export default function PageTemplate({

  title,

  description = "",

  children,

}) {

  return (

    <div className="min-h-full bg-slate-100 p-6">

      <section className="border border-slate-300 bg-white">

        {/* 헤더 */}

        <div className="border-b border-slate-300 bg-slate-50 px-8 py-6">

          <h1 className="text-[2.125rem] font-semibold text-slate-900">

            {title}

          </h1>

          {description && (

            <p className="mt-2 text-[1.125rem] text-slate-600">

              {description}

            </p>

          )}

        </div>

        {/* 본문 */}

        <div className="px-8 py-10">

          {children ? (

            children

          ) : (

            <div className="border border-dashed border-slate-300 bg-slate-50 p-10 text-center">

              <p className="text-[1.25rem] font-medium text-slate-700">

                {title}

              </p>

              <p className="mt-2 text-[1rem] text-slate-500">

                이 페이지의 상세 기능은 이후 API 연동에 맞춰 구현됩니다.

              </p>

            </div>

          )}

        </div>

      </section>

    </div>

  );

}
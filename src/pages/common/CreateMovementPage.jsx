export default function CreateMovementPage({ title, movementType }) {
  return (
    <div className="bg-slate-100 p-8">
      <div className="border border-slate-300 bg-white p-8">
        <h1 className="text-[2.125rem] font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 text-[1.125rem] text-slate-600">
          공통 회차 생성 페이지입니다. movementType = {movementType}
        </p>
        <p className="mt-6 text-slate-500">
          기존 CreateOut 페이지 구조를 복사하여 API만 create-return으로 변경하면 됩니다.
        </p>
      </div>
    </div>
  );
}
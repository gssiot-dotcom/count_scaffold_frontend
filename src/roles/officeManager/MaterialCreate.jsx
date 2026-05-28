// src/roles/officeManager/MaterialCreate.jsx
// 자재 등록 + 자재 목록 관리

import { useEffect, useState } from "react";
import { api } from "../../api/api.js";

export default function MaterialCreate() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    material_name: "",
    spec: "",
    price: "",
    total_qty: "",
  });
  const [imageFile, setImageFile] = useState(null);

  // 수정 모달
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ price: 0, total_qty: 0, loss_qty: 0, repair_qty: 0 });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await api.getMaterials();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message || "자재 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMaterials(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!form.material_name.trim()) { setErrorMsg("자재명을 입력해주세요."); return; }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("material_name", form.material_name.trim());
      if (form.spec) formData.append("spec", form.spec.trim());
      if (form.price) formData.append("price", form.price);
      if (form.total_qty) formData.append("total_qty", form.total_qty);
      if (imageFile) formData.append("image", imageFile);
      await api.createMaterial(formData);
      setSuccessMsg(`'${form.material_name}' 자재가 등록되었습니다.`);
      setForm({ material_name: "", spec: "", price: "", total_qty: "" });
      setImageFile(null);
      await loadMaterials();
    } catch (err) {
      setErrorMsg(err.message || "자재 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (m) => {
    setEditTarget(m);
    setEditForm({
      price: m.price || 0,
      total_qty: m.total_qty || 0,
      loss_qty: m.loss_qty || 0,
      repair_qty: m.repair_qty || 0,
    });
  };

  const closeEdit = () => setEditTarget(null);

  const handleEditSave = async () => {
    try {
      setEditSubmitting(true);
      await api.updateMaterial(editTarget.id, {
        price: Number(editForm.price),
        total_qty: Number(editForm.total_qty),
        loss_qty: Number(editForm.loss_qty),
        repair_qty: Number(editForm.repair_qty),
      });
      closeEdit();
      await loadMaterials();
    } catch (err) {
      alert(err.message || "수정에 실패했습니다.");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-100">
      <div className="grid grid-cols-[26.25rem_1fr] gap-6 max-xl:grid-cols-1">

        {/* 등록 폼 */}
        <section className="border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
            <h1 className="text-[1.75rem] font-semibold text-slate-900">자재 등록</h1>
            <p className="mt-1 text-[1rem] text-slate-600">새 자재를 등록합니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-7">
            {errorMsg && (
              <div className="mb-5 border border-red-300 bg-red-50 px-4 py-3 text-[1rem] text-red-700">{errorMsg}</div>
            )}
            {successMsg && (
              <div className="mb-5 border border-green-300 bg-green-50 px-4 py-3 text-[1rem] text-green-800">{successMsg}</div>
            )}

            <FormGroup label="자재명 *">
              <input name="material_name" value={form.material_name} onChange={handleChange}
                placeholder="예: 비계파이프"
                className="h-12 w-full border border-slate-300 px-4 text-[1.0625rem] focus:border-blue-900 focus:outline-none" />
            </FormGroup>
            <FormGroup label="규격">
              <input name="spec" value={form.spec} onChange={handleChange}
                placeholder="예: 48.6×2.4T"
                className="h-12 w-full border border-slate-300 px-4 text-[1.0625rem] focus:border-blue-900 focus:outline-none" />
            </FormGroup>
            <FormGroup label="단가 (원)">
              <input type="number" name="price" value={form.price} onChange={handleChange}
                placeholder="예: 5000"
                className="h-12 w-full border border-slate-300 px-4 text-[1.0625rem] focus:border-blue-900 focus:outline-none" />
            </FormGroup>
            <FormGroup label="초기 수량">
              <input type="number" name="total_qty" value={form.total_qty} onChange={handleChange}
                placeholder="예: 1000"
                className="h-12 w-full border border-slate-300 px-4 text-[1.0625rem] focus:border-blue-900 focus:outline-none" />
            </FormGroup>
            <FormGroup label="이미지 (선택)">
              <input type="file" accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full border border-slate-300 p-3 text-[0.9375rem]" />
              {imageFile && <p className="mt-2 text-[0.875rem] text-blue-700">선택: {imageFile.name}</p>}
            </FormGroup>

            <button type="submit" disabled={submitting}
              className="mt-6 w-full border border-blue-900 bg-blue-900 py-4 text-[1.125rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400">
              {submitting ? "등록 중..." : "자재 등록"}
            </button>
          </form>
        </section>

        {/* 자재 목록 */}
        <section className="border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
            <h2 className="text-[1.75rem] font-semibold text-slate-900">
              등록된 자재 목록
              <span className="ml-3 text-[1.25rem] font-normal text-slate-500">({materials.length}개)</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["ID", "자재명", "규격", "단가", "전체 수량", "LOSS", "수리", "관리"].map((h) => (
                    <th key={h}
                      className="border-b border-slate-300 bg-slate-100 px-5 py-4 text-left text-[1rem] font-medium text-slate-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">불러오는 중...</td></tr>
                ) : materials.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-[1.0625rem] text-slate-500">등록된 자재가 없습니다.</td></tr>
                ) : (
                  materials.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-500">{m.id}</td>
                      <td className="border-b border-slate-200 px-5 py-4">
                        <button type="button" onClick={() => openEdit(m)}
                          className="text-[1.0625rem] font-medium text-blue-800 hover:underline">
                          {m.material_name}
                        </button>
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[0.9375rem] text-slate-600">{m.spec || "-"}</td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[1rem] text-slate-700">
                        {m.price ? `${Number(m.price).toLocaleString()}원` : "-"}
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4 text-[1.0625rem] font-semibold text-slate-800">
                        {Number(m.total_qty || 0).toLocaleString()}개
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4">
                        <span className={Number(m.loss_qty) > 0 ? "font-semibold text-red-600" : "text-slate-400"}>
                          {Number(m.loss_qty || 0).toLocaleString()}개
                        </span>
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4">
                        <span className={Number(m.repair_qty) > 0 ? "font-semibold text-amber-600" : "text-slate-400"}>
                          {Number(m.repair_qty || 0).toLocaleString()}개
                        </span>
                      </td>
                      <td className="border-b border-slate-200 px-5 py-4">
                        <button type="button" onClick={() => openEdit(m)}
                          className="border border-slate-300 bg-white px-4 py-2 text-[0.875rem] text-slate-700 hover:bg-slate-50">
                          수정
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 수정 모달 */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}>
          <div className="w-[30rem] border border-slate-300 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-[1.375rem] font-semibold text-slate-900">자재 정보 수정</h2>
                <p className="mt-0.5 text-[0.9375rem] text-slate-500">{editTarget.material_name}</p>
              </div>
              <button type="button" onClick={closeEdit}
                className="text-[1.5rem] leading-none text-slate-400 hover:text-slate-700">×</button>
            </div>

            <div className="grid grid-cols-2 gap-5 p-6">
              <EditField label="단가" value={editForm.price}
                onChange={(v) => setEditForm((p) => ({ ...p, price: v }))} />
              <EditField label="전체 수량" value={editForm.total_qty}
                onChange={(v) => setEditForm((p) => ({ ...p, total_qty: v }))} />
              <EditField label="LOSS 수량" value={editForm.loss_qty}
                onChange={(v) => setEditForm((p) => ({ ...p, loss_qty: v }))} />
              <EditField label="수리 수량" value={editForm.repair_qty}
                onChange={(v) => setEditForm((p) => ({ ...p, repair_qty: v }))} />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button type="button" onClick={closeEdit}
                className="border border-slate-300 bg-white px-6 py-3 text-[1rem] text-slate-700 hover:bg-slate-50">
                취소
              </button>
              <button type="button" onClick={handleEditSave} disabled={editSubmitting}
                className="border border-blue-900 bg-blue-900 px-8 py-3 text-[1rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400">
                {editSubmitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div className="mt-5">
      <label className="mb-2 block text-[1.0625rem] font-semibold text-slate-800">{label}</label>
      {children}
    </div>
  );
}

function EditField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-[0.9375rem] font-semibold text-slate-700">{label}</label>
      <input type="number" min={0} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full border border-slate-300 px-4 text-[1.0625rem] focus:border-blue-900 focus:outline-none" />
    </div>
  );
}

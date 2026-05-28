// src/roles/officeWorker/contracts/EstimateContractUpload.jsx
// [1단계] 견적서 업로드 → [2단계] 자재명 드롭다운 + 규격 드롭다운 + 수량 입력 → 확정

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { api } from "../../../api/api.js";

export default function EstimateContractUpload() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [materials, setMaterials] = useState([]); // 전체 자재 목록
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // 1단계
  const [form, setForm] = useState({ provider_company: "", site: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 2단계
  const [step, setStep] = useState(1);
  const [rentalId, setRentalId] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setPageLoading(true);
        const [companyData, siteData, materialData] = await Promise.all([
          api.getCompanies(),
          api.getSites(),
          api.getMaterials(),
        ]);
        setCompanies(Array.isArray(companyData) ? companyData : []);
        setSites(Array.isArray(siteData) ? siteData : []);
        setMaterials(Array.isArray(materialData) ? materialData : []);

        const cos = Array.isArray(companyData) ? companyData : [];
        const sis = Array.isArray(siteData) ? siteData : [];
        if (cos.length > 0) setForm((p) => ({ ...p, provider_company: String(cos[0].id) }));
        if (sis.length > 0) setForm((p) => ({ ...p, site: String(sis[0].id) }));
      } catch (err) {
        setErrorMsg(err.message || "초기 데이터를 불러오지 못했습니다.");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  // 자재명 목록 (중복 제거)
  const materialNames = [...new Set(materials.map((m) => m.material_name).filter(Boolean))].sort();

  // 자재명으로 해당 규격 목록 조회
  const getSpecsByName = (name) => {
    if (!name) return [];
    return materials
      .filter((m) => m.material_name === name)
      .map((m) => ({ id: m.id, spec: m.spec || "규격 없음" }));
  };

  // 자재명 + 규격으로 material_id 조회
  const getMaterialId = (name, specId) => {
    return specId || null;
  };

  // ─── 1단계 업로드 ───
  const handleUpload = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!form.provider_company) { setErrorMsg("대여 회사를 선택해주세요."); return; }
    if (!form.site) { setErrorMsg("현장을 선택해주세요."); return; }
    if (!file) { setErrorMsg("견적서 파일(.xlsx)을 첨부해주세요."); return; }
    if (!file.name.endsWith(".xlsx")) { setErrorMsg("xlsx 형식의 파일만 업로드할 수 있습니다."); return; }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("provider_company", form.provider_company);
      formData.append("site", form.site);
      formData.append("quotation_file", file);

      const result = await api.createRental(formData);
      setRentalId(result.rental_id || result.id);

      // parsed_items → 자재명/규격 분리 형태로 변환
      setParsedItems(
        (result.parsed_items || []).map((item, idx) => {
          // AI가 매칭한 material_id로 자재명/규격 찾기
          const matchedMaterial = item.material_id
            ? materials.find((m) => m.id === item.material_id)
            : null;

          const initName = matchedMaterial?.material_name || "";
          const initSpecId = matchedMaterial ? String(matchedMaterial.id) : "";

          return {
            uid: `parsed-${idx}`,
            original_name: item.material_name,
            // 자재명 드롭다운
            selected_name: initName,
            // 규격 드롭다운 (material id)
            selected_spec_id: initSpecId,
            // 수량
            edit_planned_qty: String(item.planned_qty ?? "0"),
            is_matched: item.is_matched,
          };
        })
      );
      setStep(2);
    } catch (err) {
      setErrorMsg(err.message || "견적서 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // 항목 수정
  const updateItem = (uid, field, value) => {
    setParsedItems((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item;
        // 자재명 바뀌면 규격 초기화
        if (field === "selected_name") {
          const specs = getSpecsByName(value);
          return {
            ...item,
            selected_name: value,
            selected_spec_id: specs.length > 0 ? String(specs[0].id) : "",
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  // 항목 삭제
  const deleteItem = (uid) => {
    if (parsedItems.length <= 1) { alert("최소 1개 이상의 자재가 필요합니다."); return; }
    setParsedItems((prev) => prev.filter((item) => item.uid !== uid));
  };

  // 항목 추가
  const addItem = () => {
    setParsedItems((prev) => [
      ...prev,
      {
        uid: `manual-${Date.now()}`,
        original_name: "(직접 추가)",
        selected_name: "",
        selected_spec_id: "",
        edit_planned_qty: "0",
        is_matched: false,
      },
    ]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 100);
  };

  // ─── 2단계 확정 ───
  const handleConfirm = async () => {
    setErrorMsg("");
    const incomplete = parsedItems.filter((item) => !item.selected_spec_id || Number(item.edit_planned_qty) <= 0);
    if (incomplete.length > 0) {
      setErrorMsg("자재 또는 규격이 선택되지 않았거나 수량이 0인 항목이 있습니다.");
      return;
    }

    try {
      setConfirming(true);
      await api.confirmRentalDetails(rentalId, {
        items: parsedItems.map((item) => ({
          material_id: Number(item.selected_spec_id),
          planned_qty: Number(item.edit_planned_qty),
        })),
      });
      alert("견적 확정이 완료되었습니다.\n사무실 총책임자 승인 후 출고가 가능합니다.");
      navigate("/office-worker/rental");
    } catch (err) {
      setErrorMsg(err.message || "견적 확정에 실패했습니다.");
    } finally {
      setConfirming(false);
    }
  };

  const incompleteCount = parsedItems.filter((item) => !item.selected_spec_id).length;

  return (
    <div className="bg-slate-100">

      {/* 스텝 인디케이터 */}
      <div className="mb-6 flex border border-slate-300 bg-white">
        <StepTab step={1} label="견적서 업로드" current={step} />
        <StepTab step={2} label="자재 확인 및 확정" current={step} />
      </div>

      {/* ─── STEP 1 ─── */}
      {step === 1 && (
        <section className="border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
            <h1 className="text-[2.125rem] font-semibold text-slate-900">견적서 업로드</h1>
            <p className="mt-2 text-[1.1875rem] text-slate-600">
              비계견적서(xlsx)를 업로드하면 자재 목록이 자동으로 파싱됩니다.
            </p>
          </div>

          <form onSubmit={handleUpload} className="max-w-[45rem] p-7">
            {errorMsg && <ErrorBox msg={errorMsg} />}

            <FormGroup label="대여 회사 (자재 제공 회사)">
              <select
                value={form.provider_company}
                onChange={(e) => setForm((p) => ({ ...p, provider_company: e.target.value }))}
                disabled={pageLoading}
                className="h-14 w-full border border-slate-300 bg-white px-4 text-[1.125rem] focus:border-blue-900 focus:outline-none"
              >
                {pageLoading ? <option>불러오는 중...</option>
                  : companies.length === 0 ? <option>등록된 회사 없음</option>
                  : companies.map((c) => <option key={c.id} value={String(c.id)}>{c.company_name}</option>)}
              </select>
            </FormGroup>

            <FormGroup label="현장">
              <select
                value={form.site}
                onChange={(e) => setForm((p) => ({ ...p, site: e.target.value }))}
                disabled={pageLoading}
                className="h-14 w-full border border-slate-300 bg-white px-4 text-[1.125rem] focus:border-blue-900 focus:outline-none"
              >
                {pageLoading ? <option>불러오는 중...</option>
                  : sites.length === 0 ? <option>등록된 현장 없음</option>
                  : sites.map((s) => <option key={s.id} value={String(s.id)}>{s.site_name}</option>)}
              </select>
            </FormGroup>

            <FormGroup label="비계견적서 파일 (.xlsx)">
              <div className="border border-slate-300 bg-white p-5">
                <input
                  type="file" accept=".xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-[1.0625rem]"
                />
                {file && (
                  <div className="mt-4 border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-[1rem] font-medium text-blue-900">선택된 파일: {file.name}</p>
                    <p className="mt-1 text-[0.875rem] text-blue-700">크기: {(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                )}
              </div>
            </FormGroup>

            <div className="mt-6 border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-[1rem] font-semibold text-slate-700">업로드 안내</p>
              <ul className="mt-2 space-y-1 text-[0.9375rem] text-slate-600">
                <li>· xlsx 형식의 비계견적서만 업로드 가능합니다.</li>
                <li>· 시트명은 <strong>비계견적서</strong> 또는 <strong>비계 견적서</strong>이어야 합니다.</li>
                <li>· 업로드 후 자재명과 수량을 직접 확인하고 수정할 수 있습니다.</li>
              </ul>
            </div>

            <div className="mt-8 flex gap-4">
              <button type="submit" disabled={uploading || pageLoading}
                className="border border-blue-900 bg-blue-900 px-8 py-4 text-[1.125rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400">
                {uploading ? "업로드 중..." : "업로드 및 파싱"}
              </button>
              <button type="button" onClick={() => navigate("/office-worker/rental")}
                className="border border-slate-300 bg-white px-8 py-4 text-[1.125rem] font-medium text-slate-700 hover:bg-slate-50">
                취소
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ─── STEP 2 ─── */}
      {step === 2 && (
        <section className="border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-slate-50 px-7 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[2.125rem] font-semibold text-slate-900">자재 확인 및 확정</h1>
                <p className="mt-1 text-[1.125rem] text-slate-600">계약 #{rentalId}</p>
              </div>
              <div className="text-[1.0625rem] text-slate-500">
                총 <strong className="text-slate-900">{parsedItems.length}개</strong> 항목
              </div>
            </div>
          </div>

          <div className="p-7">
            {/* 안내 문구 */}
            <div className="mb-7 border-l-4 border-blue-900 bg-blue-50 px-6 py-5">
              <p className="text-[1.1875rem] font-semibold text-blue-900">AI가 견적서를 읽었어요!</p>
              <p className="mt-2 text-[1.0625rem] leading-relaxed text-blue-800">
                하지만 더 정확한 견적서 등록을 위해 수정이 필요한 부분은 수정해주세요.
                <br />
                자재명 선택 후 해당 자재의 규격을 선택하고, 수량을 입력해주세요.
              </p>
            </div>

            {errorMsg && <ErrorBox msg={errorMsg} />}

            {/* 테이블 */}
            <div className="overflow-x-auto border border-slate-300">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="w-10 border-b border-slate-300 bg-slate-100 px-4 py-4 text-left text-[1rem] font-medium text-slate-700">#</th>
                    <th className="border-b border-slate-300 bg-slate-100 px-4 py-4 text-left text-[1rem] font-medium text-slate-700">견적서 원본</th>
                    <th className="border-b border-slate-300 bg-slate-100 px-4 py-4 text-left text-[1rem] font-medium text-slate-700">자재명</th>
                    <th className="border-b border-slate-300 bg-slate-100 px-4 py-4 text-left text-[1rem] font-medium text-slate-700">규격</th>
                    <th className="w-32 border-b border-slate-300 bg-slate-100 px-4 py-4 text-left text-[1rem] font-medium text-slate-700">수량</th>
                    <th className="w-16 border-b border-slate-300 bg-slate-100 px-4 py-4 text-center text-[1rem] font-medium text-slate-700">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.map((item, index) => {
                    const isIncomplete = !item.selected_spec_id;
                    const specsForName = getSpecsByName(item.selected_name);
                    // 선택된 규격 정보
                    const selectedMaterial = item.selected_spec_id
                      ? materials.find((m) => String(m.id) === String(item.selected_spec_id))
                      : null;

                    return (
                      <tr key={item.uid} className={isIncomplete ? "bg-amber-50" : "hover:bg-slate-50"}>
                        {/* 번호 */}
                        <td className="border-b border-slate-200 px-4 py-4 text-[0.9375rem] text-slate-400">
                          {index + 1}
                        </td>

                        {/* 원본 자재명 */}
                        <td className="border-b border-slate-200 px-4 py-4">
                          <span className="text-[0.9375rem] text-slate-500">{item.original_name}</span>
                        </td>

                        {/* 자재명 드롭다운 */}
                        <td className="border-b border-slate-200 px-4 py-4">
                          <select
                            value={item.selected_name}
                            onChange={(e) => updateItem(item.uid, "selected_name", e.target.value)}
                            className={`h-11 w-full border px-3 text-[0.9375rem] focus:outline-none ${
                              !item.selected_name
                                ? "border-amber-400 bg-amber-50 focus:border-amber-600"
                                : "border-slate-300 bg-white focus:border-blue-900"
                            }`}
                          >
                            <option value="">— 자재명 선택 —</option>
                            {materialNames.map((name) => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </td>

                        {/* 규격 드롭다운 — 자재명 선택 후 해당 규격만 표시 */}
                        <td className="border-b border-slate-200 px-4 py-4">
                          {item.selected_name ? (
                            <select
                              value={item.selected_spec_id}
                              onChange={(e) => updateItem(item.uid, "selected_spec_id", e.target.value)}
                              className={`h-11 w-full border px-3 text-[0.9375rem] focus:outline-none ${
                                !item.selected_spec_id
                                  ? "border-amber-400 bg-amber-50 focus:border-amber-600"
                                  : "border-slate-300 bg-white focus:border-blue-900"
                              }`}
                            >
                              <option value="">— 규격 선택 —</option>
                              {specsForName.map((s) => (
                                <option key={s.id} value={String(s.id)}>
                                  {s.spec}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="border border-slate-200 bg-slate-100 px-3 py-2 text-[0.875rem] text-slate-400">
                              자재명을 먼저 선택하세요
                            </div>
                          )}
                        </td>

                        {/* 수량 */}
                        <td className="border-b border-slate-200 px-4 py-4">
                          <input
                            type="number" min={0}
                            value={item.edit_planned_qty}
                            onChange={(e) => updateItem(item.uid, "edit_planned_qty", e.target.value)}
                            className="h-11 w-full border border-slate-300 px-3 text-[1rem] focus:border-blue-900 focus:outline-none"
                          />
                        </td>

                        {/* 삭제 */}
                        <td className="border-b border-slate-200 px-3 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => deleteItem(item.uid)}
                            title="삭제"
                            className="mx-auto flex h-10 w-10 items-center justify-center border border-red-300 bg-white text-red-500 transition hover:border-red-400 hover:bg-red-50"
                          >
                            <FiTrash2 size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 추가 버튼 */}
            <button
              type="button" onClick={addItem}
              className="mt-4 flex w-full items-center justify-center gap-2 border border-dashed border-slate-400 bg-white py-4 text-[1.0625rem] font-medium text-slate-600 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-900"
            >
              <FiPlus size={20} />
              자재 항목 추가
            </button>

            {/* 미완료 안내 */}
            {incompleteCount > 0 && (
              <div className="mt-5 border border-amber-300 bg-amber-50 px-5 py-4 text-[1rem] text-amber-800">
                자재 또는 규격이 선택되지 않은 항목이 <strong>{incompleteCount}건</strong> 있습니다.
              </div>
            )}

            {/* 하단 버튼 */}
            <div className="mt-7 flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setStep(1); setErrorMsg(""); }}
                className="border border-slate-300 bg-white px-7 py-4 text-[1.0625rem] font-medium text-slate-700 hover:bg-slate-50"
              >
                ← 다시 업로드
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming || incompleteCount > 0}
                className="border border-blue-900 bg-blue-900 px-8 py-4 text-[1.125rem] font-medium text-white hover:bg-blue-950 disabled:bg-slate-400"
              >
                {confirming ? "확정 중..." : `견적 확정 (${parsedItems.length}개 자재)`}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function StepTab({ step, label, current }) {
  const isActive = current === step;
  const isDone = current > step;
  return (
    <div className={`flex flex-1 items-center gap-3 border-b-[3px] px-7 py-5 text-[1.0625rem] font-semibold ${
      isActive ? "border-blue-900 bg-blue-50 text-blue-900"
      : isDone ? "border-green-500 bg-green-50 text-green-700"
      : "border-transparent text-slate-400"
    }`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center text-[0.9375rem] font-bold ${
        isActive ? "bg-blue-900 text-white"
        : isDone ? "bg-green-500 text-white"
        : "bg-slate-200 text-slate-500"
      }`}>
        {isDone ? "✓" : step}
      </span>
      {label}
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div className="mt-6">
      <label className="mb-2 block text-[1.125rem] font-semibold text-slate-800">{label}</label>
      {children}
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="mb-6 border border-red-300 bg-red-50 px-5 py-4 text-[1.0625rem] text-red-700">{msg}</div>
  );
}
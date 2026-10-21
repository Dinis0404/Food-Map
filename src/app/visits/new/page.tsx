import { Suspense } from "react";
import VisitForm from "@/components/VisitForm";

export const metadata = { title: "記錄食評 | 食記地圖" };

export default function NewVisitPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">＋ 記錄食評</h1>
      <Suspense fallback={<div className="text-stone-400">載入中…</div>}>
        <VisitForm mode="create" />
      </Suspense>
    </div>
  );
}

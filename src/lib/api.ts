import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { HelpRequest, Need, ReferralStatus, Stage, Student, StudentDetail, Support } from "./ponte";

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`);
  return data;
}

export const useStudents = () => useQuery({ queryKey: ["students"], queryFn: () => request<Student[]>("students") });

export const useStudent = (id: number | undefined) =>
  useQuery({ queryKey: ["student", id], queryFn: () => request<StudentDetail>(`students/${id}`), enabled: !!id });

export const useSupports = (need?: Need, q?: string) =>
  useQuery({
    queryKey: ["supports", need ?? "", q ?? ""],
    queryFn: () => request<Support[]>(`supports?${new URLSearchParams({ ...(need ? { need } : {}), ...(q ? { q } : {}) })}`),
    placeholderData: (prev) => prev,
  });

export const useHelpRequests = () => useQuery({ queryKey: ["help"], queryFn: () => request<HelpRequest[]>("help") });

function useStudentMutation<V>(fn: (v: V) => Promise<StudentDetail>, success?: string | ((v: V) => string)) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, v) => {
      qc.setQueryData(["student", data.id], data);
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["help"] });
      if (success) toast.success(typeof success === "function" ? success(v) : success);
    },
    onError: (e) => toast.error(e.message),
  });
}

export interface NewStudent { name: string; turma: string; attendance: number; prev_attendance?: number | ""; grade: number; low_subjects?: number }
export const useAddStudent = () => useStudentMutation((s: NewStudent) => request<StudentDetail>("students", { method: "POST", body: s }), "Estudante adicionado");

export interface StudentPatch {
  stage?: Stage;
  need?: Need | null;
  identified?: string;
  responsible?: string;
  return_date?: string;
  attendance?: number;
  grade?: number;
  low_subjects?: number;
  note?: string;
}
export const useUpdateStudent = (id: number) =>
  useStudentMutation((p: StudentPatch & { toast?: string }) => request<StudentDetail>(`students/${id}`, { method: "PATCH", body: p }), (p) => p.toast ?? "Caso atualizado");

export const useAddReferrals = (id: number) =>
  useStudentMutation(
    (b: { support_ids: number[]; responsible?: string; return_date?: string; note?: string }) =>
      request<StudentDetail>(`students/${id}/referrals`, { method: "POST", body: b }),
    "Encaminhamento registrado",
  );

export const useReferralStatus = () =>
  useStudentMutation((b: { id: number; status: ReferralStatus }) => request<StudentDetail>(`referrals/${b.id}`, { method: "PATCH", body: { status: b.status } }), "Status atualizado");

export const useAskHelp = (id: number) =>
  useStudentMutation((message: string) => request<StudentDetail>(`students/${id}/help`, { method: "POST", body: { message } }), "Mensagem enviada para a equipe");

export function useResolveHelp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request(`help/${id}`, { method: "PATCH", body: { resolved: true } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["help"] }),
  });
}

export function useAddSupport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: Omit<Support, "id">) => request<Support>("supports", { method: "POST", body: s }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supports"] });
      toast.success("Apoio cadastrado");
    },
    onError: (e) => toast.error(e.message),
  });
}

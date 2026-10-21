import LoginForm from "@/components/LoginForm";

export const metadata = { title: "登入 | 食記地圖" };

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <LoginForm />
    </div>
  );
}

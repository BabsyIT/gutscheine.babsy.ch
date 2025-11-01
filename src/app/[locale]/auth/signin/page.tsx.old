import { signIn } from "@/auth";
import { FaGoogle, FaGithub } from "react-icons/fa";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Bei Babsy anmelden
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Melde dich an, um Gutscheine einzulösen und zu verwalten
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-semibold shadow-sm"
            >
              <FaGoogle className="text-xl" />
              Mit Google anmelden
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition font-semibold shadow-sm"
            >
              <FaGithub className="text-xl" />
              Mit GitHub anmelden
            </button>
          </form>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Noch kein Partner?
              </span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/partner"
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              Als Partner registrieren
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

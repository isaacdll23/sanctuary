import { useFetcher, useLoaderData } from "react-router";
import { useState } from "react";

export function meta() {
  return [{ title: "Profile" }];
}

export const loader = async ({ request }: any) => {
  const { requireAuth, getUserFromSession } = await import(
    "~/modules/auth.server"
  );
  await requireAuth(request);
  const user = await getUserFromSession(request);
  return { user };
};

export const action = async ({ request }: any) => {
  const { requireAuth, getUserFromSession } = await import(
    "~/modules/auth.server"
  );
  const { db } = await import("~/db");
  const { usersTable } = await import("~/db/schema");
  const { eq } = await import("drizzle-orm");
  await requireAuth(request);
  const user = await getUserFromSession(request);
  const formData = await request.formData();
  const username = String(formData.get("username"));
  const email = String(formData.get("email"));
  let errors: any = {};
  if (!username) errors.username = "Username is required.";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    errors.email = "Valid email is required.";
  if (Object.keys(errors).length > 0) {
    return { errors };
  }
  await db
    .update(usersTable)
    .set({ username, email })
    .where(eq(usersTable.id, user.id));
  return { success: true };
};

export default function Profile() {
  const { user } = useLoaderData() as any;
  const fetcher = useFetcher();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
  });
  const errors = fetcher.data?.errors;
  const success = fetcher.data?.success;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    fetcher.submit(form, { method: "post" });
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 md:p-8">
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl p-8 md:p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        {!editMode ? (
          <div className="space-y-4">
            <div>
              <span className="block text-slate-400 text-sm">Username</span>
              <span className="font-semibold text-lg">{user.username}</span>
            </div>
            <div>
              <span className="block text-slate-400 text-sm">Email</span>
              <span className="font-semibold text-lg">{user.email}</span>
            </div>
            <button
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg"
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <fetcher.Form
            method="post"
            className="space-y-4"
            onSubmit={handleEdit}
          >
            <div>
              <label
                className="block text-slate-400 text-sm mb-1"
                htmlFor="username"
              >
                Username
              </label>
              <input
                className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-slate-400"
                type="text"
                name="username"
                id="username"
                value={form.username}
                onChange={handleChange}
                required
                aria-label="Username"
              />
              {errors?.username && (
                <p className="text-red-400 text-sm mt-1">{errors.username}</p>
              )}
            </div>
            <div>
              <label
                className="block text-slate-400 text-sm mb-1"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-slate-400"
                type="email"
                name="email"
                id="email"
                value={form.email}
                onChange={handleChange}
                required
                aria-label="Email"
              />
              {errors?.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg"
              >
                Save Changes
              </button>
              <button
                type="button"
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            </div>
            {success && (
              <p className="text-green-400 text-sm mt-2">
                Profile updated successfully.
              </p>
            )}
          </fetcher.Form>
        )}
      </div>
    </div>
  );
}

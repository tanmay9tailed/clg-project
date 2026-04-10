import { useState } from "react";
import { Link } from "react-router-dom";

import { RoleGate } from "../components/RoleGate";
import { SectionHeading } from "../components/SectionHeading";
import { useWallet } from "../hooks/useWallet";
import { api } from "../lib/api";
import { achievementTypeOptions } from "../lib/constants";
import { getFriendlyError } from "../utils/format";

const initialFormState = {
  title: "",
  issuer: "",
  description: "",
  link: "",
  previewImage: "",
  type: "Academic",
  visibility: "public"
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-amber-200";

export const AddAchievementPage = () => {
  const { account, authenticated, userProfile } = useWallet();
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!authenticated || !account) {
      setError("Connect and verify your wallet before adding an achievement.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");
    setError("");

    try {
      await api.post("/achievement/add", {
        ...form,
        userAddress: account
      });

      setStatusMessage("Achievement added successfully. It will appear as self-added until verified.");
      setForm(initialFormState);
    } catch (submitError) {
      setError(
        getFriendlyError(submitError, "Unable to save the achievement right now.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authenticated || !account || userProfile?.role !== "receiver") {
    return <RoleGate role="receiver" />;
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[2.5rem] border border-white/70 bg-white/80 p-8 shadow-soft">
        <SectionHeading
          eyebrow="Add Achievement"
          title="Publish the milestones that complete your credential story."
          description="Self-added achievements capture hackathons, leadership, research, volunteering, and other work that may not yet exist as a blockchain certificate."
        />

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Title
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className={inputClass}
                placeholder="Winner, Smart India Hackathon"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Issuer
              <input
                type="text"
                name="issuer"
                value={form.issuer}
                onChange={handleChange}
                className={inputClass}
                placeholder="IIT Bombay"
                required
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="5"
              className={inputClass}
              placeholder="Summarize the outcome, impact, and why it matters."
              required
            />
          </label>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Proof link
              <input
                type="url"
                name="link"
                value={form.link}
                onChange={handleChange}
                className={inputClass}
                placeholder="https://..."
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Preview image or badge URL
              <input
                type="url"
                name="previewImage"
                value={form.previewImage}
                onChange={handleChange}
                className={inputClass}
                placeholder="https://.../badge.svg"
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Type
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={inputClass}
              >
                {achievementTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Visibility
            <select
              name="visibility"
              value={form.visibility}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>

          {statusMessage ? (
            <p className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900">
              {statusMessage}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-900">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Saving achievement..." : "Save achievement"}
          </button>
        </form>
      </div>

      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-white shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Public profile ranking inputs
          </p>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
            <li>Stronger issuer credibility pushes scores higher.</li>
            <li>Winning or top-rank language outperforms participation wording.</li>
            <li>Recent achievements carry more momentum in the portfolio order.</li>
            <li>Adding a clear proof link makes future verification much easier.</li>
          </ul>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-soft">
          <h3 className="font-display text-2xl font-semibold text-slate-950">
            After publishing
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            The item will appear in your dashboard immediately. Public achievements show up on
            your profile, private ones stay visible only to your wallet, and you can request
            issuer verification later from the dashboard.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
          >
            View dashboard
          </Link>
        </div>
      </aside>
    </section>
  );
};

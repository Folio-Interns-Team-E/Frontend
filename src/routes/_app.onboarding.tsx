import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { TopBar } from "../components/TopBar";
import { completeOnboarding } from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({
    meta: [{ title: "Set up your sales copilot · SalesSync AI" }],
  }),
  component: Onboarding,
});

function Onboarding() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const onboarding = useAppSelector((state) => state.app.onboarding);
  const [form, setForm] = useState({
    productName: onboarding.productName,
    productDescription: onboarding.productDescription,
    targetCustomer: onboarding.targetCustomer,
    goals: onboarding.goals,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    dispatch(completeOnboarding(form));
    void navigate({ to: "/" });
  }

  return (
    <>
      <TopBar title="Set up your AI sales team" />
      <div className="page-shell max-w-5xl">
        <div className="mb-8 rounded-2xl bg-primary px-8 py-7 text-white">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-fixed">
            Step 1 of 1
          </span>
          <h1 className="mt-2 text-3xl font-black">Tell SalesSync AI what you sell.</h1>
          <p className="mt-2 max-w-2xl text-sm text-primary-fixed">
            The assistant uses this information to generate your ICP, score leads, and ground every
            downstream recommendation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-5 rounded-xl border border-outline-variant bg-white p-6">
            <Field
              label="Product name"
              value={form.productName}
              onChange={(value) => setForm({ ...form, productName: value })}
            />
            <Field
              label="What does your product do?"
              multiline
              value={form.productDescription}
              onChange={(value) => setForm({ ...form, productDescription: value })}
            />
            <Field
              label="Who is your target customer?"
              multiline
              value={form.targetCustomer}
              onChange={(value) => setForm({ ...form, targetCustomer: value })}
            />
            <Field
              label="What should the sales copilot optimize for?"
              multiline
              value={form.goals}
              onChange={(value) => setForm({ ...form, goals: value })}
            />
            <button className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:opacity-90">
              Generate ICP and continue
            </button>
          </section>

          <aside className="h-fit rounded-xl border border-primary/20 bg-primary/5 p-6">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">auto_awesome</span>
              <h2 className="font-bold">Generated ICP preview</h2>
            </div>
            <div className="space-y-3">
              {onboarding.icp.map((item) => (
                <div key={item} className="flex gap-3 rounded-lg bg-white p-3 text-sm shadow-sm">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    check_circle
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </form>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  const classes =
    "mt-2 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";
  return (
    <label className="block text-sm font-semibold">
      {label}
      {multiline ? (
        <textarea
          className={`${classes} min-h-24 resize-y`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={classes}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

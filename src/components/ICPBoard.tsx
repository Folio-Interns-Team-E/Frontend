import { ReactNode } from "react";
import { ParsedICP } from "../lib/icpParser";

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/8 px-2.5 py-1 text-[10.5px] font-bold text-primary">
      {children}
    </span>
  );
}

function EmptyHint({ label }: { label: string }) {
  return <p className="text-[11px] italic text-on-surface-variant/70">No {label} captured yet.</p>;
}

function CardShell({
  icon,
  title,
  className = "",
  children,
}: {
  icon: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`app-card p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8">
          <span className="material-symbols-outlined text-[16px] text-primary">{icon}</span>
        </span>
        <h3 className="text-[12.5px] font-extrabold uppercase tracking-wide text-on-surface">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function BulletCard({
  icon,
  title,
  items,
  itemLabel,
}: {
  icon: string;
  title: string;
  items: string[];
  itemLabel: string;
}) {
  return (
    <CardShell icon={icon} title={title}>
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="flex items-start gap-2 text-[12px] leading-relaxed text-on-surface-variant"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyHint label={itemLabel} />
      )}
    </CardShell>
  );
}

export function ICPBoard({ icp }: { icp: ParsedICP }) {
  const hasEmployeeRange = icp.employeesMin || icp.employeesMax;
  const hasRevenueRange = icp.revenueMin || icp.revenueMax;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <CardShell icon="factory" title="Firmographics" className="sm:col-span-2 xl:col-span-1">
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Industries
            </p>
            {icp.industries.length ? (
              <div className="flex flex-wrap gap-1.5">
                {icp.industries.map((industry) => (
                  <Chip key={industry}>{industry}</Chip>
                ))}
              </div>
            ) : (
              <EmptyHint label="industries" />
            )}
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Company size
            </p>
            {hasEmployeeRange || hasRevenueRange ? (
              <div className="space-y-1 text-[12px] text-on-surface-variant">
                {hasEmployeeRange && (
                  <p>
                    <span className="font-semibold text-on-surface">Employees:</span>{" "}
                    {icp.employeesMin || "—"} – {icp.employeesMax || "—"}
                  </p>
                )}
                {hasRevenueRange && (
                  <p>
                    <span className="font-semibold text-on-surface">Revenue:</span>{" "}
                    {icp.revenueMin || "—"} – {icp.revenueMax || "—"}
                  </p>
                )}
              </div>
            ) : (
              <EmptyHint label="company size" />
            )}
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Geography
            </p>
            {icp.countries.length || icp.states.length || icp.cities.length ? (
              <div className="flex flex-wrap gap-1.5">
                {[...icp.countries, ...icp.states, ...icp.cities].map((place, index) => (
                  <Chip key={`${place}-${index}`}>{place}</Chip>
                ))}
              </div>
            ) : (
              <EmptyHint label="geography" />
            )}
          </div>
        </div>
      </CardShell>

      <CardShell icon="groups" title="Buyer personas" className="sm:col-span-2 xl:col-span-2">
        {icp.buyerPersonas.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {icp.buyerPersonas.map((persona, index) => (
              <div
                key={`${persona.title}-${index}`}
                className="rounded-lg border border-outline-variant/50 bg-surface-container-low/30 p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-bold text-on-surface">{persona.title}</p>
                  {persona.decisionMaker && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                      Decision maker
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[10.5px] text-on-surface-variant">
                  {[persona.department, persona.seniority].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint label="buyer personas" />
        )}
      </CardShell>

      <BulletCard icon="warning" title="Pain points" items={icp.painPoints} itemLabel="pain points" />
      <BulletCard icon="flag" title="Business goals" items={icp.businessGoals} itemLabel="business goals" />
      <BulletCard
        icon="bolt"
        title="Buying triggers"
        items={icp.buyingTriggers}
        itemLabel="buying triggers"
      />
      <BulletCard
        icon="workspace_premium"
        title="Value proposition"
        items={icp.valueProposition}
        itemLabel="value propositions"
      />

      <CardShell icon="dns" title="Tech stack">
        {icp.techStack.length ? (
          <div className="flex flex-wrap gap-1.5">
            {icp.techStack.map((tech) => (
              <Chip key={tech}>{tech}</Chip>
            ))}
          </div>
        ) : (
          <EmptyHint label="tech stack" />
        )}
      </CardShell>

      <BulletCard
        icon="block"
        title="Disqualifiers"
        items={icp.disqualifiers}
        itemLabel="disqualifiers"
      />

      <CardShell icon="sell" title="Keywords">
        {icp.keywords.length ? (
          <div className="flex flex-wrap gap-1.5">
            {icp.keywords.map((keyword) => (
              <Chip key={keyword}>{keyword}</Chip>
            ))}
          </div>
        ) : (
          <EmptyHint label="keywords" />
        )}
      </CardShell>

      {icp.notes.length > 0 && (
        <BulletCard icon="sticky_note_2" title="Notes" items={icp.notes} itemLabel="notes" />
      )}
    </div>
  );
}
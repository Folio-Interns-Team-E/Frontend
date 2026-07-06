import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "../components/TopBar";
import { selectMeeting } from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/meetings")({
  head: () => ({
    meta: [
      { title: "Meetings · SalesSync AI" },
      {
        name: "description",
        content: "Weekly meeting calendar with agendas and quick join actions.",
      },
    ],
  }),
  component: Meetings,
});

const days = [
  { d: "MON", n: 11 },
  { d: "TUE", n: 12 },
  { d: "WED", n: 13, today: true },
  { d: "THU", n: 14 },
  { d: "FRI", n: 15 },
];
const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

const upcoming = [
  {
    icon: "video_camera_front",
    title: "Product Walkthrough - Stellar Inc",
    sub: "Scheduled for 1:30 PM • 30 mins",
    avatars: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAqDCQjnzNt29YB-4QuqpIaawvYCRy36Z5_SRVlApsxOHqT6Iel1tjfcWZCozcC9vQKHzFKyNoH8tpbWSzAGsYmmmbFOlueecVm0YDfAOKB5-NJ7fRKBXHASx9uO-u1abyPrEAu4tCIetqPEWaw69c_hM-1H3C1gHuCdTX4yWOlk-4S7vbvW2zvRPKhNjGMuBnWtOFq5a_3Fu82Pk_RyjeakYYx9PCJ3LDDoOPJTtp0ObEmAKoTjRz0HDGOP_qGGIm9qXON6cyP5A",
    ],
    extra: "+2",
  },
  {
    icon: "handshake",
    title: "Negotiation Phase II",
    sub: "Scheduled for 3:00 PM • 60 mins",
    avatars: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAj7HZukzRNPiZLEiSueRDxiHgHMhY0pfZ7kNfxjKuLL-hFgnu7EsXQJJ4cjKxLRgvpWESm4eMGtadzrRJr0eVhHpbLLZQIoQl2Yb6PLtus7zNci4fsIxjB-kgNR3z4m2tbRpDTsPca8dJjH0fSbjLzmims3vA5olAtGm1rMMQfwb-FB5N3UBiel-RYP4JRvRuggeOhpjVmpAMgv856egUFLtMu3KAvwzPliI8wsq11TtHengJcZYutp6PtYV14VvFAnyfXK3dqyw",
    ],
  },
  {
    icon: "call",
    title: "Discovery Call - Vertex Global",
    sub: "Scheduled for 4:30 PM • 15 mins",
    avatars: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBhfY2rB043_ze44ZW32B7YbWLSYaYWbJRoaJ4g1FY-qx6CqcDvAGL7GAyijDSmzNmRoT7ohtcfleX2Yjvu2XyerR48KdcVvYSmtLurUh25qus5wfUSMgIHBSmsgoY5RiszeNI6zopW6t2jzHFnbQ64jjilTCrrCuq0TNQhZG8a_9xFXt_J8X5mBt7CErM6zb7o86zM2kQBajMefrPKx8gkfMGaoE6SDyMFn_zDZQgqX0YfYjYiQpyn_jhx18Xr5PpS45kJ818TLw",
    ],
  },
];

function Meetings() {
  const dispatch = useAppDispatch();
  const meetings = useAppSelector((state) => state.app.meetings);
  const selectedMeetingId = useAppSelector((state) => state.app.selectedMeetingId);
  const calendarConnected = useAppSelector((state) => state.app.integrations.calendar);
  const selectedMeeting =
    meetings.find((meeting) => meeting.id === selectedMeetingId) ?? meetings[0];

  return (
    <>
      <TopBar title="Meetings" />
      <div className="page-shell">
        {!calendarConnected && (
          <div className="mb-5 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            Google Calendar is not connected. Connect it in Settings to sync bookings.
          </div>
        )}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-display-lg font-display-lg text-on-surface">September 11 – 17</h2>
            <p className="text-on-surface-variant font-body-base">
              You have 12 meetings scheduled this week.
            </p>
          </div>
          <div className="flex gap-2 bg-surface-container-low p-1 rounded-lg border border-outline-variant">
            <button className="px-4 py-1.5 bg-surface-container-lowest shadow-sm rounded-md text-primary font-semibold text-body-sm">
              Week
            </button>
            <button className="px-4 py-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-body-sm">
              Day
            </button>
            <button className="px-4 py-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-body-sm">
              Month
            </button>
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
          <div className="grid grid-cols-8">
            <div className="col-span-1 border-r border-outline-variant bg-surface-container-lowest">
              <div className="h-12 border-b border-outline-variant flex items-center justify-center">
                <span className="text-[11px] text-on-surface-variant uppercase font-label-caps">
                  Time
                </span>
              </div>
              <div className="divide-y divide-outline-variant/50">
                {times.map((t) => (
                  <div
                    key={t}
                    className="h-16 flex items-start justify-end px-3 pt-2 text-[11px] text-on-surface-variant"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-7 grid grid-cols-5 divide-x divide-outline-variant">
              {days.map((d) => (
                <div
                  key={d.d}
                  className={`h-12 border-b border-outline-variant flex flex-col items-center justify-center ${
                    d.today ? "bg-primary/5" : "bg-surface-container-lowest"
                  }`}
                >
                  <span
                    className={`text-[11px] font-label-caps ${
                      d.today ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {d.d}
                  </span>
                  <span className={`font-bold text-body-base ${d.today ? "text-primary" : ""}`}>
                    {d.n}
                  </span>
                </div>
              ))}
              {/* Mon */}
              <div className="relative h-[448px]" />
              {/* Tue */}
              <div className="relative h-[448px]" />
              {/* Wed */}
              <div className="relative h-[448px]">
                <div className="absolute top-[80px] left-1 right-1 h-20 bg-primary/20 border-l-4 border-primary rounded-r px-2 py-1 cursor-pointer">
                  <p className="text-[11px] font-bold text-primary truncate">Acme Corp Demo</p>
                  <p className="text-[10px] text-on-primary-fixed-variant">10:15 - 11:30 AM</p>
                </div>
              </div>
              {/* Thu */}
              <div className="relative h-[448px]">
                <div className="absolute top-[208px] left-1 right-1 h-12 bg-primary/20 border-l-4 border-primary rounded-r px-2 py-1 cursor-pointer">
                  <p className="text-[11px] font-bold text-primary truncate">Quick Sync: Dev</p>
                  <p className="text-[10px] text-on-primary-fixed-variant">2:00 PM</p>
                </div>
              </div>
              {/* Fri (active w/ popover) */}
              <div className="relative h-[448px]">
                <div className="absolute top-[32px] left-1 right-1 h-24 bg-primary/20 border-l-4 border-primary rounded-r px-2 py-1 ring-2 ring-primary/40 shadow-lg z-20 cursor-pointer">
                  <p className="text-[11px] font-bold text-primary truncate">Strategy Session</p>
                  <p className="text-[10px] text-on-primary-fixed-variant">9:30 - 11:00 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedMeeting && (
          <section className="mt-8 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-xl border border-outline-variant bg-white p-5">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    Meeting details
                  </span>
                  <h3 className="mt-1 text-xl font-bold">{selectedMeeting.company}</h3>
                  <p className="text-sm text-on-surface-variant">
                    {selectedMeeting.client} · {selectedMeeting.time} · {selectedMeeting.duration}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    selectedMeeting.status === "Live"
                      ? "bg-red-50 text-red-700"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {selectedMeeting.status}
                </span>
              </div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Agenda
              </p>
              <div className="space-y-2">
                {selectedMeeting.agenda.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      check_circle
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Live transcription</h3>
                  <p className="text-sm text-on-surface-variant">
                    Structured notes become proposal context after the call.
                  </p>
                </div>
                <span className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                  {selectedMeeting.status === "Live" ? "Recording" : "Transcript"}
                </span>
              </div>
              <div className="min-h-32 space-y-3 rounded-lg bg-surface-container-low p-4">
                {selectedMeeting.transcript.length ? (
                  selectedMeeting.transcript.map((line) => (
                    <p key={line} className="text-sm leading-relaxed">
                      {line}
                    </p>
                  ))
                ) : (
                  <div className="flex min-h-24 items-center justify-center text-sm text-on-surface-variant">
                    Transcription will begin when the meeting starts.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
              Upcoming Today
            </h3>
            <button className="text-primary font-semibold text-body-sm hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {meetings.map((u) => (
              <div
                key={u.id}
                onClick={() => dispatch(selectMeeting(u.id))}
                className={`flex cursor-pointer items-center justify-between p-4 bg-white border rounded-xl transition-colors ${
                  u.id === selectedMeetingId
                    ? "border-primary ring-2 ring-primary/10"
                    : "border-outline-variant hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      video_camera_front
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-body-base">
                      {u.company} · {u.client}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      {u.date} at {u.time} · {u.duration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold">
                    {u.status}
                  </span>
                  <button className="px-4 py-1.5 border border-outline-variant rounded-lg text-body-sm font-medium hover:bg-surface-container transition-colors">
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

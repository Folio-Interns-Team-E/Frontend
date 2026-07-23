import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { selectMeeting } from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { SkeletonList } from "../components/ui/skeleton";
import { fetchMeetings } from "../store/apiThunks";

export const Route = createFileRoute("/_app/meetings")({
  head: () => ({ meta: [{ title: "Meetings - SalesSync AI" }] }),
  component: Meetings,
});

function Meetings() {
  const dispatch = useAppDispatch();
  const meetings = useAppSelector((state) => state.app.meetings);
  const meetingsStatus = useAppSelector((state) => state.app.meetingsStatus);
  const selectedMeetingId = useAppSelector((state) => state.app.selectedMeetingId);
  const calendarConnected = useAppSelector((state) => state.app.integrations.calendly);
  const selectedMeeting =
    meetings.find((meeting) => meeting.id === selectedMeetingId) ?? meetings[0];

  useEffect(() => {
    dispatch(fetchMeetings());
  }, [dispatch]);

  return (
    <>
      <TopBar title="Meetings" />
      <div className="page-shell space-y-6">
      

        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-heading mb-1">Calendar</p>
            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-on-surface">
              Scheduled meetings
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {meetings.length} meeting{meetings.length === 1 ? "" : "s"} in your sales pipeline.
            </p>
          </div>
        </section>

        {meetingsStatus === "loading" ? (
          <SkeletonList count={4} />
        ) : meetings.length === 0 ? (
          <section className="empty-state section-panel">
            <span className="material-symbols-outlined text-4xl text-outline">event_busy</span>
            <p className="mt-3 font-semibold">No meetings scheduled</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Meetings created from your leads will appear here.
            </p>
          </section>
        ) : (
          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="section-panel">
              <div className="border-b border-outline-variant/45 px-5 py-4 text-sm font-bold">
                All meetings
              </div>
              <div className="divide-y divide-outline-variant/50">
                {meetings.map((meeting) => (
                  <button
                    key={meeting.id}
                    onClick={() => dispatch(selectMeeting(meeting.id))}
                    className={`flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-surface-container-low/60 sm:gap-4 sm:px-5 ${
                      selectedMeeting?.id === meeting.id
                        ? "bg-primary/[0.055] shadow-[inset_3px_0_0_var(--color-primary)]"
                        : ""
                    }`}
                  >
                    <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">
                      video_camera_front
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">
                        {meeting.company || meeting.client || "Sales meeting"}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-on-surface-variant">
                        {meeting.client} - {meeting.date} at {meeting.time}
                      </span>
                    </span>
                    <span className="hidden rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold sm:inline-flex">
                      {meeting.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {selectedMeeting && (
              <section className="section-panel p-5 sm:p-6">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Meeting details
                </span>
                <h3 className="mt-2 text-xl font-bold">
                  {selectedMeeting.company || selectedMeeting.client || "Sales meeting"}
                </h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {selectedMeeting.client} - {selectedMeeting.date} at {selectedMeeting.time} -{" "}
                  {selectedMeeting.duration}
                </p>
                <span className="mt-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {selectedMeeting.status}
                </span>

                <div className="mt-6">
                  <h4 className="text-sm font-bold">Agenda</h4>
                  {selectedMeeting.agenda.length ? (
                    <ul className="mt-3 space-y-2 text-sm text-on-surface">
                      {selectedMeeting.agenda.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-on-surface-variant">
                      No agenda has been added.
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-bold">Notes and transcript</h4>
                  {selectedMeeting.notes && (
                    <p className="mt-2 text-sm text-on-surface-variant">{selectedMeeting.notes}</p>
                  )}
                  {selectedMeeting.transcript.length ? (
                    <div className="mt-3 space-y-2 rounded-lg bg-surface-container-low p-4 text-sm">
                      {selectedMeeting.transcript.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    !selectedMeeting.notes && (
                      <p className="mt-2 text-sm text-on-surface-variant">
                        No notes or transcript yet.
                      </p>
                    )
                  )}
                </div>
              </section>
            )}
          </section>
        )}
      </div>
    </>
  );
}

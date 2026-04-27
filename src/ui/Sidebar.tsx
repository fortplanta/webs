import { SessionRecord } from '../api/types';

// Left sidebar: wordmark, query input, session history, stats. Implemented in Session 02.
export default function Sidebar(_props: {
  sessions: SessionRecord[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: (query: string) => void;
}) {
  return null;
}

import { MessageCircle, Search, Send, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import Alert from "../components/Alert.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import PageHeader from "../components/PageHeader.jsx";
import UserAvatar from "../components/UserAvatar.jsx";
import useApi from "../hooks/useApi.js";
import useAuth from "../hooks/useAuth.js";

function Conversation({ person, onSent }) {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(`/messages/conversation/${person.user_id}`);
  const [text, setText] = useState("");
  const [sendError, setSendError] = useState("");
  const threadRef = useRef(null);
  useEffect(() => { threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" }); }, [data.length]);
  const send = async (event) => {
    event.preventDefault(); if (!text.trim()) return;
    try { await api.post("/messages", { receiver_id: person.user_id, content: text.trim() }); setText(""); setSendError(""); await reload(); onSent(); }
    catch (requestError) { setSendError(getErrorMessage(requestError)); }
  };
  return <div className="conversation-pane"><div className="conversation-head"><UserAvatar name={person.full_name} size="small" /><div><strong>{person.full_name}</strong><small><i /> Active marketplace conversation</small></div><Link className="conversation-report" to={`/${user.role}/reports`} title="Report a safety concern"><ShieldAlert size={16} /><span>Safety</span></Link></div><Alert>{error || sendError}</Alert><div className="message-thread" ref={threadRef}>{loading ? <LoadingSpinner /> : data.length ? data.map((message) => <div className={message.sender_id === user.id ? "message-bubble own" : "message-bubble"} key={message.id}><p>{message.content}</p><small>{new Date(message.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</small></div>) : <EmptyState icon={MessageCircle} title="Start the conversation" text="Ask about availability, goals, or what to prepare for your first class." />}</div><form className="message-form" onSubmit={send}><label><span className="sr-only">Message {person.full_name}</span><input value={text} onChange={(event) => setText(event.target.value)} placeholder={`Message ${person.full_name.split(" ")[0]}…`} /></label><button className="button" aria-label="Send message"><span>Send</span><Send size={16} /></button></form></div>;
}

export default function MessagesPage() {
  const { data, loading, error, reload } = useApi("/messages/conversations");
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const selected = data.find((item) => item.user_id === selectedId) || data[0];
  const filtered = useMemo(() => data.filter((person) => `${person.full_name} ${person.last_message}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  useEffect(() => { if (!selectedId && data[0]) setSelectedId(data[0].user_id); }, [data, selectedId]);
  return <section className="messages-page"><PageHeader eyebrow="Direct messages" title="Conversations, without the clutter" description="Keep every student–mentor conversation organized, searchable, and easy to revisit." /><Alert>{error}</Alert><div className="messages-layout"><aside className="conversation-list"><div className="conversation-list-head"><div><h2>Inbox</h2><span>{data.length} conversation{data.length === 1 ? "" : "s"}</span></div><label className="conversation-search"><Search size={15} /><span className="sr-only">Search conversations</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages" /></label></div>{loading ? <LoadingSpinner /> : filtered.length ? filtered.map((person) => <button className={selected?.user_id === person.user_id ? "conversation-item active" : "conversation-item"} key={person.user_id} onClick={() => setSelectedId(person.user_id)}><UserAvatar name={person.full_name} size="small" /><div><strong>{person.full_name}</strong><p>{person.last_message}</p></div>{person.unread_count > 0 && <b>{person.unread_count}</b>}</button>) : <EmptyState icon={MessageCircle} title={query ? "No matching messages" : "No conversations"} text={query ? "Try another name or phrase." : "Messages from a tutor or student connection will appear here."} />}</aside>{selected ? <Conversation key={selected.user_id} person={selected} onSent={reload} /> : <div className="conversation-empty"><EmptyState icon={MessageCircle} title="Choose a conversation" /></div>}</div></section>;
}

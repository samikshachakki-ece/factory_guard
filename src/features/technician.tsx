import { useNavigate } from '@tanstack/react-router';
import { Wrench, RotateCcw } from 'lucide-react';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input';
import { Button } from '@/components/ui/button';
import { initialMessages } from '@/data/technician';
import { PageHeading, DemoBadge, MachineSelect, Status, EmptyState } from '@/components/factoryguard/shared';
import { useFactory } from '@/components/factoryguard/state';

export function TechnicianPage({ machineId }: { machineId: string }) {
  const { messages, setMessages, machines, dataLoading } = useFactory();
  const machine = machines.find((item) => item.id === machineId);
  const navigate = useNavigate();

  return <>
    <PageHeading title="AI Technician" description="A troubleshooting workspace for your engineering questions."><DemoBadge /></PageHeading>
    <div className="technician-layout">
      <section className="chat-panel">
        <div className="chat-header"><div className="technician-identity"><span className="technician-mark"><Wrench size={20} /></span><div><h2>FactoryGuard Technician</h2><span>Demo transcript · No backend chat endpoint</span></div></div><Button variant="ghost" size="icon" title="Reset demo transcript" aria-label="Reset demo transcript" onClick={() => setMessages(initialMessages)}><RotateCcw size={16} /></Button></div>
        <Conversation className="chat-transcript"><ConversationContent>{messages.map((message) => <Message key={message.id} from={message.role}><div className="message-label">{message.role === 'assistant' ? 'FACTORYGUARD · DEMO' : 'YOU'}</div><MessageContent>{message.parts.map((part, index) => part.type === 'text' ? <MessageResponse key={index}>{part.text}</MessageResponse> : null)}</MessageContent></Message>)}</ConversationContent><ConversationScrollButton /></Conversation>
        <div role="status" className="demo-notice"><Wrench size={18} /><div><strong>DEMO CONVERSATION ONLY</strong><p>The backend does not provide a technician chat endpoint. Messages cannot be sent to a technician.</p></div></div>
        <div className="chat-composer"><PromptInput onSubmit={() => undefined}><PromptInputTextarea disabled aria-label="Technician chat unavailable" placeholder="Technician chat is not connected" /><PromptInputFooter><span className="muted-small">No chat service configured</span><PromptInputSubmit aria-label="Chat unavailable" status="ready" disabled /></PromptInputFooter></PromptInput></div>
      </section>
      <aside className="context-panel"><div className="context-section"><h2>Machine context</h2>{machines.length ? <MachineSelect value={machine ? machine.id : machines[0].id} onChange={(selected) => navigate({ to: '/technician', search: { machine: selected } })} /> : <EmptyState title={dataLoading ? 'Loading machines...' : 'Machine data unavailable'} detail={dataLoading ? 'Waiting for the backend inventory.' : 'No machine context is available.'} />}
        {machine && <><div className="context-machine"><div><span className="machine-id">{machine.id}</span><Status status={machine.status} /></div><h3>{machine.name}</h3><p>{machine.type} · {machine.line}</p></div><div className="context-readings"><div><span>Temperature</span><strong>{machine.temperature} °C</strong></div><div><span>Vibration</span><strong>{machine.vibration === undefined ? 'Unavailable' : `${machine.vibration} mm/s`}</strong></div><div><span>Pressure</span><strong>{machine.pressure === undefined ? 'Unavailable' : `${machine.pressure} bar`}</strong></div></div></>}
      </div></aside>
    </div>
  </>;
}

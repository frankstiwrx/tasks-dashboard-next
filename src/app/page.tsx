'use client';
import { useEffect, useMemo, useState } from 'react';

type Priority = 'urgent' | 'high' | 'normal' | 'low';
type Task = { id: number; title: string; done: boolean; priority: Priority };
type List = { id: number; name: string; tasks: Task[] };

const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 3, high: 2, normal: 1, low: 0,
};
const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: 'Urgente', high: 'Alta', normal: 'Normal', low: 'Baixa',
};

export default function Home() {
  const [lists, setLists] = useState<List[]>([]);
  const [newListName, setNewListName] = useState('');

  // carregar/salvar
  useEffect(() => {
    const raw = localStorage.getItem('lists');
    if (raw) { try { setLists(JSON.parse(raw)); } catch {} }
  }, []);
  useEffect(() => {
    localStorage.setItem('lists', JSON.stringify(lists));
  }, [lists]);

  // ===== LISTAS =====
  function addList() {
    const name = newListName.trim();
    if (!name) return;
    setLists(prev => [{ id: Date.now(), name, tasks: [] }, ...prev]);
    setNewListName('');
  }
  function removeList(id: number) {
    setLists(prev => prev.filter(l => l.id !== id));
  }
  function renameList(id: number, name: string) {
    setLists(prev => prev.map(l => (l.id === id ? { ...l, name } : l)));
  }

  // ===== TASKS =====
  function addTask(listId: number, title: string, priority: Priority) {
    const t = title.trim(); if (!t) return;
    const newTask: Task = { id: Date.now(), title: t, done: false, priority };
    setLists(prev => prev.map(l => l.id === listId ? { ...l, tasks: [newTask, ...l.tasks] } : l));
  }
  function toggleTask(listId: number, taskId: number) {
    setLists(prev => prev.map(l =>
      l.id === listId
        ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) }
        : l
    ));
  }
  function removeTask(listId: number, taskId: number) {
    setLists(prev => prev.map(l =>
      l.id === listId ? { ...l, tasks: l.tasks.filter(t => t.id !== taskId) } : l
    ));
  }
  function clearDone(listId: number) {
    setLists(prev => prev.map(l =>
      l.id === listId ? { ...l, tasks: l.tasks.filter(t => !t.done) } : l
    ));
  }
  function setPriority(listId: number, taskId: number, prio: Priority) {
    setLists(prev => prev.map(l =>
      l.id === listId
        ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, priority: prio } : t) }
        : l
    ));
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Tasks Dashboard </h1>

      {/* criar lista */}
      <div className="flex gap-2">
        <input
          className="border p-2 rounded flex-1"
          placeholder="Nome da nova lista (Trabalho, Estudos, ...)"
          value={newListName}
          onChange={e=>setNewListName(e.target.value)}
          onKeyDown={e=>e.key==='Enter' && addList()}
        />
        <button onClick={addList} className="px-3 rounded bg-black text-white">Criar lista</button>
      </div>

      {lists.length === 0 && <p className="text-gray-500">Nenhuma lista ainda. Crie a primeira acima 👆</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {lists.map(list => (
          <ListCard
            key={list.id}
            list={list}
            onRename={(name)=>renameList(list.id, name)}
            onRemove={()=>removeList(list.id)}
            onAddTask={(title, p)=>addTask(list.id, title, p)}
            onToggle={(taskId)=>toggleTask(list.id, taskId)}
            onRemoveTask={(taskId)=>removeTask(list.id, taskId)}
            onClearDone={()=>clearDone(list.id)}
            onSetPriority={(taskId, p)=>setPriority(list.id, taskId, p)}
          />
        ))}
      </div>
    </main>
  );
}

function ListCard({
  list,
  onRename, onRemove,
  onAddTask, onToggle, onRemoveTask, onClearDone, onSetPriority,
}: {
  list: List;
  onRename: (name: string) => void;
  onRemove: () => void;
  onAddTask: (title: string, priority: Priority) => void;
  onToggle: (taskId: number) => void;
  onRemoveTask: (taskId: number) => void;
  onClearDone: () => void;
  onSetPriority: (taskId: number, p: Priority) => void;
}) {
  const [title, setTitle] = useState('');
  const [priority, setPrio] = useState<Priority>('normal');
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(list.name);

  const doneCount = list.tasks.filter(t => t.done).length;

  // ordena: prioridade desc, depois não concluídas primeiro, depois por data (id)
  const sortedTasks = useMemo(() => {
    return [...list.tasks].sort((a, b) => {
      const byPrio = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      if (byPrio !== 0) return byPrio;
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.id - a.id;
    });
  }, [list.tasks]);

  return (
    <section className="border rounded p-3 space-y-3">
      {/* header */}
      <div className="flex items-center justify-between gap-2">
        {editingName ? (
          <input
            className="border p-1 rounded flex-1"
            value={name}
            onChange={e=>setName(e.target.value)}
            onKeyDown={e=>{
              if (e.key==='Enter') { onRename(name.trim() || list.name); setEditingName(false); }
              if (e.key==='Escape') { setName(list.name); setEditingName(false); }
            }}
            onBlur={()=>{ onRename(name.trim() || list.name); setEditingName(false); }}
            autoFocus
          />
        ) : (
          <h2 className="font-semibold text-lg cursor-text" onClick={()=>setEditingName(true)} title="Clique para renomear">
            {list.name}
          </h2>
        )}
        <div className="text-sm text-gray-600">{doneCount}/{list.tasks.length}</div>
        <button onClick={onRemove} className="text-sm">Excluir lista</button>
      </div>

      {/* add task */}
      <div className="flex gap-2">
        <input
          className="border p-2 rounded flex-1"
          placeholder="Nova tarefa"
          value={title}
          onChange={e=>setTitle(e.target.value)}
          onKeyDown={e=>e.key==='Enter' && (onAddTask(title, priority), setTitle(''))}
        />
        <select
          className="border p-2 rounded"
          value={priority}
          onChange={e=>setPrio(e.target.value as Priority)}
          title="Prioridade"
        >
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="normal">Normal</option>
          <option value="low">Baixa</option>
        </select>
        <button
          onClick={()=>{ onAddTask(title, priority); setTitle(''); }}
          className="px-3 rounded bg-black text-white"
        >
          Adicionar
        </button>
      </div>

      {/* tasks */}
      {sortedTasks.length === 0 ? (
        <p className="text-gray-500 text-sm">Sem tarefas aqui.</p>
      ) : (
        <ul className="space-y-2">
          {sortedTasks.map(t => (
            <li key={t.id} className="border rounded p-2 flex justify-between items-center gap-3">
              <button onClick={()=>onToggle(t.id)} className="text-left flex-1">
                {t.done ? '✅' : '⬜'}{' '}
                <span className={t.done ? 'line-through text-gray-500' : ''}>{t.title}</span>
              </button>

              {/* tag de prioridade + seletor */}
              <span className={`text-xs px-2 py-1 rounded ${
                t.priority==='urgent' ? 'bg-red-100' :
                t.priority==='high'   ? 'bg-orange-100' :
                t.priority==='normal' ? 'bg-green-100' :
                                        'bg-gray-100'
              }`}>
                {PRIORITY_LABEL[t.priority]}
              </span>

              <select
                className="border p-1 rounded text-sm"
                value={t.priority}
                onChange={e=>onSetPriority(t.id, e.target.value as Priority)}
                title="Mudar prioridade"
              >
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="normal">Normal</option>
                <option value="low">Baixa</option>
              </select>

              <button onClick={()=>onRemoveTask(t.id)} className="text-sm">Excluir</button>
            </li>
          ))}
        </ul>
      )}

      {doneCount > 0 && (
        <button onClick={onClearDone} className="text-sm underline">Limpar concluídas</button>
      )}
    </section>
  );
}

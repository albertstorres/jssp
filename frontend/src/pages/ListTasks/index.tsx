import './styles.css';
import Header from '../../components/Header';
import { useState } from 'react';
import GetTasks, { Task } from '../../components/GetTasks';
import GetTask from '../../components/GetTask';

function ListTasks() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  function handleTaskSelect(task: Task, event: React.MouseEvent<HTMLLIElement, MouseEvent>) {
    setSelectedTask(task);
    setPopoverPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleClosePopover() {
    setSelectedTask(null);
    setPopoverPosition(null);
  }

  return (
    <>
      <Header />
      <div className="list-tasks-container">
        <div className="main-title">
          <h1>Lista de Tarefas</h1>
        </div>

        <GetTasks
          onSelectTask={handleTaskSelect}
          selectedTasks={selectedTask ? [selectedTask] : []}
          showAll={true}
        />

        {selectedTask && popoverPosition && (
          <div
            className="get-task-popover"
            style={{
              position: 'absolute',
              top: popoverPosition.y + 10,
              left: popoverPosition.x + 10,
              zIndex: 9999,
            }}
          >
            <button
              onClick={handleClosePopover}
              style={{
                float: 'right',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#999',
              }}
            >
              ✖
            </button>
            <GetTask taskId={selectedTask.id} />
          </div>
        )}
      </div>
    </>
  );
}

export default ListTasks;
import './styles.css';
import Header from '../../components/Header';
import { useState } from 'react';
import GetTasksInProgressByTeamId, { Task } from '../../components/GetTasksInProgressByTeamId';
import GetTask from '../../components/GetTask';
import FinalizeTask from '../../components/FinalizeTask';

function MainWorker() {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [popoverPosition, setPopoverPosition] = useState<{x: number; y: number} | null>(null);
    const [reloadSignal, setReloadSignal] = useState(0);

    function handleTaskSelect(task: Task, event: React.MouseEvent<HTMLLIElement, MouseEvent>) {
        setSelectedTask(task);
        setPopoverPosition({
            x: event.clientX,
            y: event.clientY,
        });
    }

    function handleClosePopover() {
        setPopoverPosition(null);
    }

    function handleConfirmSelection() {
        handleClosePopover();
    }

    function handleTaskFinalized() {
        setReloadSignal((prev) => prev + 1);
        setSelectedTask(null);
    }

    return(
   <>
      <Header />
      <div className="container-main-worker">
        <div className="main-worker">
          <h1 className="main-worker-title">Minhas Tarefas em Andamento</h1>

          <GetTasksInProgressByTeamId
            onSelectTask={handleTaskSelect}
            selectedTasks={selectedTask ? [selectedTask] : []}
            reloadSignal={reloadSignal}
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
                onClick={handleConfirmSelection}
                style={{
                  float: 'right',
                  border: 'none',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginBottom: '10px',
                  transition: 'background-color 0.3s ease',
                }}
              >
                Selecionar
              </button>
              <GetTask taskId={selectedTask.id} />
            </div>
          )}

          {selectedTask && (
            <FinalizeTask
              taskId={selectedTask.id}
              onTaskFinalized={handleTaskFinalized}
            />
          )}
        </div>
      </div>
    </>
    );
}


export default MainWorker;
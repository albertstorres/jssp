import './styles.css';
import Header from '../../components/Header';
import { useState } from 'react';
import GetWorkers, { Worker } from '../../components/GetWorkers';
import GetWorker from '../../components/GetWorker';

function ListWorkers() {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  function handleWorkerSelect(worker: Worker, event: React.MouseEvent<HTMLLIElement, MouseEvent>) {
    setSelectedWorker(worker);
    setPopoverPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleClosePopover() {
    setSelectedWorker(null);
    setPopoverPosition(null);
  }

  return (
    <>
      <Header />
      <div className="list-workers-container">
        <div className="main-title">
          <h1>Lista de Trabalhadores</h1>
        </div>

        <GetWorkers
          onSelectWorker={handleWorkerSelect}
          selectedWorkers={selectedWorker ? [selectedWorker] : []}
        />

        {selectedWorker && popoverPosition && (
          <div
            className="get-worker-popover"
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
            <GetWorker workerId={selectedWorker.id} />
          </div>
        )}
      </div>
    </>
  );
}

export default ListWorkers;
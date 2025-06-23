import './styles.css';
import Header from '../../components/Header';
import { useState } from 'react';
import GetOperations from '../../components/GetOperations';
import GetOperation from '../../components/GetOperation';

export interface Operation {
  id: number;
  name: string;
  begin: string;
  end: string;
  finalized: boolean;
}

function ListOperations() {
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  function handleOperationSelect(operation: Operation, event: React.MouseEvent<HTMLLIElement, MouseEvent>) {
    setSelectedOperation(operation);
    setPopoverPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleClosePopover() {
    setSelectedOperation(null);
    setPopoverPosition(null);
  }

  return (
    <>
      <Header />
      <div className="list-operations-container">
        <div className="main-title">
          <h1>Lista de Operações</h1>
        </div>

        <GetOperations
          onSelectOperation={handleOperationSelect}
          selectedOperations={selectedOperation ? [selectedOperation] : []}
          showAll={true}
        />

        {selectedOperation && popoverPosition && (
          <div
            className="get-operation-popover"
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
            <GetOperation operationId={selectedOperation.id} />
          </div>
        )}
      </div>
    </>
  );
}

export default ListOperations;
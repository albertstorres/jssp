import './styles.css';
import Header from '../../components/Header';
import { useState } from 'react';
import GetEquipments, { Equipment } from '../../components/GetEquipments';
import GetEquipment from '../../components/GetEquipment';

function ListEquipments() {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  function handleEquipmentSelect(equipment: Equipment, event: React.MouseEvent<HTMLLIElement, MouseEvent>) {
    setSelectedEquipment(equipment);
    setPopoverPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleClosePopover() {
    setSelectedEquipment(null);
    setPopoverPosition(null);
  }

  return (
    <>
      <Header />
      <div className="list-equipments-container">
        <div className="main-title">
          <h1>Lista de Equipamentos</h1>
        </div>

        <GetEquipments
          onSelectEquipment={handleEquipmentSelect}
          selectedEquipments={selectedEquipment ? [selectedEquipment] : []}
          showAll={true}
        />

        {selectedEquipment && popoverPosition && (
          <div
            className="get-equipment-popover"
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
            <GetEquipment equipmentId={selectedEquipment.id} />
          </div>
        )}
      </div>
    </>
  );
}

export default ListEquipments;
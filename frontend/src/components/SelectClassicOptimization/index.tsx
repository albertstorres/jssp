import './styles.css';

interface ClassicOptimizationProps {
  onClick: () => void;
  isSelected: boolean;
}

function SelectClassicOptimization({ onClick, isSelected }: ClassicOptimizationProps) {
  return (
    <div
      className={`optimization-card classic ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      Otimização Clássica
    </div>
  );
}

export default SelectClassicOptimization;